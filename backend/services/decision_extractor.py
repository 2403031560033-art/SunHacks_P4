import re
import uuid
from datetime import datetime


# --- Pattern Libraries ---

DECISION_PATTERNS = [
    r"(?:we|the team|everyone|group|committee)\s+(?:have\s+|has\s+)?(?:decided|agreed|chose|chosen|selected|approved|finalized|committed)\s+(?:to\s+|on\s+|that\s+)?(.+?)(?:\.\s|\.$|$)",
    r"(?:decision|conclusion|verdict|outcome)\s*[:\-]\s*(.+?)(?:\.\s|\.$|$)",
    r"(?:going|moving|proceed(?:ing)?)\s+(?:forward\s+)?with\s+(.+?)(?:\.\s|\.$|$)",
    r"(?:let's|lets|let us)\s+(?:go\s+with|use|pick|choose|select)\s+(.+?)(?:\.\s|\.$|$)",
    r"(?:we'll|we will|we're going to|we are going to)\s+(?:use|go with|select|choose|pick|adopt|implement|migrate to)\s+(.+?)(?:\.\s|\.$|$)",
    r"(?:final\s+choice|final\s+decision|chosen\s+option|selected\s+option)\s*[:\-]\s*(.+?)(?:\.\s|\.$|$)",
    r"(?:we\s+)?(?:approved|endorsed|ratified|confirmed)\s+(.+?)(?:\.\s|\.$|$)",
    r"(?:this was chosen|was selected|was picked)\s+(.+?)(?:\.\s|\.$|$)",
]

ALTERNATIVE_PATTERNS = [
    r"(?:instead of|over)\s+(.+?)(?:\.\s|,\s|\.$|$)",
    r"(?:rather than)\s+(.+?)(?:\.\s|,\s|\.$|$)",
    r"(?:vs\.?|versus|compared to)\s+(.+?)(?:\.\s|,\s|\.$|$)",
    r"(?:other options?|alternatives?)\s+(?:were|included|considered|:\s*)(.+?)(?:\.\s|\.$|$)",
    r"(?:rejected|not chosen|ruled out)[:\s]+(.+?)(?:\.\s|,\s|\.$|$)",
    r"(?:evaluated|considered|looked at)\s+(.+?)(?:\s+but|\.\s|,\s|\.$|$)",
    r"(?:staying with|keeping)\s+(.+?)(?::\s*rejected|:\s*ruled out)",
]

REASONING_PATTERNS = [
    r"(?:because|since)\s+(.+?)(?:\.\s|\.$|$)",
    r"(?:due to|owing to)\s+(.+?)(?:\.\s|\.$|$)",
    r"(?:reason(?:s)?(?:\s+(?:is|are|being|include))?)\s*[:\-]\s*(.+?)(?:\.\s|\.$|$)",
    r"(?:advantage|benefit|pro)s?\s*[:\-]\s*(.+?)(?:\.\s|\.$|$)",
    r"(?:key (?:factor|reason|driver))s?\s*[:\-]\s*(.+?)(?:\.\s|\.$|$)",
    r"(?:it (?:offers?|provides?|has|gives?|enables?))\s+(.+?)(?:\.\s|\.$|$)",
    r"(?:better|superior|stronger|more (?:reliable|scalable|mature|flexible|cost-effective)|cheaper|faster)\s+(.+?)(?:\.\s|\.$|$)",
    r"(?:cost[- ](?:effective|saving|reduction))\w*\s*[:\-]?\s*(.+?)(?:\.\s|\.$|$)",
]

PERSON_PATTERNS = [
    r"\[([A-Za-z][A-Za-z0-9_.\s]{1,25})\]",          # [username] from Slack
    r"From:\s*([A-Za-z\s.]+?)(?:\s*<|@|\n|$)",         # Email From header
    r"@([A-Za-z][A-Za-z0-9_]{1,20})",                   # @mentions
    r"Attendees?:\s*(.+?)(?:\n|$)",                      # Meeting attendees
    r"participants?\s*(?:in this decision)?[:\s]+(.+?)(?:\.\s|\.$|$)",  # explicit participants
]


class DecisionExtractor:
    """Extracts structured decision data from text using pattern matching."""

    def extract_from_text(self, text, source_filename=""):
        """Extract all decisions from a text document."""
        decisions = []
        # Split into paragraphs/sections for context
        paragraphs = re.split(r'\n\s*\n|\n(?=[A-Z])', text)

        for para_idx, paragraph in enumerate(paragraphs):
            sentences = re.split(r'(?<=[.!?])\s+', paragraph)

            for i, sentence in enumerate(sentences):
                for pattern in DECISION_PATTERNS:
                    matches = re.finditer(pattern, sentence, re.IGNORECASE)
                    for match in matches:
                        decision_text = match.group(1).strip()

                        # Filter too-short or noise decisions
                        if len(decision_text) < 10:
                            continue
                        if decision_text.lower() in ['the', 'a', 'an', 'this', 'that']:
                            continue

                        # Get context window (surrounding sentences)
                        context_start = max(0, i - 3)
                        context_end = min(len(sentences), i + 4)
                        context = " ".join(sentences[context_start:context_end])

                        # Also include surrounding paragraphs
                        para_context_start = max(0, para_idx - 1)
                        para_context_end = min(len(paragraphs), para_idx + 2)
                        wide_context = " ".join(paragraphs[para_context_start:para_context_end])

                        # Extract components
                        alternatives = self._extract_alternatives(wide_context)
                        reasoning = self._extract_reasoning(wide_context)
                        participants = self._extract_participants(text)
                        confidence = self._calculate_confidence(
                            decision_text, alternatives, reasoning, context
                        )

                        decision = {
                            "id": str(uuid.uuid4())[:8],
                            "decision": self._clean_text(decision_text),
                            "alternatives": alternatives,
                            "reasoning": reasoning,
                            "participants": participants,
                            "timestamp": datetime.now().isoformat(),
                            "confidence_score": confidence,
                            "source_document": source_filename,
                            "source_chunk": context[:300]
                        }

                        # Avoid near-duplicates
                        if not self._is_duplicate(decision, decisions):
                            decisions.append(decision)

        return decisions

    def _extract_alternatives(self, text):
        """Extract alternatives that were considered/rejected."""
        alternatives = []
        for pattern in ALTERNATIVE_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                alt = match.group(1).strip()
                alt = self._clean_text(alt)
                if alt and len(alt) > 3 and len(alt) < 120 and alt not in alternatives:
                    alternatives.append(alt)
        return alternatives[:6]

    def _extract_reasoning(self, text):
        """Extract reasoning/justification for decisions."""
        reasons = []
        for pattern in REASONING_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                reason = match.group(1).strip()
                reason = self._clean_text(reason)
                if reason and len(reason) > 5 and len(reason) < 200 and reason not in reasons:
                    reasons.append(reason)
        return reasons[:6]

    def _extract_participants(self, text):
        """Extract participant names from the text."""
        participants = set()
        for pattern in PERSON_PATTERNS:
            matches = re.finditer(pattern, text)
            for match in matches:
                raw = match.group(1).strip()
                # Handle comma-separated attendee lists
                if ',' in raw:
                    names = [n.strip() for n in raw.split(',')]
                    for name in names:
                        # Remove titles/roles in parentheses
                        name = re.sub(r'\s*\(.*?\)', '', name).strip()
                        if name and 2 < len(name) < 35:
                            participants.add(name)
                else:
                    raw = re.sub(r'\s*\(.*?\)', '', raw).strip()
                    if raw and 2 < len(raw) < 35:
                        participants.add(raw)
        return list(participants)[:12]

    def _calculate_confidence(self, decision, alternatives, reasoning, context):
        """Calculate confidence score based on evidence quality."""
        score = 0.3  # Base score

        # Decision text quality
        if len(decision) > 20:
            score += 0.05
        if len(decision) > 50:
            score += 0.05

        # Evidence quality
        if alternatives:
            score += 0.1
        if len(alternatives) > 1:
            score += 0.05
        if reasoning:
            score += 0.15
        if len(reasoning) > 1:
            score += 0.1

        # Strong consensus words
        strong_words = [
            'unanimously', 'clearly', 'definitely', 'confirmed',
            'final', 'consensus', 'agreed', 'all', 'team'
        ]
        if any(w in decision.lower() or w in context.lower() for w in strong_words):
            score += 0.1

        # Quantitative evidence
        if re.search(r'\d+%|\$\d+|cost|budget|performance|benchmark', context, re.IGNORECASE):
            score += 0.1

        return min(round(score, 2), 0.98)

    def _clean_text(self, text):
        """Clean extracted text."""
        text = re.sub(r'\s+', ' ', text).strip()
        text = text.strip('.,;:!?')
        return text

    def _is_duplicate(self, new_decision, existing_decisions):
        """Check if a decision is too similar to existing ones."""
        new_text = new_decision["decision"].lower()
        for existing in existing_decisions:
            existing_text = existing["decision"].lower()
            # Simple overlap check
            new_words = set(new_text.split())
            existing_words = set(existing_text.split())
            if len(new_words & existing_words) > 0.6 * max(len(new_words), len(existing_words)):
                return True
        return False
