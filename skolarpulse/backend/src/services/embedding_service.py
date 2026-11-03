import voyageai
from typing import List
from src.core.config import get_settings

settings = get_settings()


class EmbeddingService:
    def __init__(self):
        self.client = voyageai.Client(api_key=settings.voyage_api_key)
        self.model = "voyage-3"  # or "voyage-3-lite" for faster/cheaper

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        result = self.client.embed(texts, model=self.model, input_type="document")
        return result.embeddings

    def embed_query(self, query: str) -> List[float]:
        """Generate embedding for a query."""
        result = self.client.embed([query], model=self.model, input_type="query")
        return result.embeddings[0]

    def health_check(self) -> bool:
        try:
            self.client.embed(["test"], model=self.model)
            return True
        except Exception:
            return False


embedding_service = EmbeddingService()