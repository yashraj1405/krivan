import os
import secrets
import string
import uuid
from datetime import datetime, timezone
import qrcode
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings
from app.exceptions.custom import NotFoundError, ConflictError
from app.models.batch import Batch, BatchStatus
from app.models.scan_log import ScanLog
from app.schemas.qr import BatchQRResponse


class QRService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def generate_secure_token(self, length: int = 10) -> str:
        """
        Generate a secure random alphanumeric token (e.g., A91JK82KLP)
        """
        alphabet = string.ascii_uppercase + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(length))

    def _build_response(self, batch: Batch) -> BatchQRResponse:
        token = batch.qr_token or ""
        file_name = f"{token}.png" if token else ""
        image_url = f"/static/qrcodes/{file_name}" if file_name else ""
        
        base_frontend_url = settings.get_frontend_url()
        verify_url = f"{base_frontend_url}/verify/{token}" if token else ""
        download_url = f"/api/v1/batches/qr-codes/download/{token}" if token else ""

        scan_count = (
            self.db.query(func.count(ScanLog.id))
            .filter(ScanLog.batch_id == batch.id)
            .scalar() or 0
        )

        return BatchQRResponse(
            batch_id=batch.id,
            batch_number=batch.batch_number,
            qr_token=token,
            qr_image_path=batch.qr_image_path,
            image_url=image_url,
            verify_url=verify_url,
            download_url=download_url,
            qr_generated_at=batch.qr_generated_at,
            scan_count=scan_count,
            product=batch.product
        )

    def generate_qr_for_batch(
        self, batch_id: uuid.UUID, force_regenerate: bool = False
    ) -> BatchQRResponse:
        # 1. Fetch batch with product
        batch = (
            self.db.query(Batch)
            .options(joinedload(Batch.product))
            .filter(Batch.id == batch_id)
            .first()
        )
        if not batch:
            raise NotFoundError("Batch not found")

        # 2. If QR already exists and not forcing regeneration, return existing
        if batch.qr_token and not force_regenerate:
            return self._build_response(batch)

        # 3. Generate unique token
        token = self.generate_secure_token()
        while self.db.query(Batch).filter(Batch.qr_token == token).first():
            token = self.generate_secure_token()

        # 4. Generate QR code PNG pointing to public verification page
        base_frontend_url = settings.get_frontend_url()
        verify_url = f"{base_frontend_url}/verify/{token}"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_Q,
            box_size=10,
            border=4,
        )
        qr.add_data(verify_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Define file save path
        static_dir = os.path.join("static", "qrcodes")
        os.makedirs(static_dir, exist_ok=True)
        file_name = f"{token}.png"
        file_path = os.path.join(static_dir, file_name)

        # Save image to disk
        img.save(file_path)

        # 5. Update Batch record
        now = datetime.now(timezone.utc)
        batch.qr_token = token
        batch.qr_image_path = file_path
        batch.qr_generated_at = now

        # Update batch status to QR Generated if it was in Draft or Production
        if batch.status in [BatchStatus.DRAFT, BatchStatus.PRODUCTION]:
            batch.status = BatchStatus.QR_GENERATED

        self.db.commit()
        self.db.refresh(batch)

        return self._build_response(batch)

    def get_batch_qr(self, batch_id: uuid.UUID) -> BatchQRResponse:
        batch = (
            self.db.query(Batch)
            .options(joinedload(Batch.product))
            .filter(Batch.id == batch_id)
            .first()
        )
        if not batch:
            raise NotFoundError("Batch not found")
        if not batch.qr_token:
            raise NotFoundError("QR Code has not been generated for this batch yet")
        return self._build_response(batch)
