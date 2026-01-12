from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, admin, employee, notifications, global_chat
from .middlewares.logging import LoggAndAuthMiddleware
from .websocket import global_chat as ws_global_chat, ws_notifications

app = FastAPI()
app.add_middleware(LoggAndAuthMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(employee.router)
app.include_router(notifications.router)
app.include_router(global_chat.router)
app.include_router(ws_global_chat.router)
app.include_router(ws_notifications.router)

