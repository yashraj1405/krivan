from typing import Optional, Any
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.services.product import ProductService
from app.security.jwt import get_current_active_user

router = APIRouter()


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new fertilizer product"
)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> ProductResponse:
    """
    Register a new product in the central catalogue.
    """
    service = ProductService(db)
    return service.create_product(product_in)


@router.get(
    "/",
    response_model=ProductListResponse,
    status_code=status.HTTP_200_OK,
    summary="List products with filtering and pagination"
)
def list_products(
    search: Optional[str] = Query(None, description="Search term for code, name, category, or composition"),
    category: Optional[str] = Query(None, description="Filter products by category name"),
    is_active: Optional[bool] = Query(None, description="Filter products by active status"),
    sort_by: str = Query("created_at", description="Sort field name"),
    sort_order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),
    skip: int = Query(0, ge=0, description="Offset count"),
    limit: int = Query(100, ge=1, le=100, description="Page limit sizes"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> ProductListResponse:
    """
    Retrieve products from database with filter, sorting, and pagination parameters.
    """
    service = ProductService(db)
    items, total = service.list_products(
        search=search,
        category=category,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit
    )
    return ProductListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get(
    "/{id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Get product profile by ID"
)
def get_product(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> ProductResponse:
    """
    Fetch a single catalog product profile.
    """
    service = ProductService(db)
    return service.get_product(id)


@router.put(
    "/{id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Update product details"
)
def update_product(
    id: uuid.UUID,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> ProductResponse:
    """
    Modify attributes of an existing catalog product.
    """
    service = ProductService(db)
    return service.update_product(id, product_in)


@router.delete(
    "/{id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a product profile"
)
def delete_product(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> ProductResponse:
    """
    Delete a product record and all associated relational constraints.
    """
    service = ProductService(db)
    return service.delete_product(id)
