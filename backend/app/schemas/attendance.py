from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from app.models.models import AttendanceStatus

class AttendanceCreate(BaseModel):
    employee_id: int
    date:        date
    status:      AttendanceStatus
    note:        Optional[str] = None

class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    note:   Optional[str] = None

class AttendanceResponse(BaseModel):
    id:            int
    employee_id:   int
    date:          date
    status:        AttendanceStatus
    note:          Optional[str]
    created_at:    datetime
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None

    model_config = {"from_attributes": True}
