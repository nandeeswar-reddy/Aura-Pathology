import hashlib
import secrets
from datetime import datetime, timedelta
from backend.database import create_session, get_session, delete_session

SALT_LENGTH = 16
PBKDF2_ITERATIONS = 100000

def hash_password(password: str) -> tuple[str, str]:
    """Generates a secure password hash and salt."""
    salt = secrets.token_hex(SALT_LENGTH)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        PBKDF2_ITERATIONS
    )
    return key.hex(), salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    """Verifies a password against its hash and salt."""
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        PBKDF2_ITERATIONS
    )
    return key.hex() == password_hash

def generate_session(user_id: int) -> str:
    """Creates a new session token and stores it in the database."""
    token = secrets.token_urlsafe(32)
    # Session valid for 24 hours
    expires_at = datetime.now() + timedelta(hours=24)
    create_session(token, user_id, expires_at)
    return token

def check_session(token: str) -> int | None:
    """Validates session token and returns user_id if valid."""
    if not token:
        return None
    session = get_session(token)
    if session:
        return session["user_id"]
    return None

def invalidate_session(token: str):
    """Deletes session token from database."""
    delete_session(token)
