from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, crud, schemas
from ..dependencies import get_db

from ..security import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter()

@router.get("/notifications", response_model=list[schemas.NotificationOut])
def employee_get_Notifications(db:Session = Depends(get_db), current_user : str = Depends(get_current_user)):
    return crud.get_notifications(db, current_user)

@router.patch("/notifications/{id}/read", response_model=schemas.NotificationOut)
def read_notification(id : int,db:Session= Depends(get_db), current_user : str = Depends(get_current_user)):
    return crud.read_notification(db, id, current_user)

@router.patch("/notifications", response_model=list[schemas.NotificationOut])
def mark_read_all_notifications(db : Session = Depends(get_db), current_user : str = Depends(get_current_user)):
    return crud.mark_read_all_notifications(db,current_user)

@router.delete("/notifications/{id}")
def delete_notification(id : int,db:Session= Depends(get_db), current_user : str = Depends(get_current_user)):
    return crud.delete_notification(id, db , current_user)
