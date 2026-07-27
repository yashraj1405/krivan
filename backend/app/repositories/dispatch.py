from typing import List, Optional, Tuple
import uuid
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, asc, func
from app.models.dispatch import Dispatch
from app.models.batch import Batch
from app.models.dealer import Dealer
from app.repositories.base import BaseRepository


class DispatchRepository(BaseRepository[Dispatch]):
    def __init__(self, db: Session) -> None:
        super().__init__(Dispatch, db)

    def get_by_dispatch_number(self, dispatch_number: str) -> Optional[Dispatch]:
        return (
            self.db.query(Dispatch)
            .filter(Dispatch.dispatch_number == dispatch_number)
            .first()
        )

    def get_total_dispatched_for_batch(self, batch_id: uuid.UUID) -> int:
        result = (
            self.db.query(func.sum(Dispatch.quantity))
            .filter(Dispatch.batch_id == batch_id)
            .scalar()
        )
        return result or 0

    def get_dispatches_for_batch(self, batch_id: uuid.UUID) -> List[Dispatch]:
        return (
            self.db.query(Dispatch)
            .options(joinedload(Dispatch.dealer))
            .filter(Dispatch.batch_id == batch_id)
            .order_by(Dispatch.dispatch_date.desc())
            .all()
        )

    def get_filtered(
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
        query = (
            self.db.query(Dispatch)
            .join(Dispatch.batch)
            .join(Dispatch.dealer)
            .options(
                joinedload(Dispatch.batch).joinedload(Batch.product),
                joinedload(Dispatch.dealer)
            )
        )

        if search:
            search_filter = or_(
                Dispatch.dispatch_number.ilike(f"%{search}%"),
                Dispatch.invoice_number.ilike(f"%{search}%"),
                Dispatch.transport_name.ilike(f"%{search}%"),
                Dispatch.vehicle_number.ilike(f"%{search}%"),
                Batch.batch_number.ilike(f"%{search}%"),
                Dealer.dealer_name.ilike(f"%{search}%"),
            )
            query = query.filter(search_filter)

        if batch_id:
            query = query.filter(Dispatch.batch_id == batch_id)
        if dealer_id:
            query = query.filter(Dispatch.dealer_id == dealer_id)

        sort_col = getattr(Dispatch, sort_by, Dispatch.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        total_count = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total_count
