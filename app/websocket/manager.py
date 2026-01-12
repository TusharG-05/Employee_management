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
        emp_id_to_remove = None
        for emp_id, ws in self.global_chat.items():
            if ws == websocket:
                emp_id_to_remove = emp_id
                break
        if emp_id_to_remove:
            del self.global_chat[emp_id_to_remove]
    
    async def send_global_chat(self, message : dict):
        for emp_id, chat_ws in self.global_chat.items():
            try:
                await chat_ws.send_json(message)
            except Exception as e:
                print(f"Failed to send message to {emp_id}: {e}")

manager = ConnectionManager()

