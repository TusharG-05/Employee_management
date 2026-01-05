from pydantic import BaseModel
from .models import AttendanceStatus
from datetime import date
from typing import Optional, List

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
    date: date = None


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