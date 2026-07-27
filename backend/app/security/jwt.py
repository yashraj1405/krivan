from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.exceptions.custom import AuthenticationError, AuthorizationError
from app.models.user import User

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


class TokenPayload(BaseModel):
    sub: Optional[str] = None


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise AuthenticationError("Could not validate credentials")
    
    if token_data.sub is None:
        raise AuthenticationError("Token missing user subject")

    # Import Repository inline to avoid circular imports during startup
    from app.repositories.user import UserRepository
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(token_data.sub)
    if not user:
        raise AuthenticationError("User not found")
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise AuthorizationError("Inactive admin account")
    return current_user
