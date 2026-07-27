import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Dealer(Base):
    __tablename__ = "dealers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dealer_code: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    dealer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_person: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gst_number: Mapped[str] = mapped_column(String(15), unique=True, index=True, nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    pincode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="Active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    dispatches: Mapped[List["Dispatch"]] = relationship("Dispatch", back_populates="dealer", cascade="all, delete-orphan")


from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.dispatch import Dispatch
