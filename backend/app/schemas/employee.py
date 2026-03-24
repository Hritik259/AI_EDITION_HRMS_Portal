from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional

class EmployeeCreate(BaseModel):
    employee_id: str
    full_name:   str
    email:       str
    department:  str
    position:    Optional[str] = None
    phone:       Optional[str] = None

    @field_validator("employee_id")
    @classmethod
    def validate_emp_id(cls, v):
        if not v.strip():
            raise ValueError("Employee ID cannot be empty")
        return v.upper().strip()

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v.strip()

class EmployeeUpdate(BaseModel):
    full_name:   Optional[str] = None
    email:       Optional[str] = None
    department:  Optional[str] = None
    position:    Optional[str] = None
    phone:       Optional[str] = None

class EmployeeResponse(BaseModel):
    id:                 int
    employee_id:        str
    full_name:          str
    email:              str
    department:         str
    position:           Optional[str]
    phone:              Optional[str]
    created_at:         datetime
    total_present_days: Optional[int] = 0

    model_config = {"from_attributes": True}
