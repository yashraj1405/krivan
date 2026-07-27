from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.exceptions.custom import APIException


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(APIException)
    async def api_exception_handler(request: Request, exc: APIException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        # Log the exception here if a logger is configured
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected system error occurred. Please try again later."}
        )
