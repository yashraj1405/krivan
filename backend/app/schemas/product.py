import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    product_code: str = Field(..., max_length=100, description="Unique product code cataloguing code")
    product_name: str = Field(..., max_length=255, description="Full name of fertilizer formula line")
    category: str = Field(..., max_length=100, description="Fertilizer classification category (e.g. NPK, Organic)")
    composition: Optional[str] = Field(None, max_length=500, description="Active composition ratios")
    description: Optional[str] = Field(None, description="Detailed product application manual description")
    dosage: Optional[str] = Field(None, max_length=255, description="Suggested application dosage guidelines")
    benefits: Optional[str] = Field(None, description="Agronomic health benefits")
    recommended_crops: Optional[str] = Field(None, max_length=500, description="Recommended crops target list")
    image_url: Optional[str] = Field(None, max_length=1024, description="Static image media path url")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_code: Optional[str] = Field(None, max_length=100)
    product_name: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    composition: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    dosage: Optional[str] = Field(None, max_length=255)
    benefits: Optional[str] = None
    recommended_crops: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = Field(None, max_length=1024)
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    skip: int
    limit: int
