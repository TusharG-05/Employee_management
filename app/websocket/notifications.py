from fastapi import WebSocket, APIRouter, WebSocketDisconnect
from .manager import manager
router = APIRouter()

@router.websocket("/ws/{emp_id}")
async def websocket_notifications(websocket : WebSocket, emp_id : str):
    await manager.connect(websocket, emp_id)
    try:
        while True:
            await websocket.receive_text()
        
    except WebSocketDisconnect:
        manager.disconnect(websocket, emp_id)

