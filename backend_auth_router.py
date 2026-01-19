from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from app.core.database import get_db

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# JWT Configuration
SECRET_KEY = "your-secret-key-change-this-in-production"  # TODO: Move to environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    password: str
    role: str = "fan"
    team_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    first_name: str
    last_name: str
    role: str
    school: Optional[str] = None
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    result = db.execute(
        text("SELECT * FROM users WHERE email = :email"),
        {"email": email}
    )
    user = result.fetchone()
    
    if user is None:
        raise credentials_exception
    return user

# Routes
@router.post("/register", response_model=UserResponse)
async def register(user: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    
    # Check if user already exists
    result = db.execute(
        text("SELECT id FROM users WHERE email = :email OR username = :username"),
        {"email": user.email, "username": user.username}
    )
    
    if result.fetchone():
        raise HTTPException(status_code=400, detail="Email or username already registered")
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Insert user
    insert_result = db.execute(text("""
        INSERT INTO users (email, username, first_name, last_name, password_hash, role, created_at)
        VALUES (:email, :username, :first_name, :last_name, :password_hash, :role, NOW())
        RETURNING id, email, username, first_name, last_name, role, created_at
    """), {
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "password_hash": hashed_password,
        "role": user.role
    })
    
    db.commit()
    new_user = insert_result.fetchone()
    
    return {
        "id": new_user[0],
        "email": new_user[1],
        "username": new_user[2],
        "first_name": new_user[3],
        "last_name": new_user[4],
        "role": new_user[5],
        "school": None,
        "created_at": new_user[6].isoformat()
    }

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    
    # Get user by email or username
    result = db.execute(
        text("SELECT * FROM users WHERE email = :username OR username = :username"),
        {"username": form_data.username}
    )
    user = result.fetchone()
    
    if not user or not verify_password(form_data.password, user[5]):  # password_hash is index 5
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user[1]},  # email is index 1
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user[0],
        "email": current_user[1],
        "username": current_user[2],
        "first_name": current_user[3],
        "last_name": current_user[4],
        "role": current_user[6],
        "school": current_user[7] if len(current_user) > 7 else None,
        "created_at": current_user[8].isoformat() if len(current_user) > 8 else datetime.now().isoformat()
    }
