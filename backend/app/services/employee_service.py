from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from app.models.models import Employee, Attendance, AttendanceStatus
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.core.exceptions import HRMSException
from typing import Optional

class EmployeeService:

    async def get_all(
        self, db: AsyncSession,
        q: Optional[str] = None,
        department: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ):
        stmt = select(Employee)
        if q:
            stmt = stmt.where(
                or_(
                    Employee.full_name.ilike(f"%{q}%"),
                    Employee.employee_id.ilike(f"%{q}%"),
                    Employee.email.ilike(f"%{q}%"),
                )
            )
        if department:
            stmt = stmt.where(Employee.department == department)
        stmt = stmt.offset(skip).limit(limit).order_by(Employee.created_at.desc())
        result = await db.execute(stmt)
        employees = result.scalars().all()

        # Attach present days count
        enriched = []
        for emp in employees:
            count_stmt = select(func.count()).where(
                Attendance.employee_id == emp.id,
                Attendance.status == AttendanceStatus.present
            )
            count_result = await db.execute(count_stmt)
            present_days = count_result.scalar() or 0
            emp_dict = {
                "id": emp.id,
                "employee_id": emp.employee_id,
                "full_name": emp.full_name,
                "email": emp.email,
                "department": emp.department,
                "position": emp.position,
                "phone": emp.phone,
                "created_at": emp.created_at,
                "total_present_days": present_days,
            }
            enriched.append(emp_dict)
        return enriched

    async def get_by_id(self, db: AsyncSession, employee_id: int):
        result = await db.execute(select(Employee).where(Employee.id == employee_id))
        emp = result.scalar_one_or_none()
        if not emp:
            raise HRMSException(404, f"Employee {employee_id} not found")
        return emp

    async def create(self, db: AsyncSession, data: EmployeeCreate):
        # Check duplicate employee_id
        existing = await db.execute(select(Employee).where(Employee.employee_id == data.employee_id))
        if existing.scalar_one_or_none():
            raise HRMSException(400, f"Employee ID '{data.employee_id}' already exists")
        # Check duplicate email
        existing_email = await db.execute(select(Employee).where(Employee.email == data.email))
        if existing_email.scalar_one_or_none():
            raise HRMSException(400, f"Email '{data.email}' already registered")

        emp = Employee(**data.model_dump())
        db.add(emp)
        await db.flush()
        await db.refresh(emp)
        return emp

    async def update(self, db: AsyncSession, employee_id: int, data: EmployeeUpdate):
        emp = await self.get_by_id(db, employee_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(emp, field, value)
        await db.flush()
        await db.refresh(emp)
        return emp

    async def delete(self, db: AsyncSession, employee_id: int):
        emp = await self.get_by_id(db, employee_id)
        await db.delete(emp)

    async def get_departments(self, db: AsyncSession):
        result = await db.execute(select(Employee.department).distinct())
        return sorted([row[0] for row in result.fetchall()])

    async def get_count(self, db: AsyncSession):
        result = await db.execute(select(func.count()).select_from(Employee))
        return result.scalar() or 0

employee_service = EmployeeService()
