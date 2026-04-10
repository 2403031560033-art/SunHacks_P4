import os
import sys

# Patch for Render/Ubuntu outdated SQLite version causing ChromaDB failure
try:
    __import__('pysqlite3')
    sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
except ImportError:
    pass

from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ── Configuration ──────────────────────────────────────────────
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB
app.config['JWT_SECRET'] = os.environ.get('JWT_SECRET', 'orgmemory-jwt-secret-change-in-prod-2024')

# ── Ensure required directories exist ─────────────────────────
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), 'chroma_data'), exist_ok=True)

# ── Register blueprints ────────────────────────────────────────
from routes.upload import upload_bp
from routes.query import query_bp
from routes.auth import auth_bp

app.register_blueprint(upload_bp)
app.register_blueprint(query_bp)
app.register_blueprint(auth_bp)


@app.route('/health', methods=['GET'])
def health():
    return {"status": "ok", "service": "OrgMemory Reasoning Engine", "auth": "JWT"}


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("  OrgMemory — Organizational Memory & Reasoning Engine")
    print("  Backend API running at http://localhost:5000")
    print("=" * 60)
    print("\nEndpoints:")
    print("  POST /api/auth/register  — Create account")
    print("  POST /api/auth/login     — Login & get JWT token")
    print("  GET  /api/auth/me        — Get current user")
    print("  POST /upload             — Upload file (auth required)")
    print("  GET  /documents          — List documents (auth required)")
    print("  POST /query              — Query knowledge (auth required)")
    print("  GET  /decisions          — List decisions (auth required)")
    print("  GET  /graph              — Knowledge graph (auth required)")
    print("  GET  /stats              — Dashboard stats (auth required)")
    print("=" * 60 + "\n")
    app.run(debug=True, port=5000)
