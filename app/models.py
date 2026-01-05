from sqlalchemy import Column, String, Integer, Float, ForeignKey, Enum, Date
from sqlalchemy.sql import func
import enum
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
    