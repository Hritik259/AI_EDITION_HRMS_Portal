# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy import select, func, and_
# from app.models.models import Employee, Attendance, AttendanceStatus
# from app.config import settings
# from datetime import date, timedelta
# from openai import AsyncOpenAI
# from typing import Optional

# client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

# class AIService:

#     async def get_risk_employees(self, db: AsyncSession):
#         """Score every employee by attendance rate over last 30 days."""
#         today = date.today()
#         since = today - timedelta(days=30)

#         result = await db.execute(select(Employee))
#         employees = result.scalars().all()

#         risks = []
#         for emp in employees:
#             total = (await db.execute(
#                 select(func.count()).select_from(Attendance)
#                 .where(and_(
#                     Attendance.employee_id == emp.id,
#                     Attendance.date >= since
#                 ))
#             )).scalar() or 0

#             present = (await db.execute(
#                 select(func.count()).select_from(Attendance)
#                 .where(and_(
#                     Attendance.employee_id == emp.id,
#                     Attendance.date >= since,
#                     Attendance.status == AttendanceStatus.present
#                 ))
#             )).scalar() or 0

#             if total == 0:
#                 rate = 0.0
#                 level = "no_data"
#             else:
#                 rate = round(present / total * 100, 1)
#                 if rate < 60:
#                     level = "critical"
#                 elif rate < 75:
#                     level = "high"
#                 elif rate < 85:
#                     level = "medium"
#                 else:
#                     level = "good"

#             if level in ("critical", "high", "medium"):
#                 risks.append({
#                     "employee_id": emp.id,
#                     "employee_code": emp.employee_id,
#                     "full_name": emp.full_name,
#                     "department": emp.department,
#                     "attendance_rate": rate,
#                     "risk_level": level,
#                     "days_tracked": total,
#                     "days_present": present,
#                 })

#         risks.sort(key=lambda x: x["attendance_rate"])
#         return risks

#     async def get_trend(self, db: AsyncSession, employee_id: int):
#         """Week-over-week attendance trend for an employee."""
#         today = date.today()
#         weeks = []
#         for w in range(3, -1, -1):
#             week_end   = today - timedelta(weeks=w)
#             week_start = week_end - timedelta(days=6)
#             total = (await db.execute(
#                 select(func.count()).select_from(Attendance)
#                 .where(and_(
#                     Attendance.employee_id == employee_id,
#                     Attendance.date >= week_start,
#                     Attendance.date <= week_end,
#                 ))
#             )).scalar() or 0
#             present = (await db.execute(
#                 select(func.count()).select_from(Attendance)
#                 .where(and_(
#                     Attendance.employee_id == employee_id,
#                     Attendance.date >= week_start,
#                     Attendance.date <= week_end,
#                     Attendance.status == AttendanceStatus.present
#                 ))
#             )).scalar() or 0
#             rate = round(present / total * 100, 1) if total > 0 else 0.0
#             weeks.append({
#                 "week": f"W{4-w}",
#                 "label": f"{week_start.strftime('%b %d')} - {week_end.strftime('%b %d')}",
#                 "rate": rate,
#                 "present": present,
#                 "total": total,
#             })

#         if len(weeks) >= 2:
#             delta = weeks[-1]["rate"] - weeks[-2]["rate"]
#             trend = "improving" if delta > 5 else "declining" if delta < -5 else "stable"
#         else:
#             trend = "stable"
#             delta = 0.0

#         return {"weeks": weeks, "trend": trend, "delta": round(delta, 1)}

#     async def generate_note(self, db: AsyncSession, employee_id: int, status: str) -> str:
#         """Generate a smart HR attendance note using OpenAI."""
#         emp_result = await db.execute(select(Employee).where(Employee.id == employee_id))
#         emp = emp_result.scalar_one_or_none()
#         if not emp:
#             return "Attendance recorded."

#         if not client:
#             # Fallback rule-based notes when no API key
#             notes = {
#                 "present": f"{emp.full_name} was present and completed their shift.",
#                 "absent":  f"{emp.full_name} was absent. Please follow up if this is unexpected.",
#                 "late":    f"{emp.full_name} arrived late today. First occurrence noted.",
#                 "half_day": f"{emp.full_name} completed a half-day today.",
#             }
#             return notes.get(status, "Attendance recorded.")

#         prompt = (
#             f"Write a concise, professional HR attendance note (1-2 sentences) for:\n"
#             f"Employee: {emp.full_name}\n"
#             f"Department: {emp.department}\n"
#             f"Position: {emp.position or 'Staff'}\n"
#             f"Attendance status today: {status}\n"
#             f"Keep it factual, neutral, and professional."
#         )
#         try:
#             response = await client.chat.completions.create(
#                 model="gpt-3.5-turbo",
#                 messages=[{"role": "user", "content": prompt}],
#                 max_tokens=100,
#                 temperature=0.7,
#             )
#             return response.choices[0].message.content.strip()
#         except Exception:
#             return f"Attendance status '{status}' recorded for {emp.full_name}."

#     async def hr_query(self, db: AsyncSession, question: str) -> str:
#         """Answer HR questions using context from the database."""
#         # Build context
#         total_emp = (await db.execute(select(func.count()).select_from(Employee))).scalar() or 0
#         today = date.today()
#         present_today = (await db.execute(
#             select(func.count()).select_from(Attendance)
#             .where(and_(Attendance.date == today, Attendance.status == AttendanceStatus.present))
#         )).scalar() or 0

#         # Get risk employees for context
#         risks = await self.get_risk_employees(db)
#         risk_summary = ", ".join([f"{r['full_name']} ({r['attendance_rate']}%)" for r in risks[:3]])

#         dept_result = await db.execute(select(Employee.department).distinct())
#         departments = [r[0] for r in dept_result.fetchall()]

#         context = f"""
#         HRMS System Context (as of {today}):
#         - Total employees: {total_emp}
#         - Present today: {present_today}
#         - Departments: {', '.join(departments)}
#         - At-risk employees (low attendance): {risk_summary or 'None identified'}
#         """

#         if not client:
#             return (
#                 f"I can see {total_emp} employees in the system, "
#                 f"{present_today} present today. "
#                 f"At-risk employees: {risk_summary or 'none'}. "
#                 f"(Connect OpenAI API key for smarter responses.)"
#             )

#         try:
#             response = await client.chat.completions.create(
#                 model="gpt-3.5-turbo",
#                 messages=[
#                     {
#                         "role": "system",
#                         "content": (
#                             "You are an intelligent HR assistant for HRMS Lite. "
#                             "Answer questions about employees and attendance based on the context provided. "
#                             "Be concise, helpful, and professional. "
#                             f"Context: {context}"
#                         )
#                     },
#                     {"role": "user", "content": question}
#                 ],
#                 max_tokens=300,
#                 temperature=0.5,
#             )
#             return response.choices[0].message.content.strip()
#         except Exception as e:
#             return f"I encountered an issue processing your query. Please try again. ({str(e)[:50]})"

# ai_service = AIService()
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.models import Employee, Attendance, AttendanceStatus
from app.config import settings
from datetime import date, timedelta
from typing import Optional
from groq import AsyncGroq

# Initialize Groq client
client = AsyncGroq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None


class AIService:

    async def get_risk_employees(self, db: AsyncSession):
        today = date.today()
        since = today - timedelta(days=30)

        result = await db.execute(select(Employee))
        employees = result.scalars().all()

        risks = []
        for emp in employees:
            total = (await db.execute(
                select(func.count()).select_from(Attendance)
                .where(and_(
                    Attendance.employee_id == emp.id,
                    Attendance.date >= since
                ))
            )).scalar() or 0

            present = (await db.execute(
                select(func.count()).select_from(Attendance)
                .where(and_(
                    Attendance.employee_id == emp.id,
                    Attendance.date >= since,
                    Attendance.status == AttendanceStatus.present
                ))
            )).scalar() or 0

            rate = round((present / total) * 100, 1) if total else 0.0

            if total == 0:
                level = "no_data"
            elif rate < 60:
                level = "critical"
            elif rate < 75:
                level = "high"
            elif rate < 85:
                level = "medium"
            else:
                level = "good"

            if level in ("critical", "high", "medium"):
                risks.append({
                    "employee_id": emp.id,
                    "employee_code": emp.employee_id,
                    "full_name": emp.full_name,
                    "department": emp.department,
                    "attendance_rate": rate,
                    "risk_level": level,
                })

        risks.sort(key=lambda x: x["attendance_rate"])
        return risks

    async def generate_note(self, db: AsyncSession, employee_id: int, status: str) -> str:
        emp_result = await db.execute(select(Employee).where(Employee.id == employee_id))
        emp = emp_result.scalar_one_or_none()

        if not emp:
            return "Attendance recorded."

        # Fallback if no API
        if not client:
            return f"{emp.full_name} marked as {status}."

        prompt = f"""
        Write a short professional HR note:
        Employee: {emp.full_name}
        Department: {emp.department}
        Status: {status}
        """

        try:
            response = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=100,
            )
            return response.choices[0].message.content.strip()

        except Exception as e:
            if "rate_limit" in str(e).lower():
                return "AI service busy. Try again later."
            return f"{emp.full_name} marked as {status}."

    async def hr_query(self, db: AsyncSession, question: str) -> str:
        today = date.today()

        total_emp = (await db.execute(
            select(func.count()).select_from(Employee)
        )).scalar() or 0

        present_today = (await db.execute(
            select(func.count()).select_from(Attendance)
            .where(and_(
                Attendance.date == today,
                Attendance.status == AttendanceStatus.present
            ))
        )).scalar() or 0

        risks = await self.get_risk_employees(db)
        risk_summary = ", ".join(
            [f"{r['full_name']} ({r['attendance_rate']}%)" for r in risks[:3]]
        )

        context = f"""
        Total employees: {total_emp}
        Present today: {present_today}
        At-risk employees: {risk_summary or "None"}
        """

        # Fallback mode
        if not client:
            return (
                f"Employees: {total_emp}, Present: {present_today}, "
                f"Risks: {risk_summary or 'None'}"
            )

        try:
            response = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": f"You are HR assistant. Context: {context}"},
                    {"role": "user", "content": question}
                ],
                temperature=0.5,
                max_tokens=300,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            print("AI ERROR:", str(e))   # 👈 ADD THIS
            return f"AI error: {str(e)}"
            # if "rate_limit" in str(e).lower():
            #     return "AI is busy right now. Please retry."
            # return "AI service error. Try later."


ai_service = AIService()