from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, crud
from ..security import get_current_admin
from ..dependencies import get_db

router = APIRouter()

@router.post("/admin/add-employee")
def add_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db), current_user: str = Depends(get_current_admin)):
    return crud.create_employee(db, employee)

@router.get("/admin/employee/{emp_id}", response_model=schemas.EmployeeOut)
def get_employee(emp_id: str, db: Session = Depends(get_db), current_user: str = Depends(get_current_admin)):
    emp = crud.get_employee(db, emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@router.delete("/admin/delete/{emp_id}")
def delete_employee(emp_id: str, db: Session = Depends(get_db), current_user: str = Depends(get_current_admin)):
    crud.delete_employee(db, emp_id)
    return {"message": "Employee deleted"}

@router.get("/admin/attendance")
def admin_attendance(db: Session = Depends(get_db), current_user: str = Depends(get_current_admin)):
    return db.query(models.Attendance).all()

@router.put("/admin/attendance/{emp_id}")
def update_attendance(emp_id: str, data: schemas.AttendanceUpdate, db: Session = Depends(get_db), current_user: str = Depends(get_current_admin)):
    """Update or create attendance record for the given employee."""
    record = db.query(models.Attendance).filter_by(emp_id=emp_id).first()
    if record:
        record.status = data.status
    else:
        record = models.Attendance(emp_id=emp_id, status=data.status)
        db.add(record)
    db.commit()
    return {"message": "Attendance updated"}

@router.patch("/admin/employee/{emp_id}")
def update_employee(emp_id: str, data: schemas.EmployeeUpdate, db: Session = Depends(get_db), current_user: str = Depends(get_current_admin)):
    updated = crud.update_employee(db, emp_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee updated successfully"}

@router.get("/admin/departments")
def get_departments(db: Session = Depends(get_db), current_user: str = Depends(get_current_admin)):
    """Get department statistics from master list combined with employees."""
    
    departments = db.query(models.Department).all()
    result = []
    for dept in departments:
        q = db.query(models.Employee).filter(models.Employee.dept == dept.name)
        employee_count = q.count()
        total_salary = sum(emp.salary for emp in q.all()) if employee_count > 0 else 0
        average_salary = total_salary / employee_count if employee_count > 0 else 0
        result.append({
            "department": dept.name,
            "employee_count": employee_count,
            "total_salary": total_salary,
            "average_salary": average_salary,
        })
    return result

@router.post("/admin/departments")
def add_department(data: schemas.DepartmentCreate, db: Session = Depends(get_db), current_user: str = Depends(get_current_admin)):
    dept = crud.create_department(db, data)
    return {"id": dept.id, "name": dept.name}

@router.delete("/admin/departments/{name}")
def remove_department(name: str, db: Session = Depends(get_db), current_user: str = Depends(get_current_admin)):
    count = db.query(models.Employee).filter(models.Employee.dept == name.upper()).count()
    if count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete department '{name}' because {count} employee(s) are assigned to it."
        )
    deleted = crud.delete_department(db, name)
    if not deleted:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"message": "Department deleted successfully"}

@router.get("/admin/employees", response_model=schemas.EmployeeListResponse)
def list_employees(skip: int = 0, limit: int = 10, name: str | None = None, db: Session = Depends(get_db), current_user: str = Depends(get_current_admin)):
    return crud.get_limit_employees(skip, limit, name, db)

@router.patch("/admin/leave/{leave_id}")
async def update_leave_status(leave_id : int, decision : schemas.LeaveDecision, db : Session = Depends(get_db), current_user : str = Depends(get_current_admin)):
    emp = crud.get_employee(db, current_user)
    if not emp or emp.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return await crud.leave_decision(db, leave_id, decision, current_user)

@router.get("/admin/leaves", response_model=list[schemas.LeaveOut])
def list_leaves(db: Session = Depends(get_db), current_user: str = Depends(get_current_admin)):
    return crud.list_all_leaves(db)