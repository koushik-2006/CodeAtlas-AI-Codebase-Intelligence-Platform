from typing import List


class EmbeddingService:
    """Computes embeddings for semantic search (with pgvector in Phase B)."""

    async def get_embedding(self, text: str) -> List[float]:
        """Returns dummy 128-dim normalized embedding for Phase A."""
        # In Phase B, integrate OpenAI text-embedding-3-small or sentence-transformers
        import hashlib
        h = hashlib.sha256(text.encode()).digest()
        return [float(b) / 255.0 for b in h[:32]]


embedding_service = EmbeddingService()
