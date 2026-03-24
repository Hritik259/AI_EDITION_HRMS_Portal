from datetime import datetime, date
from sqlalchemy import String, Integer, Date, DateTime, ForeignKey, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum

class AttendanceStatus(str, enum.Enum):
    present  = "present"
    absent   = "absent"
    late     = "late"
    half_day = "half_day"

class Employee(Base):
    __tablename__ = "employees"

    id:          Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[str]      = mapped_column(String(50), unique=True, index=True)
    full_name:   Mapped[str]      = mapped_column(String(200))
    email:       Mapped[str]      = mapped_column(String(200), unique=True, index=True)
    department:  Mapped[str]      = mapped_column(String(100))
    position:    Mapped[str|None] = mapped_column(String(100), nullable=True)
    phone:       Mapped[str|None] = mapped_column(String(20),  nullable=True)
    created_at:  Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    attendance: Mapped[list["Attendance"]] = relationship(back_populates="employee", cascade="all, delete")

class Attendance(Base):
    __tablename__ = "attendance"

    id:          Mapped[int]              = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int]              = mapped_column(ForeignKey("employees.id"), index=True)
    date:        Mapped[date]             = mapped_column(Date, index=True)
    status:      Mapped[AttendanceStatus] = mapped_column(SAEnum(AttendanceStatus))
    note:        Mapped[str|None]         = mapped_column(String(500), nullable=True)
    created_at:  Mapped[datetime]         = mapped_column(DateTime, server_default=func.now())

    employee: Mapped["Employee"] = relationship(back_populates="attendance")
