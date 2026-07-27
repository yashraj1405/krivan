from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.verification import VerificationService
from app.schemas.verification import VerificationSuccessResponse, VerificationFailureResponse

router = APIRouter()


@router.get(
    "/{token}",
    response_model=VerificationSuccessResponse,
    responses={
        200: {"model": VerificationSuccessResponse, "description": "Product verified successfully"},
        404: {"model": VerificationFailureResponse, "description": "Invalid or counterfeit product"},
    },
    summary="Verify Product Authenticity via QR Token",
)
def verify_product(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Public endpoint (no authentication required).
    Looks up a QR token, returns full product traceability data if valid,
    or a counterfeit warning if the token is not found.
    Logs scan with IP address and User Agent.
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = VerificationService(db)
    result = service.verify_token(token, ip_address=ip_address, user_agent=user_agent)

    if result is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=VerificationFailureResponse().model_dump(),
        )

    return result
