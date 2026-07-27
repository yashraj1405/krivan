import uuid
import enum
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class BatchStatus(str, enum.Enum):
    DRAFT = "Draft"
    PRODUCTION = "Production"
    QR_GENERATED = "QR Generated"
    PRINTED = "Printed"
    PACKED = "Packed"
    DISPATCHED = "Dispatched"
    COMPLETED = "Completed"


class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    batch_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    manufacturing_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expiry_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    net_content: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    mrp: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    status: Mapped[BatchStatus] = mapped_column(
        Enum(BatchStatus, values_callable=lambda x: [e.value for e in x]), default=BatchStatus.DRAFT, nullable=False
    )
    qr_token: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    qr_image_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    qr_generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="batches")
    dispatches: Mapped[List["Dispatch"]] = relationship("Dispatch", back_populates="batch", cascade="all, delete-orphan")
    scan_logs: Mapped[List["ScanLog"]] = relationship("ScanLog", back_populates="batch", cascade="all, delete-orphan")


from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.dispatch import Dispatch
    from app.models.scan_log import ScanLog
