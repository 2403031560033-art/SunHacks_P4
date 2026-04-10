from flask import Blueprint, request, jsonify, current_app, g
import os
import uuid
import json
from datetime import datetime

from services.ingestion import IngestionService
from services.decision_extractor import DecisionExtractor
from services.graph_store import GraphStore
from services.auth import require_auth


upload_bp = Blueprint('upload', __name__)

from database import get_db

def _get_coll():
    return get_db()['documents']

def _load_docs():
    # Helper to return list without _id
    docs = list(_get_coll().find())
    for d in docs:
        if '_id' in d:
            del d['_id']
    return docs

def _insert_doc(doc_meta):
    _get_coll().insert_one(doc_meta.copy())


@upload_bp.route('/upload', methods=['POST'])
@require_auth
def upload_file():
    """Upload and process a file. Scoped to the authenticated user."""
    user_id = g.current_user['id']

    if 'file' not in request.files:
        return jsonify({"error": "No file provided. Send a file with key 'file'."}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Save file to uploads directory (user-scoped subfolder)
    upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], user_id)
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, file.filename)
    file.save(filepath)

    doc_id = str(uuid.uuid4())[:8]

    try:
        import chromadb
        chroma_path = os.path.join(os.path.dirname(__file__), '..', 'chroma_data')
        client = chromadb.PersistentClient(path=chroma_path)
        # Use per-user collection so data is isolated
        collection_name = f"org_memory_{user_id.replace('-', '')[:20]}"
        collection = client.get_or_create_collection(collection_name)

        ingestion = IngestionService(collection)
        extractor = DecisionExtractor()
        graph = GraphStore(user_id=user_id)

        # 1. Parse
        parsed = ingestion.parse_file(filepath, file.filename)

        # 2. Chunk
        chunks = ingestion.chunk_text(parsed["text"])

        # 3. Store embeddings
        ingestion.store_chunks(chunks, doc_id, file.filename, parsed["type"])

        # 4. Extract decisions
        decisions = extractor.extract_from_text(parsed["text"], file.filename)

        # 5. Tag each decision with user_id and store in user-scoped graph
        for decision in decisions:
            decision['user_id'] = user_id
            graph.add_decision_node(decision)

        # 6. Save document metadata (tagged with user_id)
        doc_meta = {
            "id": doc_id,
            "user_id": user_id,
            "filename": file.filename,
            "file_type": parsed["type"],
            "upload_time": datetime.now().isoformat(),
            "chunk_count": len(chunks),
            "decision_count": len(decisions),
            "status": "processed",
            "metadata": parsed.get("metadata", {})
        }

        _insert_doc(doc_meta)

        return jsonify({
            "message": f"File '{file.filename}' processed successfully",
            "document": doc_meta,
            "decisions_found": len(decisions),
            "chunks_created": len(chunks),
            "decisions": decisions
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500


@upload_bp.route('/documents', methods=['GET'])
@require_auth
def get_documents():
    """List documents belonging to the authenticated user."""
    user_id = g.current_user['id']
    all_docs = _load_docs()
    user_docs = [d for d in all_docs if d.get('user_id') == user_id]
    return jsonify({"documents": user_docs})


@upload_bp.route('/documents/<doc_id>', methods=['DELETE'])
@require_auth
def delete_document(doc_id):
    """Delete a document owned by the authenticated user."""
    user_id = g.current_user['id']
    _get_coll().delete_one({"id": doc_id, "user_id": user_id})
    return jsonify({"message": "Document deleted", "id": doc_id})
