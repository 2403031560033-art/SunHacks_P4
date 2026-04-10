from flask import Blueprint, request, jsonify, g
import os
import json

from services.query_engine import QueryEngine
from services.graph_store import GraphStore
from services.auth import require_auth


query_bp = Blueprint('query', __name__)


def _get_user_collection(user_id):
    import chromadb
    chroma_path = os.path.join(os.path.dirname(__file__), '..', 'chroma_data')
    client = chromadb.PersistentClient(path=chroma_path)
    collection_name = f"org_memory_{user_id.replace('-', '')[:20]}"
    return client.get_or_create_collection(collection_name)


@query_bp.route('/query', methods=['POST'])
@require_auth
def query():
    """Process a natural language query. Returns answer scoped to the user's data."""
    user_id = g.current_user['id']
    data = request.get_json(silent=True)
    if not data or 'query' not in data:
        return jsonify({"error": "Query text is required. Send JSON with 'query' key."}), 400

    query_text = data['query']

    try:
        collection = _get_user_collection(user_id)
        graph = GraphStore(user_id=user_id)
        engine = QueryEngine(collection, graph)

        result = engine.query(query_text)
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Query failed: {str(e)}"}), 500


@query_bp.route('/decisions', methods=['GET'])
@require_auth
def get_decisions():
    """List extracted decisions belonging to the authenticated user."""
    user_id = g.current_user['id']
    try:
        graph = GraphStore(user_id=user_id)
        nodes = graph.get_all_nodes()
        decisions = [n["data"] for n in nodes if n["type"] == "decision"]
        return jsonify({"decisions": decisions})
    except Exception as e:
        return jsonify({"error": str(e), "decisions": []}), 500


@query_bp.route('/graph', methods=['GET'])
@require_auth
def get_graph():
    """Get the knowledge graph for the authenticated user."""
    user_id = g.current_user['id']
    try:
        graph = GraphStore(user_id=user_id)
        data = graph.get_graph()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e), "nodes": [], "edges": []}), 500


@query_bp.route('/stats', methods=['GET'])
@require_auth
def get_stats():
    """Get system statistics for the authenticated user."""
    user_id = g.current_user['id']
    try:
        graph = GraphStore(user_id=user_id)
        nodes = graph.get_all_nodes()

        # Load user's documents
        docs_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'documents.json')
        docs = []
        if os.path.exists(docs_file):
            with open(docs_file, 'r') as f:
                all_docs = json.load(f)
            docs = [d for d in all_docs if d.get('user_id') == user_id]

        decision_count = sum(1 for n in nodes if n["type"] == "decision")
        person_count = sum(1 for n in nodes if n["type"] == "person")
        topic_count = sum(1 for n in nodes if n["type"] == "topic")

        try:
            collection = _get_user_collection(user_id)
            chunk_count = collection.count()
        except Exception:
            chunk_count = 0

        # Blind Spot Detector Logic
        blind_spots = []
        for n in nodes:
            if n["type"] == "decision":
                d = n.get("data", {})
                risk_factors = []
                if not d.get("alternatives"):
                    risk_factors.append("No alternatives recorded")
                if not d.get("participants") or len(d.get("participants", [])) < 2:
                    risk_factors.append("Siloed decision (< 2 participants)")
                
                if risk_factors:
                    blind_spots.append({
                        "decision": d.get("decision", "Unknown Decision"),
                        "risk_factors": risk_factors,
                        "source": d.get("source_document", "Unknown")
                    })

        return jsonify({
            "documents": len(docs),
            "decisions": decision_count,
            "participants": person_count,
            "topics": topic_count,
            "chunks": chunk_count,
            "graph_nodes": len(nodes),
            "graph_edges": len(graph.get_all_edges()),
            "blind_spots": blind_spots
        })
    except Exception as e:
        return jsonify({
            "documents": 0, "decisions": 0, "participants": 0,
            "topics": 0, "chunks": 0, "graph_nodes": 0, "graph_edges": 0,
            "error": str(e)
        })
