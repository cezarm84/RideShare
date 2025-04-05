from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.user_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user

def get_db_session() -> Session:
    return Depends(get_db)