from pydantic import BaseModel
from .models import AttendanceStatus
from datetime import date, datetime
from typing import Optional, List, Literal

class EmployeeCreate(BaseModel):
    name: str
    age: int
    dept: str
    salary: float
    role: Optional[str] = None
 
class EmployeeOut(BaseModel):
    emp_id: str
    name: str
    age: int
    dept: str
    salary: float
    role: str

class EmployeeLogin(BaseModel):
    emp_id: str
    password: str

class AttendanceUpdate(BaseModel):
    status: AttendanceStatus
    date : date = None 


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    dept: Optional[str] = None
    salary: Optional[int] = None
    role: Optional[str] = None

class DepartmentCreate(BaseModel):
    name: str

class Token(BaseModel):
    access_token: str
    token_type: str
    emp_id: Optional[str] = None
    password: Optional[str] = None
    
class EmployeeListResponse(BaseModel):
    total: int
    list_of_employees: List[EmployeeOut]

class LeaveCreate(BaseModel):
    leave_date: date
    reason: Optional[str] = None

class LeaveDecision(BaseModel):
    decision : Literal["ACCEPTED", "REJECTED"]

class LeaveOut(BaseModel):
    id : int
    emp_id: str
    leave_date: date
    reason: Optional[str]
    status: str
    applied_at: datetime
    approved_at: Optional[datetime]

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: int
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class chatMessageIn(BaseModel):
    message : str
    
class chatMessageOut(BaseModel):
    id : int
    emp_id : str
    emp_name : str
    message : str
    created_at : datetime
    edited_at : Optional[datetime]
    is_deleted : bool
    
    class Config:
        from_attributes = True
