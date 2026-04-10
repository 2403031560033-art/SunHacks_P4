import json
import os
import uuid
from threading import Lock

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

# Per-instance lock (not singleton anymore — each (user_id) gets its own instance)
_locks = {}
_locks_meta = Lock()


def _get_lock(key):
    with _locks_meta:
        if key not in _locks:
            _locks[key] = Lock()
        return _locks[key]


class GraphStore:
    """JSON-file-based graph database scoped per user.

    Each user gets their own graph_<user_id>.json file to ensure data isolation.
    Pass user_id=None to access the legacy shared graph (backwards compat).
    """

    def __init__(self, user_id=None):
        self._user_id = user_id
        if user_id:
            safe_id = user_id.replace('-', '')[:32]
            self._graph_file = os.path.join(DATA_DIR, f'graph_{safe_id}.json')
        else:
            self._graph_file = os.path.join(DATA_DIR, 'graph.json')

        self._lock = _get_lock(self._graph_file)
        os.makedirs(DATA_DIR, exist_ok=True)
        self.data = self._load()

    def _load(self):
        if os.path.exists(self._graph_file):
            try:
                with open(self._graph_file, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass
        return {"nodes": [], "edges": []}

    def _save(self):
        with open(self._graph_file, 'w') as f:
            json.dump(self.data, f, indent=2)

    def add_decision_node(self, decision_data):
        """Add a decision and its related person/topic/alternative nodes to the graph."""
        with self._lock:
            self.data = self._load()  # Refresh to avoid stale state
            node_id = f"decision_{decision_data.get('id', str(uuid.uuid4())[:8])}"

            # Skip duplicates
            if any(n["id"] == node_id for n in self.data["nodes"]):
                return node_id

            node = {
                "id": node_id,
                "type": "decision",
                "data": decision_data
            }
            self.data["nodes"].append(node)

            # Participant nodes + edges
            for participant in decision_data.get("participants", []):
                p_id = f"person_{participant.lower().replace(' ', '_').replace('@', '')}"
                if not any(n["id"] == p_id for n in self.data["nodes"]):
                    self.data["nodes"].append({
                        "id": p_id,
                        "type": "person",
                        "data": {"name": participant}
                    })
                edge_id = f"e_{p_id}_{node_id}"
                if not any(e["id"] == edge_id for e in self.data["edges"]):
                    self.data["edges"].append({
                        "id": edge_id,
                        "source": p_id,
                        "target": node_id,
                        "type": "participated_in",
                        "label": "participated in"
                    })

            # Topic node
            decision_text = decision_data.get("decision", "")
            if decision_text:
                topic_name = self._extract_topic(decision_text)
                topic_id = f"topic_{topic_name.lower().replace(' ', '_')[:30]}"
                if not any(n["id"] == topic_id for n in self.data["nodes"]):
                    self.data["nodes"].append({
                        "id": topic_id,
                        "type": "topic",
                        "data": {"name": topic_name}
                    })
                edge_id = f"e_{node_id}_{topic_id}"
                if not any(e["id"] == edge_id for e in self.data["edges"]):
                    self.data["edges"].append({
                        "id": edge_id,
                        "source": node_id,
                        "target": topic_id,
                        "type": "about",
                        "label": "about"
                    })

            # Alternative nodes
            for alt in decision_data.get("alternatives", []):
                alt_id = f"alt_{str(uuid.uuid4())[:6]}"
                self.data["nodes"].append({
                    "id": alt_id,
                    "type": "alternative",
                    "data": {"name": alt[:60]}
                })
                self.data["edges"].append({
                    "id": f"e_{node_id}_{alt_id}",
                    "source": node_id,
                    "target": alt_id,
                    "type": "rejected_alternative",
                    "label": "rejected"
                })

            self._save()
            return node_id

    def _extract_topic(self, text):
        for prefix in ["to ", "that ", "on ", "we ", "the team "]:
            if text.lower().startswith(prefix):
                text = text[len(prefix):]
        words = text.split()[:5]
        return " ".join(words).strip(".,;:!?")

    def get_all_nodes(self):
        self.data = self._load()
        return self.data["nodes"]

    def get_all_edges(self):
        self.data = self._load()
        return self.data["edges"]

    def get_graph(self):
        self.data = self._load()
        return self.data

    def search_decisions(self, query):
        """Search decisions by keyword matching."""
        self.data = self._load()
        query_lower = query.lower()
        query_words = set(query_lower.split())
        results = []

        for node in self.data["nodes"]:
            if node["type"] == "decision":
                d = node["data"]
                text = (
                    f"{d.get('decision', '')} "
                    f"{' '.join(d.get('reasoning', []))} "
                    f"{' '.join(d.get('alternatives', []))} "
                    f"{' '.join(d.get('participants', []))}"
                )
                text_lower = text.lower()
                matching_words = sum(1 for w in query_words if w in text_lower)
                if matching_words > 0:
                    d_copy = dict(d)
                    d_copy["_relevance"] = matching_words / len(query_words)
                    results.append(d_copy)

        results.sort(key=lambda x: x.get("_relevance", 0), reverse=True)
        return results

    def clear(self):
        with self._lock:
            self.data = {"nodes": [], "edges": []}
            self._save()
