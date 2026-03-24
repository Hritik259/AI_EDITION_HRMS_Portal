from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db
from app.services.employee_service import employee_service
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from typing import Optional

router = APIRouter()

@router.get("", response_model=list[EmployeeResponse])
async def list_employees(
    q: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    return await employee_service.get_all(db, q=q, department=department, skip=skip, limit=limit)

@router.post("", response_model=EmployeeResponse, status_code=201)
async def create_employee(data: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    return await employee_service.create(db, data)

@router.get("/departments")
async def get_departments(db: AsyncSession = Depends(get_db)):
    depts = await employee_service.get_departments(db)
    return {"departments": depts}

@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: int, db: AsyncSession = Depends(get_db)):
    return await employee_service.get_by_id(db, employee_id)

@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(employee_id: int, data: EmployeeUpdate, db: AsyncSession = Depends(get_db)):
    return await employee_service.update(db, employee_id, data)

@router.delete("/{employee_id}", status_code=204)
async def delete_employee(employee_id: int, db: AsyncSession = Depends(get_db)):
    await employee_service.delete(db, employee_id)
