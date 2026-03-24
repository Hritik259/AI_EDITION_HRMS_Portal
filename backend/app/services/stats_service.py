from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.models import Employee, Attendance, AttendanceStatus
from app.schemas.dashboard import DashboardStats, RecentEmployee, WeekDay
from datetime import date, timedelta

class StatsService:

    async def compute(self, db: AsyncSession) -> DashboardStats:
        today = date.today()

        # Total employees
        total_emp = (await db.execute(select(func.count()).select_from(Employee))).scalar() or 0

        # Total departments
        total_dept = (await db.execute(
            select(func.count(Employee.department.distinct()))
        )).scalar() or 0

        # Today stats
        def today_count(status):
            return (
                select(func.count()).select_from(Attendance)
                .where(and_(Attendance.date == today, Attendance.status == status))
            )

        present_today = (await db.execute(today_count(AttendanceStatus.present))).scalar() or 0
        absent_today  = (await db.execute(today_count(AttendanceStatus.absent))).scalar() or 0
        late_today    = (await db.execute(today_count(AttendanceStatus.late))).scalar() or 0

        rate_today = round((present_today / total_emp * 100) if total_emp > 0 else 0, 1)

        # This week attendance count (present only)
        week_start = today - timedelta(days=today.weekday())
        week_total = (await db.execute(
            select(func.count()).select_from(Attendance)
            .where(and_(
                Attendance.date >= week_start,
                Attendance.date <= today,
                Attendance.status == AttendanceStatus.present
            ))
        )).scalar() or 0

        days_so_far = today.weekday() + 1
        avg_daily = round(week_total / days_so_far, 1) if days_so_far > 0 else 0.0

        # 7-day trend
        week_trend = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            p = (await db.execute(
                select(func.count()).select_from(Attendance)
                .where(and_(Attendance.date == d, Attendance.status == AttendanceStatus.present))
            )).scalar() or 0
            a = (await db.execute(
                select(func.count()).select_from(Attendance)
                .where(and_(Attendance.date == d, Attendance.status == AttendanceStatus.absent))
            )).scalar() or 0
            l = (await db.execute(
                select(func.count()).select_from(Attendance)
                .where(and_(Attendance.date == d, Attendance.status == AttendanceStatus.late))
            )).scalar() or 0
            week_trend.append(WeekDay(
                day=d.strftime("%a %d"),
                present=p, absent=a, late=l
            ))

        # Recent employees (last 5 added)
        recent_result = await db.execute(
            select(Employee).order_by(Employee.created_at.desc()).limit(5)
        )
        recent_emps = recent_result.scalars().all()
        recent = []
        for emp in recent_emps:
            cnt = (await db.execute(
                select(func.count()).select_from(Attendance)
                .where(and_(
                    Attendance.employee_id == emp.id,
                    Attendance.status == AttendanceStatus.present
                ))
            )).scalar() or 0
            recent.append(RecentEmployee(
                id=emp.id,
                employee_id=emp.employee_id,
                full_name=emp.full_name,
                department=emp.department,
                total_present_days=cnt
            ))

        return DashboardStats(
            total_employees=total_emp,
            total_departments=total_dept,
            present_today=present_today,
            absent_today=absent_today,
            late_today=late_today,
            attendance_rate_today=rate_today,
            attendance_this_week=week_total,
            avg_daily_attendance=avg_daily,
            week_trend=week_trend,
            recent_employees=recent
        )

stats_service = StatsService()
