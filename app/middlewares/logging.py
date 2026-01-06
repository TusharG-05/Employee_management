import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.middleware")

class LoggAndAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        logger.info(f"Incoming request : {request.method} {request.url}")
        # logger.info(f"request headers : {request.headers}") 
        
        response = await call_next(request)

        duration = time.time() - start
        logger.info(f"Complete request : {duration:.4f} seconds")
        response.headers['X-Process-Time'] = str(duration)
        return response