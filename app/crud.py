from sqlalchemy.orm import Session
from sqlalchemy import func, Integer
from .models import Employee, Department, Attendance, AttendanceStatus, Leave, Notifications
from . import schemas
from .security import get_password_hash
from fastapi import HTTPException
import re, random, string
from datetime import date, datetime

def generate_emp_id(db: Session, name: str, role: str = "employee"):
    name_upper = name.upper().replace(' ', '')
    prefix = "ADMIN" if role == "admin" else ""
    last_emp = db.query(Employee).order_by(func.cast(func.right(Employee.emp_id, 3), Integer).desc()).first()
    if last_emp:
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
    dept_name = data.dept.upper()
    existing_dept = db.query(Department).filter(Department.name == dept_name).first()
    if not existing_dept:
        raise HTTPException(status_code=400, detail=f"Department '{dept_name}' does not exist.")
    emp_id = generate_emp_id(db, data.name, role)
    password = generate_password()
    hashed_password = get_password_hash(password)

    employee = Employee(
        emp_id=emp_id, name=data.name, age=data.age, dept=dept_name,
        salary=data.salary, password=hashed_password, role=role
    )
    db.add(employee)
    db.flush()
    attendance = Attendance(emp_id=emp_id, status=AttendanceStatus.ABSENT)
    db.add(attendance)
    db.commit()
    return {"emp_id": emp_id, "password": password}

def get_all_employees(db: Session):
    return db.query(Employee).all()

def get_employee(db: Session, emp_id: str):
    return db.query(Employee).filter(Employee.emp_id == emp_id).first()

def update_employee(db: Session, emp_id: str, data: schemas.EmployeeUpdate):
    employee = db.query(Employee).filter(Employee.emp_id == emp_id).first()
    if not employee: return None
    if data.name: employee.name = data.name.upper()
    if data.age: employee.age = data.age
    if data.salary: employee.salary = data.salary
    if data.dept:
        dept_name = data.dept.upper()
        if not db.query(Department).filter(Department.name == dept_name).first():
             raise HTTPException(status_code=400, detail=f"Department '{dept_name}' does not exist.")
        employee.dept = dept_name
    if data.role: 
        employee.role = data.role
    db.commit()
    db.refresh(employee)
    return employee

def delete_employee(db: Session, emp_id: str):
    db.query(Attendance).filter(Attendance.emp_id == emp_id).delete()
    db.query(Employee).filter(Employee.emp_id == emp_id).delete()
    db.commit()

def mark_attendance(db: Session, emp_id: str, status: AttendanceStatus):
    attendance = db.query(Attendance).filter(Attendance.emp_id == emp_id).first()
    if attendance:
        attendance.status = status
    else:
        attendance = Attendance(emp_id=emp_id, status=status)
        db.add(attendance)

    db.commit()
    return attendance

def list_departments(db: Session):
    return db.query(Department).all()

def create_department(db: Session, data: schemas.DepartmentCreate):
    name = data.name.upper()
    existing = db.query(Department).filter(Department.name == name).first()
    if existing:
        return existing
    dept = Department(name=name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

def delete_department(db: Session, name: str):
    name = name.upper()
    dept = db.query(Department).filter(Department.name == name).first()
    if not dept:
        return False
    db.delete(dept)
    db.commit()
    return True

def get_limit_employees(skip: int, limit: int, name: str | None, db: Session):
    query = db.query(Employee)
    if name:
        query = query.filter(Employee.name.ilike(f"%{name}%"))
    total = query.count()
    list_employees = query.offset(skip).limit(limit).all()
    return {"total": total, "list_of_employees": list_employees}

def apply_leave(db :Session,emp_id : str , data : schemas.LeaveCreate):
    if data.leave_date <= date.today():
        raise HTTPException(status_code=400, detail="Leave date cannot be in the past")
    leave = Leave(
        emp_id=emp_id, leave_date=data.leave_date, reason=data.reason,
        status="PENDING", applied_at=datetime.now(),
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave    

def leave_decision(db:Session, leave_id : int, data : schemas.LeaveDecision, admin_id : str):
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="leave not found or applied yet")
    
    if leave.status != "PENDING":
        raise HTTPException(status_code=400, detail="leave is not pending")
    
    leave.status = data.decision
    leave.approved_at = datetime.now()
    leave.approved_by = admin_id

    notification = Notifications(
        emp_id=leave.emp_id,
        message=f"Your leave request for {leave.leave_date} has been {data.decision.lower()}",
        is_read=False,
    )
    try:
        db.add(notification)
        db.commit()
        db.refresh(leave)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process leave decision: {str(e)}")
    return leave

def get_leaves_status(db: Session, emp_id : str):
    return db.query(Leave).filter(Leave.emp_id == emp_id).order_by(Leave.applied_at.desc()).all()

def list_all_leaves(db: Session):
    return db.query(Leave).order_by(Leave.applied_at.desc()).all()

def get_notifications(db : Session, emp_id : str):
    return db.query(Notifications).filter(Notifications.emp_id == emp_id).order_by(Notifications.created_at.desc()).all()

def read_notification(db : Session, id : int,current_user : str):
    notification = db.query(Notifications).filter(Notifications.id == id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return notification

def delete_notification(id : int, db : Session, current_user : str):
    notification = db.query(Notifications).filter(Notifications.id == id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notification)
    db.commit()
    return {"message" : "Notification Deleted Successfully"}

def mark_read_all_notifications(db : Session, current_user : str):
    notifications = db.query(Notifications).filter(Notifications.emp_id == current_user).all()
    if not notifications:
        return "No Notifications Found"
    for notification in notifications:
        notification.is_read = True
    db.commit()
    return notifications
