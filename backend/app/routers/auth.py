from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserResponse
from app.services.auth import AuthService
from app.security.jwt import get_current_active_user
from app.models.user import User

router = APIRouter()


@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK, summary="Admin User Login")
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
) -> Token:
    """
    Log in an admin user and return a JWT access token.
    """
    auth_service = AuthService(db)
    return auth_service.login_with_password(
        email=login_data.email,
        password=login_data.password
    )


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK, summary="Get Current Admin Profile")
def get_me(
    current_user: User = Depends(get_current_active_user)
) -> UserResponse:
    """
    Retrieve details of the currently logged-in administrator.
    """
    return current_user
