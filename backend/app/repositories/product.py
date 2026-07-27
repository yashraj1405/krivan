from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.models.product import Product
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: Session) -> None:
        super().__init__(Product, db)

    def get_by_code(self, product_code: str) -> Optional[Product]:
        return self.db.query(Product).filter(Product.product_code == product_code).first()

    def get_filtered(
        self,
        *,
        search: Optional[str] = None,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Product], int]:
        query = self.db.query(Product)

        # Searching
        if search:
            search_filter = or_(
                Product.product_name.ilike(f"%{search}%"),
                Product.product_code.ilike(f"%{search}%"),
                Product.composition.ilike(f"%{search}%"),
            )
            query = query.filter(search_filter)

        # Filtering
        if category:
            query = query.filter(Product.category == category)
        if is_active is not None:
            query = query.filter(Product.is_active == is_active)

        # Sorting
        sort_col = getattr(Product, sort_by, Product.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        # Total Count
        total_count = query.count()

        # Pagination
        items = query.offset(skip).limit(limit).all()
        return items, total_count
