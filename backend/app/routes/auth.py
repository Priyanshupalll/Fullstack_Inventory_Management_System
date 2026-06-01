from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
import json
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> models.User:
    """
    Dependency to resolve the current active user from the Authorization JWT header.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials are required."
        )
    
    token = authorization.split(" ")[1]
    payload = auth.decode_jwt(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or credentials are invalid. Please sign in again."
        )
    
    user = db.query(models.User).filter(models.User.email == payload["sub"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Associated user account no longer exists."
        )
    return user

@router.post("/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    # Check duplicate email
    email_clean = user_data.email.strip().lower()
    existing_user = db.query(models.User).filter(models.User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{email_clean}' already exists."
        )
    
    # Securely hash password
    hashed = auth.hash_password(user_data.password)
    
    new_user = models.User(
        email=email_clean,
        hashed_password=hashed,
        full_name=user_data.full_name.strip() if user_data.full_name else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create JWT
    token = auth.create_jwt({"sub": new_user.email, "name": new_user.full_name})
    return {"access_token": token, "user": new_user}

@router.post("/login", response_model=schemas.TokenResponse)
def login_user(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    email_clean = login_data.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email_clean).first()
    
    if not user or not user.hashed_password or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or account password."
        )
    
    # Create JWT
    token = auth.create_jwt({"sub": user.email, "name": user.full_name})
    return {"access_token": token, "user": user}

@router.post("/google", response_model=schemas.TokenResponse)
def auth_google(google_data: schemas.GoogleAuth, db: Session = Depends(get_db)):
    """
    Exposes a federated Google credential landing node. Works instantly in sandbox modes
    by decoding JWT structures or simulated mock profiles.
    """
    profile = None
    credential = google_data.credential
    
    try:
        # 1. Parse standard JWT token or Developer mock JSON payload
        if credential.strip().startswith("{"):
            profile = json.loads(credential)
        else:
            parts = credential.split('.')
            if len(parts) == 3:
                payload_bytes = auth.base64url_decode(parts[1])
                payload = json.loads(payload_bytes.decode('utf-8'))
                profile = {
                    "email": payload.get("email"),
                    "name": payload.get("name") or (payload.get("given_name", "") + " " + payload.get("family_name", "")).strip(),
                    "google_id": payload.get("sub"),
                    "picture": payload.get("picture")
                }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process Google account credentials: {str(e)}"
        )
        
    if not profile or not profile.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve profile credentials from Google account token."
        )
        
    email_clean = profile["email"].strip().lower()
    
    # 2. Check if user already exists
    user = db.query(models.User).filter(models.User.email == email_clean).first()
    
    if not user:
        # Create new federated Google User
        user = models.User(
            email=email_clean,
            full_name=profile.get("name"),
            google_id=profile.get("google_id"),
            avatar_url=profile.get("picture")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update google profile credentials if not set
        updated = False
        if not user.google_id:
            user.google_id = profile.get("google_id")
            updated = True
        if profile.get("picture") and not user.avatar_url:
            user.avatar_url = profile.get("picture")
            updated = True
        if updated:
            db.commit()
            db.refresh(user)
            
    # Create JWT session token
    token = auth.create_jwt({"sub": user.email, "name": user.full_name})
    return {"access_token": token, "user": user}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
