from fastapi import Request
from fastapi.responses import JSONResponse

class HRMSException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

async def hrms_exception_handler(request: Request, exc: HRMSException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "path": str(request.url)}
    )
