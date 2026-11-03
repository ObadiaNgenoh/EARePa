import json
import os
import uuid
import pickle
from typing import List, Dict, Any, Optional
from pathlib import Path
import numpy as np
from src.core.config import get_settings

settings = get_settings()

DATA_DIR = Path("/app/data")
VECTOR_STORE_FILE = DATA_DIR / "vector_store.pkl"
METADATA_FILE = DATA_DIR / "metadata.json"


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Compute cosine similarity between vectors."""
    # Normalize vectors
    a_norm = a / (np.linalg.norm(a, axis=1, keepdims=True) + 1e-10)
    b_norm = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-10)
    return np.dot(a_norm, b_norm.T)


class VectorStore:
    def __init__(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.embeddings: List[List[float]] = []
        self.documents: List[str] = []
        self.metadatas: List[Dict[str, Any]] = []
        self.ids: List[str] = []
        self._load()

    def _load(self):
        if VECTOR_STORE_FILE.exists() and METADATA_FILE.exists():
            try:
                with open(VECTOR_STORE_FILE, "rb") as f:
                    self.embeddings = pickle.load(f)
                with open(METADATA_FILE, "r") as f:
                    data = json.load(f)
                    self.documents = data["documents"]
                    self.metadatas = data["metadatas"]
                    self.ids = data["ids"]
            except Exception:
                self.embeddings = []
                self.documents = []
                self.metadatas = []
                self.ids = []

    def _save(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(VECTOR_STORE_FILE, "wb") as f:
            pickle.dump(self.embeddings, f)
        with open(METADATA_FILE, "w") as f:
            json.dump({
                "documents": self.documents,
                "metadatas": self.metadatas,
                "ids": self.ids
            }, f)

    def add_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """Add chunks to vector store. Returns list of embedding IDs."""
        ids = [str(uuid.uuid4()) for _ in chunks]
        documents = [chunk["content"] for chunk in chunks]
        metadatas = [
            {
                "paper_id": chunk["paper_id"],
                "chunk_index": chunk["chunk_index"],
                "page_number": chunk.get("page_number"),
                "section": chunk.get("section", ""),
                "university": chunk.get("university", ""),
            }
            for chunk in chunks
        ]
        self.ids.extend(ids)
        self.documents.extend(documents)
        self.metadatas.extend(metadatas)
        # Embeddings will be added separately via add_embeddings
        self._save()
        return ids

    def add_embeddings(self, embeddings: List[List[float]]):
        """Add embeddings for the most recently added chunks."""
        self.embeddings.extend(embeddings)
        self._save()

    def query(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        university_filter: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Query vector store for similar chunks."""
        if not self.embeddings:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]], "ids": [[]]}

        query_vec = np.array(query_embedding).reshape(1, -1)
        embeddings_matrix = np.array(self.embeddings)

        similarities = cosine_similarity(query_vec, embeddings_matrix)[0]

        # Apply university filter
        valid_indices = list(range(len(self.embeddings)))
        if university_filter:
            valid_indices = [
                i for i in valid_indices
                if self.metadatas[i].get("university") in university_filter
            ]

        if not valid_indices:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]], "ids": [[]]}

        filtered_similarities = similarities[valid_indices]
        top_indices = np.argsort(filtered_similarities)[-top_k:][::-1]
        top_indices = [valid_indices[i] for i in top_indices]

        return {
            "documents": [[self.documents[i] for i in top_indices]],
            "metadatas": [[self.metadatas[i] for i in top_indices]],
            "distances": [[1 - similarities[i] for i in top_indices]],
            "ids": [[self.ids[i] for i in top_indices]]
        }

    def delete_paper_chunks(self, paper_id: int) -> None:
        """Delete all chunks for a paper."""
        indices_to_keep = [
            i for i, meta in enumerate(self.metadatas)
            if meta.get("paper_id") != paper_id
        ]
        self.embeddings = [self.embeddings[i] for i in indices_to_keep]
        self.documents = [self.documents[i] for i in indices_to_keep]
        self.metadatas = [self.metadatas[i] for i in indices_to_keep]
        self.ids = [self.ids[i] for i in indices_to_keep]
        self._save()

    def get_collection_stats(self) -> Dict[str, Any]:
        count = len(self.embeddings)
        return {"total_chunks": count}

    def health_check(self) -> bool:
        return True


vector_store = VectorStore()