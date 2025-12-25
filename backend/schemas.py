from pydantic import BaseModel
from typing import Optional

class EmployeeCreate(BaseModel):
    name: str
    age: int
    dept: str
    salary: int


class EmployeeLogin(BaseModel):
    emp_id: str
    password: str


class AttendanceUpdate(BaseModel):
    status: str

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    dept: Optional[str] = None
    salary: Optional[int] = None


class DepartmentCreate(BaseModel):
    name: str