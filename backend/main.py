from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, schemas, crud
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/admin/add-employee")
def add_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    return crud.create_employee(db, employee)

@app.get("/admin/employees")
def list_employees(db: Session = Depends(get_db)):
    return crud.get_all_employees(db)

@app.get("/admin/employee/{emp_id}")
def get_employee(emp_id: str, db: Session = Depends(get_db)):
    emp = crud.get_employee(db, emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@app.delete("/admin/delete/{emp_id}")
def delete_employee(emp_id: str, db: Session = Depends(get_db)):
    crud.delete_employee(db, emp_id)
    return {"message": "Employee deleted"}

@app.post("/employee/login")
def employee_login(data: schemas.EmployeeLogin, db: Session = Depends(get_db)):
    emp = crud.get_employee(db, data.emp_id)
    if not emp or emp.password != data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Login successful"}

@app.get("/employee/attendance/{emp_id}")
def employee_attendance(emp_id: str, db: Session = Depends(get_db)):
    record = db.query(models.Attendance).filter_by(emp_id=emp_id).first()
    return record

@app.get("/admin/attendance")
def admin_attendance(db: Session = Depends(get_db)):
    return db.query(models.Attendance).all()

@app.put("/admin/attendance/{emp_id}")
def update_attendance(emp_id: str, data: schemas.AttendanceUpdate, db: Session = Depends(get_db)):
    """Update or create attendance record for the given employee."""
    record = db.query(models.Attendance).filter_by(emp_id=emp_id).first()
    if record:
        record.status = data.status
    else:
        record = models.Attendance(emp_id=emp_id, status=data.status)
        db.add(record)
    db.commit()
    return {"message": "Attendance updated"}

@app.patch("/admin/employee/{emp_id}")
def update_employee(emp_id: str, data: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
    updated = crud.update_employee(db, emp_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee updated successfully"}

@app.get("/employee/profile/{emp_id}")
def employee_profile(emp_id: str, db: Session = Depends(get_db)):
    emp = crud.get_employee(db, emp_id)
    return emp

# NEW DEPARTMENT ENDPOINT
@app.get("/admin/departments")
def get_departments(db: Session = Depends(get_db)):
    """Get department statistics from master list combined with employees."""
    # Seed master list from existing employees if empty (backwards compatibility)
    if db.query(models.DeptMaster).count() == 0:
        employees = db.query(models.Employee).all()
        seen = set()
        for emp in employees:
            if emp.dept and emp.dept.upper() not in seen:
                seen.add(emp.dept.upper())
                db.add(models.DeptMaster(name=emp.dept.upper()))
        db.commit()

    departments = db.query(models.DeptMaster).all()
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


@app.post("/admin/departments")
def add_department(data: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    dept = crud.create_department(db, data)
    return {"id": dept.id, "name": dept.name}


@app.delete("/admin/departments/{name}")
def remove_department(name: str, db: Session = Depends(get_db)):
    # Prevent deleting if any employee is assigned
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