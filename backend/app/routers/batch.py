import os
from typing import Optional, Any
import uuid
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.exceptions.custom import NotFoundError
from app.schemas.batch import BatchCreate, BatchUpdate, BatchResponse, BatchListResponse, BatchHistoryResponse
from app.schemas.qr import BatchQRResponse, QRGenerateRequest
from app.services.batch import BatchService
from app.services.qr import QRService
from app.security.jwt import get_current_active_user

router = APIRouter()


@router.post(
    "/",
    response_model=BatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a production batch"
)
def create_batch(
    batch_in: BatchCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> BatchResponse:
    """
    Register a newly manufactured product batch.
    """
    service = BatchService(db)
    return service.create_batch(batch_in)


@router.get(
    "/",
    response_model=BatchListResponse,
    status_code=status.HTTP_200_OK,
    summary="List and filter batches"
)
def list_batches(
    search: Optional[str] = Query(None, description="Search by batch number or product name"),
    product_id: Optional[uuid.UUID] = Query(None, description="Filter by product ID"),
    batch_status: Optional[str] = Query(None, alias="status", description="Filter by batch status"),
    sort_by: str = Query("created_at", description="Sort field name"),
    sort_order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),
    skip: int = Query(0, ge=0, description="Offset count"),
    limit: int = Query(100, ge=1, le=100, description="Page limit"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> BatchListResponse:
    """
    Retrieve product batches with full paging, search, and filter options.
    """
    service = BatchService(db)
    items, total = service.list_batches(
        search=search,
        product_id=product_id,
        status=batch_status,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit
    )
    return BatchListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get(
    "/qr-codes/download/{token}",
    response_class=FileResponse,
    summary="Download Batch QR code PNG image"
)
def download_qr_image(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Public trigger to download the generated QR PNG file for a batch.
    """
    static_dir = os.path.join("static", "qrcodes")
    file_path = os.path.join(static_dir, f"{token}.png")

    if not os.path.exists(file_path):
        raise NotFoundError("QR code image file not found")

    return FileResponse(
        path=file_path,
        filename=f"QR_{token}.png",
        media_type="image/png"
    )


@router.post(
    "/{id}/generate-qr",
    response_model=BatchQRResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate or regenerate QR Code for a Batch"
)
def generate_batch_qr(
    id: uuid.UUID,
    req_body: Optional[QRGenerateRequest] = None,
    force: bool = Query(False, description="Force regeneration of QR token"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> BatchQRResponse:
    """
    Generates a unique QR token and PNG for the batch.
    If a QR code already exists, returns existing unless force/force_regenerate is True.
    """
    force_regen = force or (req_body.force_regenerate if req_body else False)
    service = QRService(db)
    return service.generate_qr_for_batch(id, force_regenerate=force_regen)


@router.get(
    "/{id}/qr",
    response_model=BatchQRResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Batch QR Details"
)
def get_batch_qr(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> BatchQRResponse:
    """
    Retrieves the generated QR code token, image URL, and scan metrics for a batch.
    """
    service = QRService(db)
    return service.get_batch_qr(id)


@router.get(
    "/{id}/history",
    response_model=BatchHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get batch dispatch and scan history timeline"
)
def get_batch_history(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> BatchHistoryResponse:
    """
    Returns the complete lifecycle timeline of a batch:
    Manufacturing → QR Generated → Dispatches → Customer Scans
    """
    service = BatchService(db)
    return service.get_batch_history(id)


@router.get(
    "/{id}",
    response_model=BatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Get batch details"
)
def get_batch(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> BatchResponse:
    """
    Retrieve a batch profile record by UUID.
    """
    service = BatchService(db)
    return service.get_batch(id)


@router.put(
    "/{id}",
    response_model=BatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Update batch parameters"
)
def update_batch(
    id: uuid.UUID,
    batch_in: BatchUpdate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> BatchResponse:
    """
    Modify attributes of an existing batch record.
    """
    service = BatchService(db)
    return service.update_batch(id, batch_in)


@router.delete(
    "/{id}",
    response_model=BatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a batch"
)
def delete_batch(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> BatchResponse:
    """
    Permanently delete a production batch.
    """
    service = BatchService(db)
    return service.delete_batch(id)
