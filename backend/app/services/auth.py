from sqlalchemy.orm import Session
from app.core.config import settings
from app.exceptions.custom import AuthenticationError
from app.repositories.user import UserRepository
from app.security.password import verify_password, get_password_hash
from app.security.jwt import create_access_token
from app.schemas.auth import Token
from app.models.user import User


class AuthService:
    def __init__(self, db: Session) -> None:
        self.user_repo = UserRepository(db)

    def login_with_password(self, email: str, password: str) -> Token:
        user = self.user_repo.get_by_email(email)
        if not user:
            raise AuthenticationError("Incorrect email or password")
        
        if not verify_password(password, user.password_hash):
            raise AuthenticationError("Incorrect email or password")

        if not user.is_active:
            raise AuthenticationError("Account is suspended")

        access_token = create_access_token(subject=str(user.id))
        return Token(access_token=access_token, token_type="bearer")

    def seed_superuser_if_not_exists(self) -> None:
        user = self.user_repo.get_by_email(settings.FIRST_SUPERUSER_EMAIL)
        if not user:
            # Seed standard admin
            hashed_pwd = get_password_hash(settings.FIRST_SUPERUSER_PASSWORD)
            self.user_repo.create({
                "email": settings.FIRST_SUPERUSER_EMAIL,
                "full_name": settings.FIRST_SUPERUSER_FULL_NAME,
                "password_hash": hashed_pwd,
                "role": "admin",
                "is_active": True
            })
            print(f"Admin seed success: {settings.FIRST_SUPERUSER_EMAIL}")
