from fastapi import APIRouter
from app.routers import auth, product, batch, dealer, dispatch, dashboard, verification

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(product.router, prefix="/products", tags=["Products"])
api_router.include_router(batch.router, prefix="/batches", tags=["Batches"])
api_router.include_router(dealer.router, prefix="/dealers", tags=["Dealers"])
api_router.include_router(dispatch.router, prefix="/dispatches", tags=["Dispatches"])
api_router.include_router(verification.router, prefix="/verify", tags=["Verification"])
