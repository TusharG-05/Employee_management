from sqlalchemy import Column, String, Integer, Float, ForeignKey
from .database import Base

class Employee(Base):
    __tablename__ = "employees"

    emp_id = Column(String, primary_key=True)
    name = Column(String)
    age = Column(Integer)
    dept = Column(String)
    salary = Column(Float)
    password = Column(String)
    role = Column(String, default="employee")  # New: Role column, default to "employee"


class DeptMaster(Base):
    __tablename__ = "dept_master"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    emp_id = Column(String, ForeignKey("employees.emp_id"))
    department = Column(String)


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    emp_id = Column(String, ForeignKey("employees.emp_id"))
    status = Column(String)
    