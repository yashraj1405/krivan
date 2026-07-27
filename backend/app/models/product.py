import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy import String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    composition: Mapped[str] = mapped_column(String(500), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    dosage: Mapped[str] = mapped_column(String(255), nullable=True)
    benefits: Mapped[str] = mapped_column(Text, nullable=True)
    recommended_crops: Mapped[str] = mapped_column(String(500), nullable=True)
    image_url: Mapped[str] = mapped_column(String(1024), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationship: One Product -> Many Batches
    batches: Mapped[List["Batch"]] = relationship("Batch", back_populates="product", cascade="all, delete-orphan")
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.batch import Batch
