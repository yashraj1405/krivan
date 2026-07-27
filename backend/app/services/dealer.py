import secrets
import string
from typing import List, Optional, Tuple
import uuid
from sqlalchemy.orm import Session
from app.exceptions.custom import NotFoundError, ConflictError
from app.models.dealer import Dealer
from app.repositories.dealer import DealerRepository
from app.schemas.dealer import DealerCreate, DealerUpdate


class DealerService:
    def __init__(self, db: Session) -> None:
        self.dealer_repo = DealerRepository(db)

    def _generate_dealer_code(self) -> str:
        code = "DLR-" + "".join(secrets.choice(string.digits) for _ in range(6))
        while self.dealer_repo.get_by_dealer_code(code):
            code = "DLR-" + "".join(secrets.choice(string.digits) for _ in range(6))
        return code

    def create_dealer(self, dealer_in: DealerCreate) -> Dealer:
        # Validate GST uniqueness
        existing_gst = self.dealer_repo.get_by_gst(dealer_in.gst_number)
        if existing_gst:
            raise ConflictError(f"Dealer with GST '{dealer_in.gst_number}' already exists")

        data = dealer_in.model_dump()
        if not data.get("dealer_code"):
            data["dealer_code"] = self._generate_dealer_code()
        else:
            existing_code = self.dealer_repo.get_by_dealer_code(data["dealer_code"])
            if existing_code:
                raise ConflictError(f"Dealer code '{data['dealer_code']}' is already in use")

        return self.dealer_repo.create(data)

    def get_dealer(self, id: uuid.UUID) -> Dealer:
        dealer = self.dealer_repo.get_by_id(id)
        if not dealer:
            raise NotFoundError("Dealer not found")
        return dealer

    def list_dealers(
        self,
        *,
        search: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Dealer], int]:
        valid_sorts = ["created_at", "dealer_code", "dealer_name", "owner_name", "city", "state", "status"]
        if sort_by not in valid_sorts:
            sort_by = "created_at"
        return self.dealer_repo.get_filtered(
            search=search,
            city=city,
            state=state,
            status=status,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=limit
        )

    def update_dealer(self, id: uuid.UUID, dealer_in: DealerUpdate) -> Dealer:
        dealer = self.get_dealer(id)
        update_data = dealer_in.model_dump(exclude_unset=True)

        if "gst_number" in update_data and update_data["gst_number"] != dealer.gst_number:
            existing = self.dealer_repo.get_by_gst(update_data["gst_number"])
            if existing:
                raise ConflictError(f"Dealer with GST '{update_data['gst_number']}' already exists")

        if "dealer_code" in update_data and update_data["dealer_code"] != dealer.dealer_code:
            existing = self.dealer_repo.get_by_dealer_code(update_data["dealer_code"])
            if existing:
                raise ConflictError(f"Dealer code '{update_data['dealer_code']}' is already in use")

        return self.dealer_repo.update(dealer, update_data)

    def delete_dealer(self, id: uuid.UUID) -> Dealer:
        dealer = self.get_dealer(id)
        self.dealer_repo.delete(id)
        return dealer
