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

        from database import get_db
        docs_cursor = get_db()['documents'].find({"user_id": user_id})
        docs = list(docs_cursor)

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

@query_bp.route('/scan-contradictions', methods=['GET'])
@require_auth
def scan_contradictions():
    """AI Hypocrisy Detector: Scans the graph for contradictory decisions."""
    user_id = g.current_user['id']
    try:
        graph = GraphStore(user_id=user_id)
        nodes = graph.get_all_nodes()
        decisions = [n.get("data", {}) for n in nodes if n["type"] == "decision" and n.get("data")]

        contradictions = []
        
        # O(N^2) comparison of decisions for contradictions
        for i, d1 in enumerate(decisions):
            d1_id = d1.get("id")
            d1_text = d1.get("decision", "").lower()
            if not d1_text: continue

            for j, d2 in enumerate(decisions):
                if i == j or not d2.get("decision"): continue
                
                # Check 1: If Decision B's rejected alternatives include Decision A
                d2_alternatives = [alt.lower() for alt in d2.get("alternatives", [])]
                
                for alt in d2_alternatives:
                    # Very simple intersection check: if A's decision is highly similar to B's rejected alternative
                    # Using a basic keyword overlap heuristic
                    d1_words = set([w for w in d1_text.split() if len(w) > 3])
                    alt_words = set([w for w in alt.split() if len(w) > 3])
                    
                    if len(d1_words) > 0 and len(alt_words) > 0:
                        overlap = len(d1_words.intersection(alt_words))
                        # If significant overlap
                        if overlap >= min(len(d1_words), len(alt_words), 2):
                            # Ensure we don't duplicate
                            conflict_id = tuple(sorted([str(d1_id), str(d2.get("id"))]))
                            
                            # Filter pre-existing to avoid A->B and B->A dupes
                            if not any(c.get("_conflict_id") == conflict_id for c in contradictions):
                                contradictions.append({
                                    "_conflict_id": conflict_id,
                                    "conflict_topic": alt.title(),
                                    "decision_a": {
                                        "text": d1.get("decision"),
                                        "source": d1.get("source_document", "Unknown")
                                    },
                                    "decision_b": {
                                        "text": d2.get("decision"),
                                        "source": d2.get("source_document", "Unknown")
                                    }
                                })

        # Strip internal ids before sending
        for c in contradictions:
            c.pop("_conflict_id", None)

        return jsonify({"contradictions": contradictions})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "contradictions": []}), 500
