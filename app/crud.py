import random
import string
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer
from .models import Employee, Department, Attendance, DeptMaster, AttendanceStatus
from . import schemas
from .security import get_password_hash
import re

def generate_emp_id(db: Session, name: str, role: str = "employee"):
    name_upper = name.upper().replace(' ', '')
    prefix = "ADMIN" if role == "admin" else ""
    
    # Get the emp_id with the largest numeric part across all
    last_emp = (
        db.query(Employee)
        .order_by(func.cast(func.right(Employee.emp_id, 3), Integer).desc())
        .first()
    )
    
    if last_emp:
        # Extract the number from the end of the emp_id
        emp_id_str = last_emp.emp_id
        match = re.search(r'(\d+)$', emp_id_str)
        if match:
            last_number = int(match.group(1))
            new_number = last_number + 1
        else:
            new_number = 1
    else:
        new_number = 1
    
    return f"{prefix}{name_upper}{str(new_number).zfill(3)}"

def generate_password(length=8):
    chars = string.ascii_letters + string.digits + "@#"
    return ''.join(random.choice(chars) for _ in range(length))

def create_employee(db: Session, data: schemas.EmployeeCreate):
    role = data.role or "employee"
    emp_id = generate_emp_id(db, data.name, role)
    password = generate_password()
    hashed_password = get_password_hash(password)  # Hash the password

    employee = Employee(
        emp_id=emp_id,
        name=data.name,
        age=data.age,
        dept=data.dept,
        salary=data.salary,
        password=hashed_password,  # Store hashed password
        role=role  # Set role (*default - "employee") 
    )
    db.add(employee)
    db.flush()

    # ensure department master entry exists
    dept_name = data.dept.upper()
    existing = db.query(DeptMaster).filter(DeptMaster.name == dept_name).first()
    if not existing:
        db.add(DeptMaster(name=dept_name))
    
    department = Department(
        emp_id=emp_id,
        department=dept_name
    )
    
    db.add(department)
    attendance = Attendance(
        emp_id=emp_id,
        status=AttendanceStatus.ABSENT
    )# 1. FIX: Missing get_employee function
    db.add(attendance)
    db.commit()

    return {
        "emp_id": emp_id,
        "password": password
    }

def get_all_employees(db: Session):
    return db.query(Employee).all()

def get_employee(db: Session, emp_id: str):
    """Get a single employee by ID"""
    return db.query(Employee).filter(Employee.emp_id == emp_id).first()

def update_employee(db: Session, emp_id: str, data: schemas.EmployeeUpdate):
    employee = db.query(Employee).filter(Employee.emp_id == emp_id).first()

    if not employee:
        return None

    if data.name is not None:
        employee.name = data.name.upper()

    if data.age is not None:
        employee.age = data.age

    if data.salary is not None:
        employee.salary = data.salary

    if data.dept is not None:
        dept_name = data.dept.upper()
        employee.dept = dept_name

        department = db.query(Department).filter(
            Department.emp_id == emp_id
        ).first()

        if department:
            department.department = dept_name

        # ensure department exists in master list
        existing = db.query(DeptMaster).filter(DeptMaster.name == dept_name).first()
        if not existing:
            db.add(DeptMaster(name=dept_name))

    if data.role is not None:
        employee.role = data.role

    db.commit()
    db.refresh(employee)
    return employee

def delete_employee(db: Session, emp_id: str):
    db.query(Attendance).filter(Attendance.emp_id == emp_id).delete()
    db.query(Department).filter(Department.emp_id == emp_id).delete()
    db.query(Employee).filter(Employee.emp_id == emp_id).delete()
    db.commit()


def mark_attendance(db: Session, emp_id: str, status: AttendanceStatus):
    """Update or create attendance record for employee"""
    attendance = db.query(Attendance).filter(Attendance.emp_id == emp_id).first()

    if attendance:
        attendance.status = status
    else:
        attendance = Attendance(
            emp_id=emp_id,
            status=status
        )
        db.add(attendance)

    db.commit()
    return attendance


def list_departments(db: Session):
    """Return all department master records."""
    return db.query(DeptMaster).all()


def create_department(db: Session, data: schemas.DepartmentCreate):
    name = data.name.upper()
    existing = db.query(DeptMaster).filter(DeptMaster.name == name).first()
    if existing:
        return existing
    dept = DeptMaster(name=name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

def delete_department(db: Session, name: str):
    """Delete a department from master list (does not touch employees)."""
    name = name.upper()
    dept = db.query(DeptMaster).filter(DeptMaster.name == name).first()
    if not dept:
        return False
    db.delete(dept)
    db.commit()
    return True


def get_limit_employees(skip : int, limit : int , name : str | None , db : Session):
    query = db.query(Employee)
    if name:
        query = query.filter(Employee.name.ilike(f"%{name}%"))
    total = query.count()
    list_employees = query.offset(skip).limit(limit).all()
    return {
        "total" : total,
        "list_of_employees" : list_employees 
    }
        