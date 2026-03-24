from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.models import Attendance, Employee, AttendanceStatus
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate
from app.core.exceptions import HRMSException
from datetime import date
from typing import Optional

class AttendanceService:

    async def get_all(self, db: AsyncSession, skip: int = 0, limit: int = 100):
        stmt = (
            select(Attendance, Employee.full_name, Employee.employee_id)
            .join(Employee, Attendance.employee_id == Employee.id)
            .order_by(Attendance.date.desc())
            .offset(skip).limit(limit)
        )
        result = await db.execute(stmt)
        rows = result.all()
        return [self._enrich(a, name, code) for a, name, code in rows]

    async def get_by_employee(self, db: AsyncSession, employee_id: int):
        emp_result = await db.execute(select(Employee).where(Employee.id == employee_id))
        emp = emp_result.scalar_one_or_none()
        if not emp:
            raise HRMSException(404, f"Employee {employee_id} not found")

        stmt = (
            select(Attendance)
            .where(Attendance.employee_id == employee_id)
            .order_by(Attendance.date.desc())
        )
        result = await db.execute(stmt)
        records = result.scalars().all()
        return [self._enrich(a, emp.full_name, emp.employee_id) for a in records]

    async def mark(self, db: AsyncSession, data: AttendanceCreate):
        # Check duplicate for same employee + date
        existing = await db.execute(
            select(Attendance).where(
                and_(
                    Attendance.employee_id == data.employee_id,
                    Attendance.date == data.date
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HRMSException(400, "Attendance already marked for this employee on this date")

        record = Attendance(**data.model_dump())
        db.add(record)
        await db.flush()
        await db.refresh(record)

        emp_result = await db.execute(select(Employee).where(Employee.id == record.employee_id))
        emp = emp_result.scalar_one_or_none()
        return self._enrich(record, emp.full_name if emp else "", emp.employee_id if emp else "")

    async def update(self, db: AsyncSession, attendance_id: int, data: AttendanceUpdate):
        result = await db.execute(select(Attendance).where(Attendance.id == attendance_id))
        record = result.scalar_one_or_none()
        if not record:
            raise HRMSException(404, f"Attendance record {attendance_id} not found")
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(record, field, value)
        await db.flush()
        await db.refresh(record)
        return record

    async def delete(self, db: AsyncSession, attendance_id: int):
        result = await db.execute(select(Attendance).where(Attendance.id == attendance_id))
        record = result.scalar_one_or_none()
        if not record:
            raise HRMSException(404, f"Attendance record {attendance_id} not found")
        await db.delete(record)

    async def get_today_stats(self, db: AsyncSession, today: date):
        base = select(func.count()).select_from(Attendance).where(Attendance.date == today)
        present = (await db.execute(base.where(Attendance.status == AttendanceStatus.present))).scalar() or 0
        absent  = (await db.execute(base.where(Attendance.status == AttendanceStatus.absent))).scalar() or 0
        late    = (await db.execute(base.where(Attendance.status == AttendanceStatus.late))).scalar() or 0
        return present, absent, late

    def _enrich(self, record, emp_name: str, emp_code: str):
        return {
            "id": record.id,
            "employee_id": record.employee_id,
            "date": record.date,
            "status": record.status,
            "note": record.note,
            "created_at": record.created_at,
            "employee_name": emp_name,
            "employee_code": emp_code,
        }

attendance_service = AttendanceService()
