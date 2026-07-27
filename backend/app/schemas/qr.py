import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.product import ProductResponse


class QRGenerateRequest(BaseModel):
    force_regenerate: bool = Field(False, description="Force regeneration of QR code even if one exists")


class BatchQRResponse(BaseModel):
    batch_id: uuid.UUID
    batch_number: str
    qr_token: str
    qr_image_path: Optional[str] = None
    image_url: str
    verify_url: str
    download_url: str
    qr_generated_at: Optional[datetime] = None
    scan_count: int = 0
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True
