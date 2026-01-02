from datetime import datetime, timedelta, timezone
import secrets, random
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import SessionLocal
import models

# Secret key for JWT (in production, use environment variable)
# with open("backend/secret.key") as f:
#     keys = [line.strip() for line in f if line.strip()]
# SECRET_KEY = random.choice(keys)
SECRET_KEY = secrets.token_hex(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hash a password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Session, emp_id: str, password: str):
    """Authenticate user by emp_id and password."""
    user = db.query(models.Employee).filter(models.Employee.emp_id == emp_id).first()
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user

def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency to get current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        emp_id: str = payload.get("sub")
        if emp_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    # Here, we could fetch user from DB, but for simplicity, return emp_id
    # In production, verify user still exists
    return emp_id

def get_current_admin(current_user: str = Depends(get_current_user)):
    """Dependency to ensure user is admin (emp_id starts with ADMIN)."""
    if not current_user.startswith("ADMIN"):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user