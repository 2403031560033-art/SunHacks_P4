import json
import os
import uuid
from datetime import datetime
from threading import Lock

USERS_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'users.json')
_lock = Lock()


def _load_users():
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return []


def _save_users(users):
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)


def find_user_by_email(email):
    users = _load_users()
    return next((u for u in users if u['email'].lower() == email.lower()), None)


def find_user_by_id(user_id):
    users = _load_users()
    return next((u for u in users if u['id'] == user_id), None)


def create_user(name, email, hashed_password):
    with _lock:
        users = _load_users()
        # Double-check uniqueness inside lock
        if any(u['email'].lower() == email.lower() for u in users):
            return None, 'Email already registered'

        user = {
            'id': str(uuid.uuid4()),
            'name': name.strip(),
            'email': email.lower().strip(),
            'password': hashed_password,      # already bcrypt-hashed
            'created_at': datetime.now().isoformat()
        }
        users.append(user)
        _save_users(users)
        return user, None
