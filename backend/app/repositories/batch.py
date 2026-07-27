from typing import List, Optional, Tuple
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.models.batch import Batch, BatchStatus
from app.models.product import Product
from app.repositories.base import BaseRepository


class BatchRepository(BaseRepository[Batch]):
    def __init__(self, db: Session) -> None:
        super().__init__(Batch, db)

    def get_by_id(self, id: uuid.UUID) -> Optional[Batch]:
        from sqlalchemy.orm import joinedload
        return self.db.query(Batch).options(joinedload(Batch.product)).filter(Batch.id == id).first()

    def get_by_batch_number(self, batch_number: str) -> Optional[Batch]:
        return self.db.query(Batch).filter(Batch.batch_number == batch_number).first()

    def get_filtered(
        self,
        *,
        search: Optional[str] = None,
        product_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Batch], int]:
        query = self.db.query(Batch).join(Product)

        # Search across batch number and product name
        if search:
            search_filter = or_(
                Batch.batch_number.ilike(f"%{search}%"),
                Product.product_name.ilike(f"%{search}%"),
            )
            query = query.filter(search_filter)

        # Filter by product
        if product_id:
            query = query.filter(Batch.product_id == product_id)

        # Filter by status
        if status:
            try:
                status_enum = BatchStatus(status)
                query = query.filter(Batch.status == status_enum)
            except ValueError:
                pass  # Ignore invalid status values

        # Sorting
        sort_col = getattr(Batch, sort_by, Batch.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        total_count = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total_count
