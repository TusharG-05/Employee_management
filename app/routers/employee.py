from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, crud, schemas
from ..dependencies import get_db

from ..security import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter()

@router.post("/employee/attendance")
def employee_mark_attendance(status: schemas.AttendanceStatus, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    crud.mark_attendance(db, current_user, status)
    return {"message": "Attendance marked successfully"}

@router.get("/employee/attendance/{emp_id}")
def employee_attendance(emp_id: str, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    if emp_id != current_user:
         raise HTTPException(status_code=403, detail="Not authorized to view this attendance")
    
    record = db.query(models.Attendance).filter_by(emp_id=emp_id).first()
    return record

@router.get("/employee/profile/{emp_id}")
def employee_profile(emp_id: str, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    if emp_id != current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this profile"
        )
    emp = crud.get_employee(db, emp_id)
    return emp

@router.post("/employee/leave", response_model=schemas.LeaveOut)
def employee_apply_leave(leave : schemas.LeaveCreate, db : Session = Depends(get_db),current_user = Depends(get_current_user)):
    emp = crud.get_employee(db, current_user)
    if not emp or emp.role != "employee":
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.apply_leave(db, current_user, leave)

@router.get("/employee/leave", response_model=list[schemas.LeaveOut])
def employee_get_leave(db : Session = Depends(get_db),current_user = Depends(get_current_user)):
    emp = crud.get_employee(db, current_user)
    if not emp or emp.role != "employee":
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_leaves_status(db,current_user)

