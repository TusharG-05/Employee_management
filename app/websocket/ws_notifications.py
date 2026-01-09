import asyncio
from fastapi import WebSocket, APIRouter, WebSocketDisconnect
from .manager import manager
router = APIRouter()

@router.websocket("/ws/notify/{emp_id}")
async def websocket_notifications(websocket : WebSocket, emp_id : str):
    await manager.connect_notification(websocket, emp_id)
    try:
        while True:
            await asyncio.sleep(60)
        
    except WebSocketDisconnect:
        manager.disconnect_notification(websocket, emp_id)

