from sqlalchemy import Column, String, Integer, Float, ForeignKey, Enum, Date, DateTime
from sqlalchemy.sql import func
import enum
from datetime import datetime
from .database import Base

class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LEAVE = "leave"

class Employee(Base):
    __tablename__ = "employees"

    emp_id = Column(String, primary_key=True)
    name = Column(String)
    age = Column(Integer)
    dept = Column(String)
    salary = Column(Float)
    password = Column(String)
    role = Column(String, default="employee") 


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    emp_id = Column(String, ForeignKey("employees.emp_id"))
    date = Column(Date, default=func.now())
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.ABSENT)
    
class Leave(Base):
    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True)
    emp_id = Column(String, ForeignKey("employees.emp_id"))
    leave_date = Column(Date,nullable=False) 
    reason = Column(String)
    status = Column(String, default="PENDING")
    applied_at = Column(DateTime, default=datetime.utcnow)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)

   