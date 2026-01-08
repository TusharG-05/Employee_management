from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, emp_id : str):
        await websocket.accept()
        if emp_id not in self.active_connections:
            self.active_connections[emp_id] = []
        
        self.active_connections[emp_id].append(websocket)
    
    def disconnect(self, websocket : WebSocket, emp_id : str):
        if websocket in self.active_connections[emp_id]:  
           self.active_connections[emp_id].remove(websocket)
        if not self.active_connections[emp_id]:
            del self.active_connections[emp_id]
    
    async def send_personal_message(self, message : dict, emp_id : str):
        if emp_id in self.active_connections:
            for connection in self.active_connections[emp_id]:
                await connection.send_json(message)

manager = ConnectionManager()

