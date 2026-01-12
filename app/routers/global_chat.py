from fastapi import APIRouter, Depends, HTTPException
from .. import schemas, crud 
from ..database import get_db
from sqlalchemy.orm import Session
from ..security import get_current_user
from ..websocket.manager import manager

router = APIRouter(prefix="/chat")

@router.get("/history", response_model=list[schemas.chatMessageOut])
def get_chat_history(limit : int = 50, before_id : int = None, db : Session = Depends(get_db), current_user : str = Depends(get_current_user)):
    return crud.chat_history(db, limit, before_id)

@router.post("/message", response_model=schemas.chatMessageOut)
async def send_message(message : schemas.chatMessageIn, db : Session = Depends(get_db), current_user : str = Depends(get_current_user)):
    user = crud.get_employee(db, current_user)
    if not user:
        raise HTTPException(status_code=404, detail= "user not found")
    saved_msg = crud.save_chat_message(db,user.emp_id, user.name, message.message)
    await manager.send_global_chat({
        "type": "message",
        "id": saved_msg.id,
        "emp_id": user.emp_id,
        "emp_name": user.name,
        "message": message.message,
        "created_at": saved_msg.created_at.isoformat()
    })
    return saved_msg

@router.put("/message/{message_id}")
def edit_message(message_id: int, new_message : str , db : Session = Depends(get_db),current_user : str = Depends(get_current_user)):
    updated_msg = crud.update_chat_message(db, message_id,current_user,new_message)
    return updated_msg

@router.delete("/message/{message_id}")
def delete_message(message_id : int, db : Session = Depends(get_db), current_user : str = Depends(get_current_user)):
    return crud.delete_message(db, message_id, current_user)
