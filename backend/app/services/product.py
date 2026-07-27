from typing import List, Optional, Tuple
import uuid
from sqlalchemy.orm import Session
from app.exceptions.custom import NotFoundError, ConflictError
from app.models.product import Product
from app.repositories.product import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, db: Session) -> None:
        self.product_repo = ProductRepository(db)

    def create_product(self, product_in: ProductCreate) -> Product:
        existing = self.product_repo.get_by_code(product_in.product_code)
        if existing:
            raise ConflictError(f"Product with code '{product_in.product_code}' already exists")
        return self.product_repo.create(product_in.model_dump())

    def get_product(self, id: uuid.UUID) -> Product:
        product = self.product_repo.get_by_id(id)
        if not product:
            raise NotFoundError("Product not found")
        return product

    def list_products(
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
        # Validate sort_by attributes to prevent SQL injection or model exceptions
        if sort_by not in ["created_at", "updated_at", "product_name", "product_code"]:
            sort_by = "created_at"
        return self.product_repo.get_filtered(
            search=search,
            category=category,
            is_active=is_active,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=limit
        )

    def update_product(self, id: uuid.UUID, product_in: ProductUpdate) -> Product:
        product = self.get_product(id)
        update_data = product_in.model_dump(exclude_unset=True)

        if "product_code" in update_data and update_data["product_code"] != product.product_code:
            existing = self.product_repo.get_by_code(update_data["product_code"])
            if existing:
                raise ConflictError(f"Product with code '{update_data['product_code']}' already exists")

        return self.product_repo.update(product, update_data)

    def delete_product(self, id: uuid.UUID) -> Product:
        product = self.get_product(id)
        self.product_repo.delete(id)
        return product
