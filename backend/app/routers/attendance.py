from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db
from app.services.attendance_service import attendance_service
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate, AttendanceResponse

router = APIRouter()

@router.get("", response_model=list[AttendanceResponse])
async def list_attendance(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await attendance_service.get_all(db, skip=skip, limit=limit)

@router.post("", response_model=AttendanceResponse, status_code=201)
async def mark_attendance(data: AttendanceCreate, db: AsyncSession = Depends(get_db)):
    return await attendance_service.mark(db, data)

@router.get("/employee/{employee_id}", response_model=list[AttendanceResponse])
async def get_employee_attendance(employee_id: int, db: AsyncSession = Depends(get_db)):
    return await attendance_service.get_by_employee(db, employee_id)

@router.put("/{attendance_id}", response_model=AttendanceResponse)
async def update_attendance(attendance_id: int, data: AttendanceUpdate, db: AsyncSession = Depends(get_db)):
    return await attendance_service.update(db, attendance_id, data)

@router.delete("/{attendance_id}", status_code=204)
async def delete_attendance(attendance_id: int, db: AsyncSession = Depends(get_db)):
    await attendance_service.delete(db, attendance_id)
