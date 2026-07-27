from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models.batch import Batch
from app.models.scan_log import ScanLog
from app.models.dispatch import Dispatch
from app.schemas.verification import (
    VerificationSuccessResponse,
    DealerContactInfo,
)


class VerificationService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def verify_token(
        self, token: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None
    ) -> Optional[VerificationSuccessResponse]:
        """
        Look up a QR token, resolve batch & product details, log the scan,
        and return structured verification response.
        Returns None if token is not found.
        """
        # 1. Find batch matching qr_token
        batch = (
            self.db.query(Batch)
            .options(joinedload(Batch.product))
            .filter(Batch.qr_token == token)
            .first()
        )

        if not batch:
            return None

        product = batch.product

        # 2. Count existing scans for this batch
        previous_scans = (
            self.db.query(func.count(ScanLog.id))
            .filter(ScanLog.batch_id == batch.id)
            .scalar() or 0
        )
        first_scanned = previous_scans == 0
        new_scan_count = previous_scans + 1

        # 3. Log scan in scan_logs table
        scan_log = ScanLog(
            batch_id=batch.id,
            scanned_at=datetime.now(timezone.utc),
            ip_address=ip_address,
            user_agent=user_agent
        )
        self.db.add(scan_log)
        self.db.commit()

        # 4. Find dealer info via dispatch records
        dealer_info = None
        dispatch = (
            self.db.query(Dispatch)
            .options(joinedload(Dispatch.dealer))
            .filter(Dispatch.batch_id == batch.id)
            .order_by(Dispatch.dispatch_date.desc())
            .first()
        )
        if dispatch and dispatch.dealer:
            d = dispatch.dealer
            dealer_info = DealerContactInfo(
                dealer_name=d.dealer_name,
                owner_name=d.owner_name,
                phone=d.phone,
                email=d.email,
                address=d.address,
                city=d.city,
                state=d.state,
            )

        # 5. Build response
        return VerificationSuccessResponse(
            verified=True,
            product_name=product.product_name if product else "Unknown Product",
            product_code=product.product_code if product else "N/A",
            batch_number=batch.batch_number,
            manufacturing_date=batch.manufacturing_date,
            expiry_date=batch.expiry_date,
            net_content=batch.net_content,
            mrp=float(batch.mrp) if batch.mrp is not None else None,
            category=product.category if product else "General",
            composition=product.composition if product else None,
            recommended_crops=product.recommended_crops if product else None,
            dosage=product.dosage if product else None,
            benefits=product.benefits if product else None,
            description=product.description if product else None,
            image_url=product.image_url if product else None,
            dealer=dealer_info,
            scan_count=new_scan_count,
            first_scanned=first_scanned,
        )
