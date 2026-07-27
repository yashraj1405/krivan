from sqlalchemy.orm import Session
from app.repositories.dashboard import DashboardRepository
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    RecentProductItem,
    RecentBatchItem,
    RecentScanItem,
    RecentDispatchItem,
)


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.repository = DashboardRepository(db)

    def get_summary(self) -> DashboardSummaryResponse:
        counts = self.repository.get_counts()
        recent_products_db = self.repository.get_recent_products(limit=5)
        recent_batches_db = self.repository.get_recent_batches(limit=5)
        recent_scans_db = self.repository.get_recent_scans(limit=5)
        recent_dispatches_db = self.repository.get_recent_dispatches(limit=5)

        recent_products = [
            RecentProductItem(
                id=p.id,
                product_code=p.product_code,
                product_name=p.product_name,
                category=p.category,
                created_at=p.created_at,
            )
            for p in recent_products_db
        ]

        recent_batches = [
            RecentBatchItem(
                id=b.id,
                batch_number=b.batch_number,
                product_name=b.product.product_name if b.product else "N/A",
                quantity=b.quantity,
                created_at=b.created_at,
            )
            for b in recent_batches_db
        ]

        recent_scans = [
            RecentScanItem(
                id=s["id"],
                qr_token=s["qr_token"],
                product_name=s["product_name"],
                batch_number=s["batch_number"],
                scanned_at=s["scanned_at"],
                status=s["status"],
                location=s["location"],
            )
            for s in recent_scans_db
        ]

        recent_dispatches = [
            RecentDispatchItem(
                id=d["id"],
                dispatch_number=d["dispatch_number"],
                batch_number=d["batch_number"],
                product_name=d["product_name"],
                dealer_name=d["dealer_name"],
                quantity=d["quantity"],
                dispatch_date=d["dispatch_date"],
                invoice_number=d["invoice_number"],
            )
            for d in recent_dispatches_db
        ]

        return DashboardSummaryResponse(
            total_products=counts["total_products"],
            total_batches=counts["total_batches"],
            total_dealers=counts["total_dealers"],
            active_dealers=counts["active_dealers"],
            total_qrs=counts["total_qrs"],
            total_scans=counts["total_scans"],
            total_dispatches=counts["total_dispatches"],
            total_manufactured=counts["total_manufactured"],
            total_dispatched_qty=counts["total_dispatched_qty"],
            remaining_inventory=counts["remaining_inventory"],
            last_generated_qr=counts["last_generated_qr"],
            recent_scans=recent_scans,
            recent_products=recent_products,
            recent_batches=recent_batches,
            recent_dispatches=recent_dispatches,
        )
