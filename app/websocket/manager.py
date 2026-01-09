from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.notification_connections: dict[str, list[WebSocket]] = {}
        self.global_chat: dict[str, list[WebSocket]] = {}
    
    async def connect_notification(self, websocket: WebSocket, emp_id : str):
        await websocket.accept()
        if emp_id not in self.notification_connections:
            self.notification_connections[emp_id] = []
        
        self.notification_connections[emp_id].append(websocket)
    
    def disconnect_notification (self, websocket : WebSocket, emp_id : str):
        if emp_id in self.notification_connections:    
            if websocket in self.notification_connections[emp_id]:  
                self.notification_connections[emp_id].remove(websocket)
            if not self.notification_connections[emp_id]:
                del self.notification_connections[emp_id]
    
    async def send_notification(self, message : dict, emp_id : str):
        if emp_id in self.notification_connections:
            for connection in self.notification_connections[emp_id]:
                await connection.send_json(message)
                
    
    async def connect_global_chat(self, websocket : WebSocket, emp_id: str):
        await websocket.accept()
        self.global_chat[emp_id] = websocket
    
    def disconnect_global_chat(self, websocket : WebSocket):
        if websocket in self.global_chat:
            del self.global_chat[websocket]
    
    async def send_global_chat(self, message : dict, sender_emp_id: str):
        for chat_ws, emp_id in self.global_chat.items():
            if emp_id != sender_emp_id:  # Don't send to sender
                await chat_ws.send_json(message)

manager = ConnectionManager()

