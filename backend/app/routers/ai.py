from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db
from app.services.ai_service import ai_service
from pydantic import BaseModel

router = APIRouter()

class NoteRequest(BaseModel):
    employee_id: int
    status: str

class QueryRequest(BaseModel):
    question: str

@router.get("/risk")
async def get_risk_employees(db: AsyncSession = Depends(get_db)):
    return await ai_service.get_risk_employees(db)

@router.get("/trend/{employee_id}")
async def get_trend(employee_id: int, db: AsyncSession = Depends(get_db)):
    return await ai_service.get_trend(db, employee_id)

@router.post("/generate-note")
async def generate_note(data: NoteRequest, db: AsyncSession = Depends(get_db)):
    note = await ai_service.generate_note(db, data.employee_id, data.status)
    return {"note": note}

@router.post("/query")
async def hr_query(data: QueryRequest, db: AsyncSession = Depends(get_db)):
    answer = await ai_service.hr_query(db, data.question)
    return {"answer": answer}
