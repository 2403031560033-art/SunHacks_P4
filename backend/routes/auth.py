from flask import Blueprint, request, jsonify, g
from models.user import find_user_by_email, create_user, find_user_by_id
from services.auth import hash_password, verify_password, generate_token, require_auth
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _safe_user(user: dict) -> dict:
    """Return user dict without the password field."""
    return {k: v for k, v in user.items() if k != 'password'}


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user with name, email, and password."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    password = (data.get('password') or '').strip()

    # Validation
    errors = []
    if not name or len(name) < 2:
        errors.append('Name must be at least 2 characters')
    if not email or not re.match(r'^[\w.+-]+@[\w-]+\.[\w.]+$', email):
        errors.append('Valid email is required')
    if not password or len(password) < 6:
        errors.append('Password must be at least 6 characters')
    if errors:
        return jsonify({'error': '; '.join(errors)}), 400

    # Check duplicate
    if find_user_by_email(email):
        return jsonify({'error': 'An account with that email already exists'}), 409

    # Hash and store
    hashed = hash_password(password)
    user, err = create_user(name, email, hashed)
    if err:
        return jsonify({'error': err}), 409

    token = generate_token(user['id'])
    return jsonify({
        'message': 'Account created successfully',
        'token': token,
        'user': _safe_user(user)
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user, return JWT on success."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    email = (data.get('email') or '').strip()
    password = (data.get('password') or '').strip()

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = find_user_by_email(email)
    if not user or not verify_password(password, user['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = generate_token(user['id'])
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': _safe_user(user)
    }), 200


@auth_bp.route('/me', methods=['GET'])
@require_auth
def me():
    """Return current authenticated user's info."""
    return jsonify({'user': _safe_user(g.current_user)}), 200
