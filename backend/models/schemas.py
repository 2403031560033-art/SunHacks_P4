from dataclasses import dataclass, field, asdict
from typing import List, Optional
from datetime import datetime
import uuid


@dataclass
class Decision:
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    decision: str = ""
    alternatives: List[str] = field(default_factory=list)
    reasoning: List[str] = field(default_factory=list)
    participants: List[str] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    confidence_score: float = 0.0
    source_document: str = ""
    source_chunk: str = ""

    def to_dict(self):
        return asdict(self)


@dataclass
class Document:
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    filename: str = ""
    file_type: str = ""
    upload_time: str = field(default_factory=lambda: datetime.now().isoformat())
    chunk_count: int = 0
    decision_count: int = 0
    status: str = "processed"

    def to_dict(self):
        return asdict(self)


@dataclass
class QueryResult:
    answer: str = ""
    reasoning: List[str] = field(default_factory=list)
    sources: List[dict] = field(default_factory=list)
    related_decisions: List[dict] = field(default_factory=list)
    confidence: float = 0.0

    def to_dict(self):
        return asdict(self)
