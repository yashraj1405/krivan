from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.batch import BatchWithProduct


class QRCodeBase(BaseModel):
    batch_id: Optional[int] = None
    unique_code: Optional[str] = None
    qr_image_url: Optional[str] = None
    scan_count: Optional[int] = 0
    last_scanned_at: Optional[datetime] = None


class QRCodeCreate(QRCodeBase):
    batch_id: int
    unique_code: str


class QRCodeUpdate(QRCodeBase):
    pass


class QRCodeInDBBase(QRCodeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class QRCode(QRCodeInDBBase):
    pass


# Full nested details for public verification response
class QRCodeVerificationResponse(BaseModel):
    is_valid: bool
    scan_count: int
    last_scanned_at: Optional[datetime] = None
    batch: Optional[BatchWithProduct] = None
    message: str
