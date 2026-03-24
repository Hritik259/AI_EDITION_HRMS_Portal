from pydantic import BaseModel
from typing import Optional

class RecentEmployee(BaseModel):
    id:                 int
    employee_id:        str
    full_name:          str
    department:         str
    total_present_days: int = 0

class WeekDay(BaseModel):
    day:     str
    present: int
    absent:  int
    late:    int

class DashboardStats(BaseModel):
    total_employees:       int
    total_departments:     int
    present_today:         int
    absent_today:          int
    late_today:            int
    attendance_rate_today: float
    attendance_this_week:  int
    avg_daily_attendance:  float
    week_trend:            list[WeekDay]
    recent_employees:      list[RecentEmployee]
