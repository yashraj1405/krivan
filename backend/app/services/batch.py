from typing import List, Optional, Tuple
import uuid
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.exceptions.custom import NotFoundError, ConflictError
from app.models.batch import Batch, BatchStatus
from app.models.scan_log import ScanLog
from app.models.dispatch import Dispatch
from app.repositories.batch import BatchRepository
from app.repositories.product import ProductRepository
from app.repositories.dispatch import DispatchRepository
from app.schemas.batch import (
    BatchCreate, BatchUpdate, BatchResponse,
    BatchHistoryResponse, BatchHistoryDispatchEntry, BatchHistoryScanEntry
)


class BatchService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.batch_repo = BatchRepository(db)
        self.product_repo = ProductRepository(db)
        self.dispatch_repo = DispatchRepository(db)

    def _to_response(self, batch: Batch) -> BatchResponse:
        scan_count = self.db.query(func.count(ScanLog.id)).filter(ScanLog.batch_id == batch.id).scalar() or 0
        dispatched_qty = self.dispatch_repo.get_total_dispatched_for_batch(batch.id)
        remaining_qty = max(0, batch.quantity - dispatched_qty)

        resp = BatchResponse.model_validate(batch)
        resp.scan_count = scan_count
        resp.dispatched_quantity = dispatched_qty
        resp.remaining_quantity = remaining_qty
        return resp

    def create_batch(self, batch_in: BatchCreate) -> BatchResponse:
        # Verify product exists
        product = self.product_repo.get_by_id(batch_in.product_id)
        if not product:
            raise NotFoundError("Product linked to this batch does not exist")

        # Verify batch number is unique
        existing = self.batch_repo.get_by_batch_number(batch_in.batch_number)
        if existing:
            raise ConflictError(f"Batch with number '{batch_in.batch_number}' already exists")

        # Validate status enum
        data = batch_in.model_dump()
        try:
            data["status"] = BatchStatus(data.get("status", "Draft"))
        except ValueError:
            data["status"] = BatchStatus.DRAFT

        batch = self.batch_repo.create(data)
        return self._to_response(batch)

    def get_batch(self, id: uuid.UUID) -> BatchResponse:
        batch = self.batch_repo.get_by_id(id)
        if not batch:
            raise NotFoundError("Batch not found")
        return self._to_response(batch)

    def list_batches(
        self,
        *,
        search: Optional[str] = None,
        product_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[BatchResponse], int]:
        valid_sort_fields = [
            "created_at", "batch_number", "manufacturing_date",
            "expiry_date", "quantity", "status", "mrp"
        ]
        if sort_by not in valid_sort_fields:
            sort_by = "created_at"
        items, total = self.batch_repo.get_filtered(
            search=search,
            product_id=product_id,
            status=status,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=limit
        )
        return [self._to_response(b) for b in items], total

    def update_batch(self, id: uuid.UUID, batch_in: BatchUpdate) -> BatchResponse:
        batch = self.batch_repo.get_by_id(id)
        if not batch:
            raise NotFoundError("Batch not found")
        update_data = batch_in.model_dump(exclude_unset=True)

        if "product_id" in update_data and update_data["product_id"] != batch.product_id:
            product = self.product_repo.get_by_id(update_data["product_id"])
            if not product:
                raise NotFoundError("Product linked to this batch does not exist")

        if "batch_number" in update_data and update_data["batch_number"] != batch.batch_number:
            existing = self.batch_repo.get_by_batch_number(update_data["batch_number"])
            if existing:
                raise ConflictError(f"Batch with number '{update_data['batch_number']}' already exists")

        # Validate status enum if provided
        if "status" in update_data:
            try:
                update_data["status"] = BatchStatus(update_data["status"])
            except ValueError:
                raise ConflictError(f"Invalid batch status: '{update_data['status']}'")

        updated = self.batch_repo.update(batch, update_data)
        return self._to_response(updated)

    def delete_batch(self, id: uuid.UUID) -> BatchResponse:
        batch = self.batch_repo.get_by_id(id)
        if not batch:
            raise NotFoundError("Batch not found")

        # Block deletion if QR token has been generated
        if batch.qr_token:
            raise ConflictError(
                f"Cannot delete batch '{batch.batch_number}': QR code has been generated. "
                "Remove the QR code first."
            )

        resp = self._to_response(batch)
        self.batch_repo.delete(id)
        return resp

    def get_batch_history(self, id: uuid.UUID) -> BatchHistoryResponse:
        batch = self.batch_repo.get_by_id(id)
        if not batch:
            raise NotFoundError("Batch not found")

        # Product name
        product = self.product_repo.get_by_id(batch.product_id)
        product_name = product.product_name if product else "Unknown"

        # Dispatches
        dispatches_raw = self.dispatch_repo.get_dispatches_for_batch(batch.id)
        dispatch_entries = []
        dispatched_qty = 0
        for d in dispatches_raw:
            dispatched_qty += d.quantity
            dispatch_entries.append(BatchHistoryDispatchEntry(
                dispatch_number=d.dispatch_number,
                dealer_name=d.dealer.dealer_name if d.dealer else "Unknown",
                dealer_code=d.dealer.dealer_code if d.dealer else "N/A",
                quantity=d.quantity,
                invoice_number=d.invoice_number,
                transport_name=d.transport_name,
                vehicle_number=d.vehicle_number,
                lr_number=d.lr_number,
                remarks=d.remarks,
                dispatch_date=d.dispatch_date,
            ))

        # Scans
        scans_raw = (
            self.db.query(ScanLog)
            .filter(ScanLog.batch_id == batch.id)
            .order_by(ScanLog.scanned_at.desc())
            .limit(50)
            .all()
        )
        scan_entries = [
            BatchHistoryScanEntry(
                scanned_at=s.scanned_at,
                ip_address=s.ip_address,
                user_agent=s.user_agent
            ) for s in scans_raw
        ]

        return BatchHistoryResponse(
            batch_id=batch.id,
            batch_number=batch.batch_number,
            product_name=product_name,
            total_quantity=batch.quantity,
            dispatched_quantity=dispatched_qty,
            remaining_quantity=max(0, batch.quantity - dispatched_qty),
            manufacturing_date=batch.manufacturing_date,
            expiry_date=batch.expiry_date,
            qr_generated_at=batch.qr_generated_at,
            status=batch.status.value if isinstance(batch.status, BatchStatus) else str(batch.status),
            dispatches=dispatch_entries,
            scans=scan_entries,
        )
