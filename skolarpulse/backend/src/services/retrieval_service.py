from typing import List, Dict, Any, Optional
from src.services.chroma_service import vector_store
from src.services.embedding_service import embedding_service
from src.models.schemas import SourceCitation
from src.models.database import SessionLocal, Paper, Chunk


class RetrievalService:
    def __init__(self):
        pass

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        university_filter: Optional[List[str]] = None
    ) -> List[SourceCitation]:
        """Retrieve relevant chunks for a query."""
        query_embedding = embedding_service.embed_query(query)
        results = vector_store.query(
            query_embedding=query_embedding,
            top_k=top_k,
            university_filter=university_filter
        )

        citations = []
        if results["ids"] and results["ids"][0]:
            db = SessionLocal()
            try:
                for i, (doc_id, document, metadata, distance) in enumerate(zip(
                    results["ids"][0],
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0]
                )):
                    paper_id = metadata["paper_id"]
                    paper = db.query(Paper).filter(Paper.id == paper_id).first()
                    if paper:
                        similarity = 1 - distance  # Convert cosine distance to similarity
                        citations.append(SourceCitation(
                            paper_id=paper.id,
                            paper_title=paper.title,
                            authors=paper.authors,
                            university=paper.university,
                            year=paper.year,
                            chunk_text=document,
                            chunk_index=metadata["chunk_index"],
                            similarity_score=similarity
                        ))
            finally:
                db.close()

        return citations

    def get_universities(self) -> List[str]:
        """Get list of all universities in the database."""
        db = SessionLocal()
        try:
            universities = db.query(Paper.university).distinct().all()
            return [u[0] for u in universities]
        finally:
            db.close()


retrieval_service = RetrievalService()