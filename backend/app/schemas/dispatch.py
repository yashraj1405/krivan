import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.schemas.batch import BatchResponse
from app.schemas.dealer import DealerResponse


class DispatchBase(BaseModel):
    batch_id: uuid.UUID = Field(..., description="Target manufacturing batch ID")
    dealer_id: uuid.UUID = Field(..., description="Target distributor / dealer ID")
    quantity: int = Field(..., gt=0, description="Quantity dispatched to dealer")
    dispatch_date: Optional[datetime] = Field(None, description="Timestamp of dispatch event")
    invoice_number: str = Field(..., max_length=100, description="Tax invoice / bill reference number")
    transport_name: str = Field(..., max_length=255, description="Logistics / transport carrier name")
    vehicle_number: str = Field(..., max_length=50, description="Truck / vehicle registration number")
    lr_number: Optional[str] = Field(None, max_length=100, description="Lorry Receipt / Waybill number")
    remarks: Optional[str] = Field(None, max_length=500, description="Optional logistics remarks")


class DispatchCreate(DispatchBase):
    dispatch_number: Optional[str] = Field(None, max_length=50, description="Auto-generated dispatch code if empty")


class DispatchUpdate(BaseModel):
    batch_id: Optional[uuid.UUID] = None
    dealer_id: Optional[uuid.UUID] = None
    quantity: Optional[int] = Field(None, gt=0)
    dispatch_date: Optional[datetime] = None
    invoice_number: Optional[str] = Field(None, max_length=100)
    transport_name: Optional[str] = Field(None, max_length=255)
    vehicle_number: Optional[str] = Field(None, max_length=50)
    lr_number: Optional[str] = Field(None, max_length=100)
    remarks: Optional[str] = Field(None, max_length=500)


class DispatchResponse(BaseModel):
    id: uuid.UUID
    dispatch_number: str
    batch_id: uuid.UUID
    dealer_id: uuid.UUID
    quantity: int
    dispatch_date: datetime
    invoice_number: str
    transport_name: str
    vehicle_number: str
    lr_number: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime
    batch: Optional[BatchResponse] = None
    dealer: Optional[DealerResponse] = None

    class Config:
        from_attributes = True


class DispatchListResponse(BaseModel):
    items: List[DispatchResponse]
    total: int
    skip: int
    limit: int
