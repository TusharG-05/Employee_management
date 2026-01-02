from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from .. import schemas
from ..security import authenticate_user, create_access_token
from ..dependencies import get_db

router = APIRouter()

@router.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.emp_id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/employee/login")
def employee_login(data: schemas.EmployeeLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.emp_id, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.emp_id})
    return {"access_token": access_token, "token_type": "bearer"}