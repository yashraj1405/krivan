from typing import Optional, Any
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.dealer import DealerCreate, DealerUpdate, DealerResponse, DealerListResponse
from app.services.dealer import DealerService
from app.security.jwt import get_current_active_user

router = APIRouter()


@router.post(
    "/",
    response_model=DealerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new dealer"
)
def create_dealer(
    dealer_in: DealerCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> DealerResponse:
    """
    Create a new dealer record with physical, contact, and fiscal metadata (GST).
    """
    service = DealerService(db)
    return service.create_dealer(dealer_in)


@router.get(
    "/",
    response_model=DealerListResponse,
    status_code=status.HTTP_200_OK,
    summary="List and filter registered dealers"
)
def list_dealers(
    search: Optional[str] = Query(None, description="Search term matching dealer code/name/owner/phone/gst/email"),
    city: Optional[str] = Query(None, description="Filter dealers by city"),
    state: Optional[str] = Query(None, description="Filter dealers by state"),
    dealer_status: Optional[str] = Query(None, alias="status", description="Filter by status ('Active' or 'Inactive')"),
    sort_by: str = Query("created_at", description="Sort field name"),
    sort_order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),
    skip: int = Query(0, ge=0, description="Offset count"),
    limit: int = Query(100, ge=1, le=100, description="Page limit sizes"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> DealerListResponse:
    """
    Retrieve registered dealers catalog with pagination, search, and filter parameters.
    """
    service = DealerService(db)
    items, total = service.list_dealers(
        search=search,
        city=city,
        state=state,
        status=dealer_status,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit
    )
    return DealerListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get(
    "/{id}",
    response_model=DealerResponse,
    status_code=status.HTTP_200_OK,
    summary="Get dealer details"
)
def get_dealer(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> DealerResponse:
    """
    Lookup a dealer record by UUID.
    """
    service = DealerService(db)
    return service.get_dealer(id)


@router.put(
    "/{id}",
    response_model=DealerResponse,
    status_code=status.HTTP_200_OK,
    summary="Update dealer details"
)
def update_dealer(
    id: uuid.UUID,
    dealer_in: DealerUpdate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> DealerResponse:
    """
    Update details of an existing registered dealer.
    """
    service = DealerService(db)
    return service.update_dealer(id, dealer_in)


@router.delete(
    "/{id}",
    response_model=DealerResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a dealer registration"
)
def delete_dealer(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> DealerResponse:
    """
    Delete a dealer registry profile and any active constraints.
    """
    service = DealerService(db)
    return service.delete_dealer(id)
