import re


class QueryEngine:
    """Handles natural-language queries with semantic search and explainable answers."""

    def __init__(self, chroma_collection, graph_store):
        self.collection = chroma_collection
        self.graph_store = graph_store

    def query(self, query_text, n_results=5):
        """Process a query and return an explainable answer."""
        # 1. Semantic search in ChromaDB
        chunks, metadatas, distances = self._search_vectors(query_text, n_results)

        # 2. Search decisions in graph store
        related_decisions = self.graph_store.search_decisions(query_text)

        # 3. Build sources
        sources = []
        for i in range(len(chunks)):
            chunk = chunks[i]
            meta = metadatas[i] if i < len(metadatas) else {}
            dist = distances[i] if i < len(distances) else 1.0
            sources.append({
                "content": chunk[:400],
                "document": meta.get("filename", "Unknown"),
                "relevance": round(max(0, 1 - dist), 3),
                "chunk_index": meta.get("chunk_index", 0)
            })

        # 4. Generate answer
        answer = self._generate_answer(query_text, chunks, related_decisions)
        reasoning = self._generate_reasoning(query_text, chunks, related_decisions)
        confidence = self._calculate_confidence(chunks, distances, related_decisions)

        # Clean up internal fields from decisions
        clean_decisions = []
        for d in related_decisions[:3]:
            clean = {k: v for k, v in d.items() if not k.startswith('_')}
            clean_decisions.append(clean)

        return {
            "answer": answer,
            "reasoning": reasoning,
            "sources": sources,
            "related_decisions": clean_decisions,
            "confidence": confidence
        }

    def _search_vectors(self, query_text, n_results):
        """Search ChromaDB for relevant chunks."""
        try:
            count = self.collection.count()
            if count == 0:
                return [], [], []
            actual_n = min(n_results, count)
            results = self.collection.query(
                query_texts=[query_text],
                n_results=actual_n
            )
            chunks = results.get("documents", [[]])[0]
            metadatas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0]
            return chunks, metadatas, distances
        except Exception as e:
            print(f"ChromaDB search error: {e}")
            return [], [], []

    def _generate_answer(self, query, chunks, decisions):
        """Generate a contextual answer from retrieved data."""
        if not chunks and not decisions:
            return (
                "I don't have enough information in the organizational memory to answer "
                "this question yet. Please upload documents (Slack conversations, emails, "
                "meeting notes) to build the knowledge base, then try again."
            )

        parts = []

        # If we found matching decisions, lead with them
        if decisions:
            primary = decisions[0]
            decision_text = primary.get('decision', '')

            # Build a natural-sounding answer
            parts.append(f"Based on the organizational records, **{decision_text}**.")

            if primary.get('reasoning'):
                reasoning_summary = "; ".join(primary['reasoning'][:3])
                parts.append(f"The key reasoning behind this decision: {reasoning_summary}.")

            if primary.get('alternatives'):
                alts = ", ".join(primary['alternatives'][:3])
                parts.append(f"Alternatives that were considered include: {alts}.")

            if primary.get('participants'):
                people = ", ".join(primary['participants'][:4])
                parts.append(f"Key participants in this decision: {people}.")

            conf = primary.get('confidence_score', 0)
            if conf > 0.7:
                parts.append("This decision appears to have strong consensus and supporting evidence.")
            elif conf > 0.4:
                parts.append("This decision has moderate supporting evidence in the records.")

        # If we only have chunks (no decisions), summarize from context
        elif chunks:
            parts.append("Based on the available organizational documents, here is what I found:")
            # Use the most relevant chunks
            for chunk in chunks[:2]:
                # Extract the most relevant sentence
                sentences = re.split(r'(?<=[.!?])\s+', chunk)
                query_words = set(query.lower().split())
                best_sentence = max(
                    sentences,
                    key=lambda s: sum(1 for w in query_words if w in s.lower()),
                    default=chunk[:200]
                )
                parts.append(f'> "{best_sentence.strip()[:200]}"')

        # Add additional context if both exist
        if decisions and chunks:
            parts.append("\nAdditional context from the documents supports this decision.")

        return "\n\n".join(parts)

    def _generate_reasoning(self, query, chunks, decisions):
        """Generate reasoning bullets explaining the answer."""
        reasoning = []

        if decisions:
            for d in decisions[:2]:
                for r in d.get('reasoning', []):
                    reasoning.append(f"📋 {r}")
                if d.get('confidence_score'):
                    score = d['confidence_score']
                    label = "High" if score > 0.7 else "Medium" if score > 0.4 else "Low"
                    reasoning.append(f"🎯 Decision confidence: {label} ({score})")
                if d.get('alternatives'):
                    alts = ", ".join(d['alternatives'][:3])
                    reasoning.append(f"🔄 Alternatives considered: {alts}")
                if d.get('source_document'):
                    reasoning.append(f"📎 Source: {d['source_document']}")

        if chunks:
            reasoning.append(f"📄 Found {len(chunks)} relevant document segment(s)")
            for i, chunk in enumerate(chunks[:2]):
                # Extract key sentence
                sentences = chunk.split('.')
                key = sentences[0].strip()[:120]
                if key:
                    reasoning.append(f"💡 Key context: \"{key}...\"")

        if not reasoning:
            reasoning.append("⚠️ Limited information available. Upload more documents to improve answers.")

        return reasoning

    def _calculate_confidence(self, chunks, distances, decisions):
        """Calculate overall answer confidence."""
        if not chunks and not decisions:
            return 0.1

        score = 0.2

        if chunks and distances:
            # Average relevance of top results
            top_distances = distances[:3]
            avg_relevance = sum(max(0, 1 - d) for d in top_distances) / len(top_distances)
            score += avg_relevance * 0.4

        if decisions:
            score += 0.2
            # Boost if decisions have high confidence
            avg_decision_conf = sum(d.get('confidence_score', 0) for d in decisions[:3]) / min(len(decisions), 3)
            score += avg_decision_conf * 0.2

        return min(round(score, 2), 0.98)
