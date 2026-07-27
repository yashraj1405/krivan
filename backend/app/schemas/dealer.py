import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class DealerBase(BaseModel):
    dealer_name: str = Field(..., max_length=255, description="Registered firm / shop name of dealer")
    owner_name: str = Field(..., max_length=255, description="Owner's full name")
    contact_person: Optional[str] = Field(None, max_length=255, description="Contact person name")
    phone: str = Field(..., max_length=20, description="Dealer contact phone number")
    email: Optional[str] = Field(None, description="Dealer contact email address")
    gst_number: str = Field(..., max_length=15, description="15-character GST identification number")
    address: str = Field(..., max_length=500, description="Detailed physical street address")
    city: str = Field(..., max_length=100, description="City region")
    state: str = Field(..., max_length=100, description="State region")
    pincode: Optional[str] = Field(None, max_length=10, description="Postal pincode")
    status: str = Field("Active", description="Dealer status: 'Active' or 'Inactive'")


class DealerCreate(DealerBase):
    dealer_code: Optional[str] = Field(None, max_length=50, description="Unique dealer code (auto-generated if empty)")


class DealerUpdate(BaseModel):
    dealer_code: Optional[str] = Field(None, max_length=50)
    dealer_name: Optional[str] = Field(None, max_length=255)
    owner_name: Optional[str] = Field(None, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = None
    gst_number: Optional[str] = Field(None, max_length=15)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, max_length=10)
    status: Optional[str] = Field(None, max_length=20)


class DealerResponse(DealerBase):
    id: uuid.UUID
    dealer_code: str
    created_at: datetime

    class Config:
        from_attributes = True


class DealerListResponse(BaseModel):
    items: List[DealerResponse]
    total: int
    skip: int
    limit: int
