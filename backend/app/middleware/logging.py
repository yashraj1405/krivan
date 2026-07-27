import time
import logging
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

# Configure structured logging template
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("APIRequestLogger")


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.time()
        method = request.method
        path = request.url.path
        
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            logger.info(
                f"Method={method} Path={path} Status={response.status_code} Time={process_time:.2f}ms"
            )
            return response
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(
                f"Method={method} Path={path} Failed with: {str(e)} Time={process_time:.2f}ms",
                exc_info=True
            )
            # Return JSONResponse so CORSMiddleware can append CORS headers properly
            return JSONResponse(
                status_code=500,
                content={"detail": f"Internal Server Error: {str(e)}"}
            )
