from datetime import datetime, timezone
import secrets
import string
from typing import List, Optional, Tuple
import uuid
from sqlalchemy.orm import Session
from app.exceptions.custom import NotFoundError, ConflictError, ValidationError
from app.models.batch import Batch, BatchStatus
from app.models.dealer import Dealer
from app.models.dispatch import Dispatch
from app.repositories.batch import BatchRepository
from app.repositories.dealer import DealerRepository
from app.repositories.dispatch import DispatchRepository
from app.schemas.dispatch import DispatchCreate, DispatchUpdate, DispatchResponse


class DispatchService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.dispatch_repo = DispatchRepository(db)
        self.batch_repo = BatchRepository(db)
        self.dealer_repo = DealerRepository(db)

    def _generate_dispatch_number(self) -> str:
        date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        rand_str = "".join(secrets.choice(string.digits) for _ in range(4))
        code = f"DSP-{date_str}-{rand_str}"
        while self.dispatch_repo.get_by_dispatch_number(code):
            rand_str = "".join(secrets.choice(string.digits) for _ in range(4))
            code = f"DSP-{date_str}-{rand_str}"
        return code

    def create_dispatch(self, dispatch_in: DispatchCreate) -> Dispatch:
        # 1. Validate Batch exists
        batch = self.batch_repo.get_by_id(dispatch_in.batch_id)
        if not batch:
            raise NotFoundError("Manufacturing batch not found")

        # 2. Validate Dealer exists
        dealer = self.dealer_repo.get_by_id(dispatch_in.dealer_id)
        if not dealer:
            raise NotFoundError("Dealer record not found")

        # 3. Calculate remaining inventory
        already_dispatched = self.dispatch_repo.get_total_dispatched_for_batch(batch.id)
        remaining_qty = batch.quantity - already_dispatched

        if dispatch_in.quantity > remaining_qty:
            raise ValidationError(
                f"Cannot dispatch {dispatch_in.quantity} units. "
                f"Batch '{batch.batch_number}' only has {remaining_qty} units remaining "
                f"(Total Produced: {batch.quantity}, Already Dispatched: {already_dispatched})."
            )

        # 4. Generate dispatch_number and set date
        data = dispatch_in.model_dump()
        if not data.get("dispatch_number"):
            data["dispatch_number"] = self._generate_dispatch_number()
        else:
            existing = self.dispatch_repo.get_by_dispatch_number(data["dispatch_number"])
            if existing:
                raise ConflictError(f"Dispatch number '{data['dispatch_number']}' already exists")

        if not data.get("dispatch_date"):
            data["dispatch_date"] = datetime.now(timezone.utc)

        # 5. Create dispatch record
        dispatch = self.dispatch_repo.create(data)

        # 6. Update Batch status to Dispatched
        if batch.status in [
            BatchStatus.DRAFT,
            BatchStatus.PRODUCTION,
            BatchStatus.QR_GENERATED,
            BatchStatus.PRINTED,
            BatchStatus.PACKED,
        ]:
            batch.status = BatchStatus.DISPATCHED
            self.db.commit()

        return dispatch

    def get_dispatch(self, id: uuid.UUID) -> Dispatch:
        dispatch = self.dispatch_repo.get_by_id(id)
        if not dispatch:
            raise NotFoundError("Dispatch record not found")
        return dispatch

    def list_dispatches(
        self,
        *,
        search: Optional[str] = None,
        batch_id: Optional[uuid.UUID] = None,
        dealer_id: Optional[uuid.UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Dispatch], int]:
        valid_sorts = ["created_at", "dispatch_number", "dispatch_date", "quantity"]
        if sort_by not in valid_sorts:
            sort_by = "created_at"
        return self.dispatch_repo.get_filtered(
            search=search,
            batch_id=batch_id,
            dealer_id=dealer_id,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=limit
        )

    def update_dispatch(self, id: uuid.UUID, dispatch_in: DispatchUpdate) -> Dispatch:
        dispatch = self.get_dispatch(id)
        update_data = dispatch_in.model_dump(exclude_unset=True)

        batch_id = update_data.get("batch_id", dispatch.batch_id)
        batch = self.batch_repo.get_by_id(batch_id)
        if not batch:
            raise NotFoundError("Manufacturing batch not found")

        # Validate remaining quantity if quantity is updated
        if "quantity" in update_data:
            new_qty = update_data["quantity"]
            already_dispatched = self.dispatch_repo.get_total_dispatched_for_batch(batch_id)
            # Subtract current dispatch quantity before checking limit
            other_dispatched = already_dispatched - (dispatch.quantity if dispatch.batch_id == batch_id else 0)
            remaining = batch.quantity - other_dispatched
            if new_qty > remaining:
                raise ValidationError(
                    f"Cannot set quantity to {new_qty}. Available remaining quantity is {remaining}."
                )

        if "dispatch_number" in update_data and update_data["dispatch_number"] != dispatch.dispatch_number:
            existing = self.dispatch_repo.get_by_dispatch_number(update_data["dispatch_number"])
            if existing:
                raise ConflictError(f"Dispatch number '{update_data['dispatch_number']}' already exists")

        return self.dispatch_repo.update(dispatch, update_data)

    def delete_dispatch(self, id: uuid.UUID) -> Dispatch:
        dispatch = self.get_dispatch(id)
        self.dispatch_repo.delete(id)
        return dispatch
