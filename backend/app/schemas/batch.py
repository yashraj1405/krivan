import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.product import ProductResponse


class BatchBase(BaseModel):
    product_id: uuid.UUID = Field(..., description="ID of parent catalog product")
    batch_number: str = Field(..., max_length=100, description="Unique manufacturer batch tracking code")
    manufacturing_date: datetime = Field(..., description="Manufacturing date timestamp")
    expiry_date: datetime = Field(..., description="Batch expiry date timestamp")
    quantity: int = Field(..., gt=0, description="Total units manufactured in this batch")
    net_content: Optional[str] = Field(None, max_length=100, description="Net content per unit (e.g. 1kg, 500ml)")
    mrp: Optional[float] = Field(None, ge=0, description="Maximum Retail Price")
    status: str = Field("Draft", description="Batch lifecycle status")
    remarks: Optional[str] = Field(None, description="Additional batch notes")


class BatchCreate(BatchBase):
    pass


class BatchUpdate(BaseModel):
    product_id: Optional[uuid.UUID] = None
    batch_number: Optional[str] = Field(None, max_length=100)
    manufacturing_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    quantity: Optional[int] = Field(None, gt=0)
    net_content: Optional[str] = Field(None, max_length=100)
    mrp: Optional[float] = Field(None, ge=0)
    status: Optional[str] = None
    remarks: Optional[str] = None


class BatchResponse(BatchBase):
    id: uuid.UUID
    qr_token: Optional[str] = None
    qr_image_path: Optional[str] = None
    qr_generated_at: Optional[datetime] = None
    scan_count: int = 0
    dispatched_quantity: int = 0
    remaining_quantity: int = 0
    created_at: datetime
    updated_at: datetime
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class BatchListResponse(BaseModel):
    items: List[BatchResponse]
    total: int
    skip: int
    limit: int


# --- Batch History Schemas ---

class BatchHistoryDispatchEntry(BaseModel):
    dispatch_number: str
    dealer_name: str
    dealer_code: str
    quantity: int
    invoice_number: str
    transport_name: str
    vehicle_number: str
    lr_number: Optional[str] = None
    remarks: Optional[str] = None
    dispatch_date: datetime

    class Config:
        from_attributes = True


class BatchHistoryScanEntry(BaseModel):
    scanned_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True


class BatchHistoryResponse(BaseModel):
    batch_id: uuid.UUID
    batch_number: str
    product_name: str
    total_quantity: int
    dispatched_quantity: int
    remaining_quantity: int
    manufacturing_date: datetime
    expiry_date: datetime
    qr_generated_at: Optional[datetime] = None
    status: str
    dispatches: List[BatchHistoryDispatchEntry] = []
    scans: List[BatchHistoryScanEntry] = []
