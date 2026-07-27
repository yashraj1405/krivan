from typing import Any, Dict, Optional


class APIException(Exception):
    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: Optional[Dict[str, Any]] = None
    ) -> None:
        self.status_code = status_code
        self.detail = detail
        self.headers = headers
        super().__init__(detail)


class NotFoundError(APIException):
    def __init__(self, detail: str = "Resource not found") -> None:
        super().__init__(status_code=404, detail=detail)


class AuthenticationError(APIException):
    def __init__(self, detail: str = "Incorrect email or password") -> None:
        super().__init__(
            status_code=401,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class AuthorizationError(APIException):
    def __init__(self, detail: str = "Not enough privileges") -> None:
        super().__init__(status_code=403, detail=detail)


class ValidationError(APIException):
    def __init__(self, detail: str = "Validation error") -> None:
        super().__init__(status_code=400, detail=detail)


class ConflictError(APIException):
    def __init__(self, detail: str = "Resource already exists") -> None:
        super().__init__(status_code=409, detail=detail)
