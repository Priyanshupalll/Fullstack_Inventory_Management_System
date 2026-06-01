import hashlib
import secrets
import base64
import json
import time
import hmac
from .config import settings

# Use settings.ENV + settings.DATABASE_URL or simple fallback for secret key
SECRET_KEY = getattr(settings, "DATABASE_URL", "super_secret_auth_key_for_apexstock")

def hash_password(password: str) -> str:
    """
    Hashes a password using PBKDF2 with SHA-256 and a random 16-byte salt.
    Format: pbkdf2_sha256$100000$salt$key
    """
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    salt_b64 = base64.b64encode(salt).decode('utf-8')
    key_b64 = base64.b64encode(key).decode('utf-8')
    return f"pbkdf2_sha256$100000${salt_b64}${key_b64}"

def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verifies a password against a hashed password database record.
    """
    if not hashed_password:
        return False
    try:
        parts = hashed_password.split('$')
        if len(parts) != 4 or parts[0] != 'pbkdf2_sha256':
            return False
        iterations = int(parts[1])
        salt = base64.b64decode(parts[2].encode('utf-8'))
        original_key = base64.b64decode(parts[3].encode('utf-8'))
        check_key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
        return secrets.compare_digest(original_key, check_key)
    except Exception:
        return False

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode((data + padding).encode('utf-8'))

def create_jwt(payload: dict, expires_in: int = 86400) -> str:
    """
    Encodes a JWT token using HS256 algorithm without external dependencies.
    """
    payload_copy = payload.copy()
    payload_copy['exp'] = int(time.time()) + expires_in
    
    header = {"alg": "HS256", "typ": "JWT"}
    
    header_encoded = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_encoded = base64url_encode(json.dumps(payload_copy).encode('utf-8'))
    
    signature_input = f"{header_encoded}.{payload_encoded}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signature_input, hashlib.sha256).digest()
    signature_encoded = base64url_encode(signature)
    
    return f"{header_encoded}.{payload_encoded}.{signature_encoded}"

def decode_jwt(token: str) -> dict:
    """
    Decodes and verifies a JWT token. Returns payload dict or None if invalid/expired.
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        header_encoded, payload_encoded, signature_encoded = parts
        
        signature_input = f"{header_encoded}.{payload_encoded}".encode('utf-8')
        signature_check = hmac.new(SECRET_KEY.encode('utf-8'), signature_input, hashlib.sha256).digest()
        signature_check_encoded = base64url_encode(signature_check)
        
        if not secrets.compare_digest(signature_encoded, signature_check_encoded):
            return None
        
        payload = json.loads(base64url_decode(payload_encoded).decode('utf-8'))
        
        if payload.get('exp', 0) < time.time():
            return None
            
        return payload
    except Exception:
        return None
