from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.core.exceptions import HRMSException, hrms_exception_handler
from app.routers import employees, attendance, dashboard, ai
from app.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="HRMS Lite API",
    version="2.0.0",
    description="Human Resource Management System — Employee & Attendance Management with AI",
    docs_url="/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000","https://ai-edition-hrms-portal.onrender.com/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(HRMSException, hrms_exception_handler)

app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(dashboard.router,  prefix="/api/dashboard",  tags=["Dashboard"])
app.include_router(ai.router,         prefix="/api/ai",         tags=["AI"])

@app.get("/")
async def root():
    return {"message": "HRMS Lite API v2.0", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
