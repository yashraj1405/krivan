import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class QRScanLog(Base):
    __tablename__ = "qr_scan_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    qr_code_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("qr_codes.id", ondelete="CASCADE"), nullable=False
    )
    scanned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)  # Supports IPv6
    device: Mapped[str] = mapped_column(String(255), nullable=True)
    browser: Mapped[str] = mapped_column(String(100), nullable=True)
    operating_system: Mapped[str] = mapped_column(String(100), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=True)
    state: Mapped[str] = mapped_column(String(100), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    is_duplicate_scan: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    qr_code: Mapped["QRCode"] = relationship("QRCode", back_populates="scan_logs")


from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.qr_code import QRCode
