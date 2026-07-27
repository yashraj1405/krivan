from typing import Optional, Any
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.dispatch import DispatchCreate, DispatchUpdate, DispatchResponse, DispatchListResponse
from app.services.dispatch import DispatchService
from app.security.jwt import get_current_active_user

router = APIRouter()


@router.post(
    "/",
    response_model=DispatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a batch dispatch to dealer"
)
def create_dispatch(
    dispatch_in: DispatchCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> DispatchResponse:
    """
    Record dispatch of a batch quantity to a registered dealer.
    Validates that quantity does not exceed remaining batch inventory.
    """
    service = DispatchService(db)
    return service.create_dispatch(dispatch_in)


@router.get(
    "/",
    response_model=DispatchListResponse,
    status_code=status.HTTP_200_OK,
    summary="List and filter dispatches"
)
def list_dispatches(
    search: Optional[str] = Query(None, description="Search by dispatch #, invoice #, vehicle #, batch #, or dealer name"),
    batch_id: Optional[uuid.UUID] = Query(None, description="Filter dispatches by batch UUID"),
    dealer_id: Optional[uuid.UUID] = Query(None, description="Filter dispatches by dealer UUID"),
    sort_by: str = Query("created_at", description="Sort field name"),
    sort_order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),
    skip: int = Query(0, ge=0, description="Offset count"),
    limit: int = Query(100, ge=1, le=100, description="Page limit sizes"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> DispatchListResponse:
    """
    Retrieve dispatch log with pagination, search, and batch/dealer filter options.
    """
    service = DispatchService(db)
    items, total = service.list_dispatches(
        search=search,
        batch_id=batch_id,
        dealer_id=dealer_id,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit
    )
    return DispatchListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get(
    "/{id}",
    response_model=DispatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Get dispatch details"
)
def get_dispatch(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> DispatchResponse:
    """
    Lookup a dispatch record by UUID.
    """
    service = DispatchService(db)
    return service.get_dispatch(id)


@router.put(
    "/{id}",
    response_model=DispatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Update dispatch details"
)
def update_dispatch(
    id: uuid.UUID,
    dispatch_in: DispatchUpdate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> DispatchResponse:
    """
    Modify attributes of an existing dispatch record.
    """
    service = DispatchService(db)
    return service.update_dispatch(id, dispatch_in)


@router.delete(
    "/{id}",
    response_model=DispatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancel/Delete a dispatch"
)
def delete_dispatch(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> DispatchResponse:
    """
    Delete a dispatch record.
    """
    service = DispatchService(db)
    return service.delete_dispatch(id)
