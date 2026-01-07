from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func

from .security import authenticate_user, create_access_token, get_current_admin
from .routers import auth, admin, employee, notifications
from .database import SessionLocal, engine
from . import models, schemas, crud
from .middlewares.logging import LoggAndAuthMiddleware
import os

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

