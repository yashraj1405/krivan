import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Dispatch(Base):
    __tablename__ = "dispatches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dispatch_number: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    dealer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dealers.id", ondelete="CASCADE"), nullable=False
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    dispatch_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    invoice_number: Mapped[str] = mapped_column(String(100), nullable=False)
    transport_name: Mapped[str] = mapped_column(String(255), nullable=False)
    vehicle_number: Mapped[str] = mapped_column(String(50), nullable=False)
    lr_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    remarks: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    dealer: Mapped["Dealer"] = relationship("Dealer", back_populates="dispatches")
    batch: Mapped["Batch"] = relationship("Batch", back_populates="dispatches")


from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.dealer import Dealer
    from app.models.batch import Batch
