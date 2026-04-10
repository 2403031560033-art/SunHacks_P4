import json
import os
import re


class IngestionService:
    """Handles file parsing, text chunking, and ChromaDB storage."""

    def __init__(self, chroma_collection):
        self.collection = chroma_collection

    def parse_file(self, filepath, filename):
        """Parse a file based on its extension and return structured text."""
        ext = os.path.splitext(filename)[1].lower()

        if ext == '.json':
            return self._parse_slack_json(filepath)
        elif ext == '.txt':
            content = self._read_text(filepath)
            if self._is_email(content):
                return self._parse_email(content)
            return self._parse_text(content, filename)
        elif ext == '.pdf':
            return self._parse_pdf(filepath)
        elif ext == '.md':
            return self._parse_text(self._read_text(filepath), filename)
        else:
            return self._parse_text(self._read_text(filepath), filename)

    def _read_text(self, filepath):
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()

    def _parse_slack_json(self, filepath):
        """Parse Slack JSON export format."""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        messages = []
        if isinstance(data, list):
            entries = data
        elif isinstance(data, dict):
            entries = data.get('messages', data.get('conversations', [data]))
        else:
            entries = [data]

        for msg in entries:
            if isinstance(msg, dict):
                user = msg.get('user', msg.get('sender', msg.get('from', 'Unknown')))
                text = msg.get('text', msg.get('message', msg.get('content', '')))
                ts = msg.get('timestamp', msg.get('ts', msg.get('date', '')))
                if text:
                    messages.append(f"[{user}] ({ts}): {text}")

        full_text = "\n".join(messages)
        return {
            "text": full_text,
            "type": "slack",
            "metadata": {"message_count": len(messages)}
        }

    def _is_email(self, content):
        return bool(re.search(r'^(From:|To:|Subject:|Date:)', content, re.MULTILINE))

    def _parse_email(self, content):
        """Parse email-formatted text."""
        return {
            "text": content,
            "type": "email",
            "metadata": {"format": "email"}
        }

    def _parse_text(self, content, filename):
        """Parse generic text file."""
        return {
            "text": content,
            "type": "text",
            "metadata": {"filename": filename}
        }

    def _parse_pdf(self, filepath):
        """Parse PDF file using PyPDF2."""
        try:
            import PyPDF2
            text = ""
            with open(filepath, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return {
                "text": text if text.strip() else "[Empty PDF - no extractable text found]",
                "type": "pdf",
                "metadata": {"pages": len(reader.pages)}
            }
        except ImportError:
            return {
                "text": "[PDF parsing requires PyPDF2 - install with: pip install PyPDF2]",
                "type": "pdf",
                "metadata": {}
            }
        except Exception as e:
            return {
                "text": f"[Error parsing PDF: {str(e)}]",
                "type": "pdf",
                "metadata": {}
            }

    def chunk_text(self, text, chunk_size=500, overlap=100):
        """Split text into overlapping chunks, respecting sentence boundaries."""
        if not text or not text.strip():
            return []

        if len(text) <= chunk_size:
            return [text.strip()]

        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]

            # Try to break at a sentence boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                if break_point > chunk_size * 0.3:
                    chunk = text[start:start + break_point + 1]
                    end = start + break_point + 1

            stripped = chunk.strip()
            if stripped:
                chunks.append(stripped)
            start = end - overlap

        return chunks

    def store_chunks(self, chunks, document_id, filename, file_type):
        """Store text chunks in ChromaDB with metadata."""
        if not chunks:
            return []

        ids = []
        documents = []
        metadatas = []

        for i, chunk in enumerate(chunks):
            chunk_id = f"{document_id}_chunk_{i}"
            ids.append(chunk_id)
            documents.append(chunk)
            metadatas.append({
                "document_id": document_id,
                "filename": filename,
                "file_type": file_type,
                "chunk_index": i
            })

        try:
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
        except Exception as e:
            print(f"Warning: ChromaDB storage error: {e}")
            # Try adding one by one (handles duplicate ID issues)
            for cid, doc, meta in zip(ids, documents, metadatas):
                try:
                    self.collection.add(ids=[cid], documents=[doc], metadatas=[meta])
                except Exception:
                    pass

        return ids
