from fastapi import WebSocket, APIRouter, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from .manager import manager
from ..database import get_db
from ..models import Employee
from .. import crud
import json

router = APIRouter()

@router.websocket("/ws/chat/global")
async def websocket_chat(websocket: WebSocket, emp_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.emp_id == emp_id).first()
    if not employee:
        await websocket.close(code=1008)
        return
    
    await manager.connect_global_chat(websocket, emp_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            saved_msg = crud.save_chat_message(db=db, emp_id=emp_id, emp_name=employee.name, message=message_data.get("message", ""))
            
            broadcast_message = {
                "type": "Global_chat",
                "id": saved_msg.id,
                "emp_id": emp_id,
                "emp_name": employee.name,
                "message": message_data.get("message", ""),
                "created_at": saved_msg.created_at.isoformat()
            }
            
            await manager.send_global_chat(broadcast_message)
                
    except WebSocketDisconnect:
        manager.disconnect_global_chat(websocket)