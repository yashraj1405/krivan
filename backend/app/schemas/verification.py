from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class DealerContactInfo(BaseModel):
    dealer_name: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

    class Config:
        from_attributes = True


class VerificationSuccessResponse(BaseModel):
    verified: bool = True
    product_name: str
    product_code: str
    batch_number: str
    manufacturing_date: datetime
    expiry_date: datetime
    net_content: Optional[str] = None
    mrp: Optional[float] = None
    category: str
    composition: Optional[str] = None
    recommended_crops: Optional[str] = None
    dosage: Optional[str] = None
    benefits: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    dealer: Optional[DealerContactInfo] = None
    manufacturer_name: str = "Krivan Agri-Inputs Pvt. Ltd."
    company_address: str = "Industrial Estate, Sector 4, Pune, Maharashtra 411001, India"
    customer_care: str = "+91-1800-425-7482"
    support_email: str = "support@krivanagri.com"
    scan_count: int = 1
    first_scanned: bool = True

    class Config:
        from_attributes = True


class VerificationFailureResponse(BaseModel):
    verified: bool = False
    title: str = "Invalid Product"
    message: str = "Possible Counterfeit Product"
    detail: str = "The scanned QR token does not match any registered product in our system. This product may be counterfeit or tampered with."

    class Config:
        from_attributes = True
