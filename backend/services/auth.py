import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app

import bcrypt


# ── JWT helpers ──────────────────────────────────────────────

def get_secret():
    return current_app.config.get('JWT_SECRET', 'orgmemory-super-secret-key-change-in-prod')


def generate_token(user_id: str) -> str:
    """Generate a JWT token valid for 7 days."""
    payload = {
        'sub': user_id,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, get_secret(), algorithm='HS256')


def decode_token(token: str):
    """Decode and validate a JWT token. Returns payload dict or raises."""
    return jwt.decode(token, get_secret(), algorithms=['HS256'])


# ── Password helpers ──────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Hash a plain-text password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(plain.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


# ── Auth middleware decorator ────────────────────────────────

def require_auth(f):
    """Decorator that extracts and validates JWT from Authorization header.
    Injects `current_user` dict into the request context (g).
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        from flask import g
        from models.user import find_user_by_id

        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization header missing or invalid. Use: Bearer <token>'}), 401

        token = auth_header.split(' ', 1)[1].strip()
        try:
            payload = decode_token(token)
            user_id = payload.get('sub')
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired. Please log in again.'}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401

        user = find_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 401

        # Attach user to Flask g (request context)
        g.current_user = user
        return f(*args, **kwargs)

    return decorated
