from fastapi import WebSocket, APIRouter, WebSocketDisconnect
from .manager import manager

router = APIRouter()

@router.websocket("/ws/chat/global")
async def websocket_chat(websocket: WebSocket, emp_id : str):
   await manager.connect_global_chat(websocket, emp_id)
   try:
       while True:
           msg = await websocket.receive_text()
           await manager.send_global_chat({
               "type" : "Global_chat",
               "message" : msg
               })
               
   except WebSocketDisconnect:
       manager.disconnect_global_chat(websocket)
           