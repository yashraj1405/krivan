from typing import List, Dict, Any, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models.product import Product
from app.models.batch import Batch
from app.models.dealer import Dealer
from app.models.dispatch import Dispatch
from app.models.scan_log import ScanLog


class DashboardRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_counts(self) -> Dict[str, Any]:
        total_products = self.db.query(func.count(Product.id)).scalar() or 0
        total_batches = self.db.query(func.count(Batch.id)).scalar() or 0
        total_dealers = self.db.query(func.count(Dealer.id)).scalar() or 0
        active_dealers = self.db.query(func.count(Dealer.id)).filter(Dealer.status == "Active").scalar() or 0
        total_qrs = self.db.query(func.count(Batch.id)).filter(Batch.qr_token.isnot(None)).scalar() or 0
        total_scans = self.db.query(func.count(ScanLog.id)).scalar() or 0
        total_dispatches = self.db.query(func.count(Dispatch.id)).scalar() or 0

        # Total manufactured quantity
        total_manufactured = self.db.query(func.sum(Batch.quantity)).scalar() or 0
        # Total dispatched quantity
        total_dispatched_qty = self.db.query(func.sum(Dispatch.quantity)).scalar() or 0
        # Remaining inventory
        remaining_inventory = max(0, total_manufactured - total_dispatched_qty)

        # Last generated QR batch
        last_batch = (
            self.db.query(Batch)
            .options(joinedload(Batch.product))
            .filter(Batch.qr_token.isnot(None))
            .order_by(Batch.qr_generated_at.desc().nullslast(), Batch.created_at.desc())
            .first()
        )

        last_qr_info = None
        if last_batch:
            last_qr_info = {
                "batch_id": str(last_batch.id),
                "batch_number": last_batch.batch_number,
                "product_name": last_batch.product.product_name if last_batch.product else "N/A",
                "qr_token": last_batch.qr_token,
                "qr_generated_at": last_batch.qr_generated_at or last_batch.updated_at,
            }

        return {
            "total_products": total_products,
            "total_batches": total_batches,
            "total_dealers": total_dealers,
            "active_dealers": active_dealers,
            "total_qrs": total_qrs,
            "total_scans": total_scans,
            "total_dispatches": total_dispatches,
            "total_manufactured": total_manufactured,
            "total_dispatched_qty": total_dispatched_qty,
            "remaining_inventory": remaining_inventory,
            "last_generated_qr": last_qr_info,
        }

    def get_recent_products(self, limit: int = 5) -> List[Product]:
        return (
            self.db.query(Product)
            .order_by(Product.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_recent_batches(self, limit: int = 5) -> List[Batch]:
        return (
            self.db.query(Batch)
            .options(joinedload(Batch.product))
            .order_by(Batch.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_recent_dispatches(self, limit: int = 5) -> List[Dict[str, Any]]:
        dispatches = (
            self.db.query(Dispatch)
            .options(
                joinedload(Dispatch.batch).joinedload(Batch.product),
                joinedload(Dispatch.dealer)
            )
            .order_by(Dispatch.created_at.desc())
            .limit(limit)
            .all()
        )
        results = []
        for d in dispatches:
            results.append({
                "id": str(d.id),
                "dispatch_number": d.dispatch_number,
                "batch_number": d.batch.batch_number if d.batch else "N/A",
                "product_name": d.batch.product.product_name if d.batch and d.batch.product else "N/A",
                "dealer_name": d.dealer.dealer_name if d.dealer else "N/A",
                "quantity": d.quantity,
                "dispatch_date": d.dispatch_date,
                "invoice_number": d.invoice_number,
            })
        return results

    def get_recent_scans(self, limit: int = 5) -> List[Dict[str, Any]]:
        logs = (
            self.db.query(ScanLog)
            .options(
                joinedload(ScanLog.batch).joinedload(Batch.product)
            )
            .order_by(ScanLog.scanned_at.desc())
            .limit(limit)
            .all()
        )

        results = []
        for log in logs:
            batch = log.batch
            product = batch.product if batch else None

            results.append({
                "id": str(log.id),
                "qr_token": batch.qr_token if batch else "N/A",
                "product_name": product.product_name if product else "N/A",
                "batch_number": batch.batch_number if batch else "N/A",
                "scanned_at": log.scanned_at,
                "ip_address": log.ip_address or "N/A",
                "user_agent": log.user_agent or "N/A",
                "status": "Verified",
                "location": log.ip_address or "Local",
            })

        return results
