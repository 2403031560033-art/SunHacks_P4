import uuid
from datetime import datetime
from database import get_db

def _get_coll():
    return get_db()['users']

def find_user_by_email(email):
    # Retrieve user from mongo and strip system _id to match previous dict format
    user = _get_coll().find_one({"email": email.lower().strip()})
    if user and '_id' in user:
        del user['_id']
    return user

def find_user_by_id(user_id):
    user = _get_coll().find_one({"id": user_id})
    if user and '_id' in user:
        del user['_id']
    return user

def create_user(name, email, hashed_password):
    email_clean = email.lower().strip()
    
    # Check uniqueness
    if _get_coll().find_one({"email": email_clean}):
        return None, 'Email already registered'

    user = {
        'id': str(uuid.uuid4()),
        'name': name.strip(),
        'email': email_clean,
        'password': hashed_password,
        'created_at': datetime.now().isoformat()
    }
    
    # Insert safely into MongoDB
    _get_coll().insert_one(user.copy())
    
    return user, None
