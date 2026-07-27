import uuid
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel


class RecentScanItem(BaseModel):
    id: uuid.UUID
    qr_token: str
    product_name: Optional[str] = "N/A"
    batch_number: Optional[str] = "N/A"
    scanned_at: datetime
    status: str = "Verified"
    location: Optional[str] = "N/A"

    class Config:
        from_attributes = True


class RecentProductItem(BaseModel):
    id: uuid.UUID
    product_code: str
    product_name: str
    category: str
    created_at: datetime

    class Config:
        from_attributes = True


class RecentBatchItem(BaseModel):
    id: uuid.UUID
    batch_number: str
    product_name: Optional[str] = "N/A"
    quantity: int
    created_at: datetime

    class Config:
        from_attributes = True


class RecentDispatchItem(BaseModel):
    id: uuid.UUID
    dispatch_number: str
    batch_number: Optional[str] = "N/A"
    product_name: Optional[str] = "N/A"
    dealer_name: Optional[str] = "N/A"
    quantity: int
    dispatch_date: datetime
    invoice_number: Optional[str] = "N/A"

    class Config:
        from_attributes = True


class DashboardSummaryResponse(BaseModel):
    total_products: int = 0
    total_batches: int = 0
    total_dealers: int = 0
    active_dealers: int = 0
    total_qrs: int = 0
    total_scans: int = 0
    total_dispatches: int = 0
    total_manufactured: int = 0
    total_dispatched_qty: int = 0
    remaining_inventory: int = 0
    last_generated_qr: Optional[Dict[str, Any]] = None
    recent_scans: List[RecentScanItem] = []
    recent_products: List[RecentProductItem] = []
    recent_batches: List[RecentBatchItem] = []
    recent_dispatches: List[RecentDispatchItem] = []

    class Config:
        from_attributes = True
