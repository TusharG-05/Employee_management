from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, admin, employee, notifications
from .websockets import notifications as ws_notifications
from .middlewares.logging import LoggAndAuthMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggAndAuthMiddleware)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(employee.router)
app.include_router(notifications.router)
app.include_router(ws_notifications.router)
