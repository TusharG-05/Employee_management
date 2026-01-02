from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, crud
from ..dependencies import get_db

router = APIRouter()

@router.get("/employee/attendance/{emp_id}")
def employee_attendance(emp_id: str, db: Session = Depends(get_db)):
    record = db.query(models.Attendance).filter_by(emp_id=emp_id).first()
    return record

@router.get("/employee/profile/{emp_id}")
def employee_profile(emp_id: str, db: Session = Depends(get_db)):
    emp = crud.get_employee(db, emp_id)
    return emp