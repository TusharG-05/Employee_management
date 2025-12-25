from pydantic import BaseModel
from typing import Optional

class EmployeeCreate(BaseModel):
    name: str
    age: int
    dept: str
    salary: int
    role: Optional[str] = "employee"  # New: Role field, default "employee"


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
    role: Optional[str] = None  # New: Optional role update


class DepartmentCreate(BaseModel):
    name: str


class Token(BaseModel):  # New: For JWT response
    access_token: str
    token_type: str