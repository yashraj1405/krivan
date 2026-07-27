import uuid
import enum
from datetime import datetime, timezone
from typing import List
from sqlalchemy import String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class QRCodeStatus(str, enum.Enum):
    GENERATED = "Generated"
    PRINTED = "Printed"
    DISPATCHED = "Dispatched"
    SOLD = "Sold"
    VERIFIED = "Verified"


class QRCode(Base):
    __tablename__ = "qr_codes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    serial_number: Mapped[str] = mapped_column(String(100), nullable=False)
    qr_token: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    qr_image_path: Mapped[str] = mapped_column(String(1024), nullable=True)
    status: Mapped[QRCodeStatus] = mapped_column(
        Enum(QRCodeStatus), default=QRCodeStatus.GENERATED, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    batch: Mapped["Batch"] = relationship("Batch")
    scan_logs: Mapped[List["QRScanLog"]] = relationship("QRScanLog", back_populates="qr_code", cascade="all, delete-orphan")


from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.batch import Batch
    from app.models.qr_scan_log import QRScanLog
