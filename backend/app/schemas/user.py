import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "admin"
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "e2a2a0ea-73e4-4d8b-944a-4ff18413b522",
                "email": "admin@fertilizer.com",
                "full_name": "System Admin",
                "role": "admin",
                "is_active": True,
                "created_at": "2026-07-16T15:00:00Z"
            }
        }
