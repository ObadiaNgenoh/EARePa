import pypdf
import tiktoken
from typing import List, Dict, Any, Optional
from src.services.chroma_service import vector_store
from src.services.embedding_service import embedding_service
from src.models.database import SessionLocal, Paper, Chunk
from src.models.schemas import PaperCreate
from datetime import datetime
import re


class IngestionService:
    def __init__(self):
        self.encoder = tiktoken.get_encoding("cl100k_base")
        self.chunk_size = 1000  # tokens
        self.chunk_overlap = 200  # tokens

    def extract_text_from_pdf(self, file_path: str) -> List[Dict[str, Any]]:
        """Extract text from PDF with page numbers."""
        pages = []
        with open(file_path, "rb") as f:
            reader = pypdf.PdfReader(f)
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text.strip():
                    pages.append({
                        "page_number": i + 1,
                        "text": text
                    })
        return pages

    def extract_metadata_from_pdf(self, file_path: str) -> Dict[str, Any]:
        """Extract metadata from PDF."""
        with open(file_path, "rb") as f:
            reader = pypdf.PdfReader(f)
            meta = reader.metadata or {}
            return {
                "title": meta.get("/Title", ""),
                "author": meta.get("/Author", ""),
                "subject": meta.get("/Subject", ""),
                "creator": meta.get("/Creator", ""),
                "producer": meta.get("/Producer", ""),
            }

    def chunk_text(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Split text into overlapping chunks."""
        chunks = []
        chunk_index = 0

        for page in pages:
            text = page["text"]
            page_num = page["page_number"]

            tokens = self.encoder.encode(text)
            if len(tokens) <= self.chunk_size:
                chunks.append({
                    "content": text,
                    "chunk_index": chunk_index,
                    "page_number": page_num,
                    "section": self._detect_section(text)
                })
                chunk_index += 1
            else:
                for i in range(0, len(tokens), self.chunk_size - self.chunk_overlap):
                    chunk_tokens = tokens[i:i + self.chunk_size]
                    chunk_text = self.encoder.decode(chunk_tokens)
                    chunks.append({
                        "content": chunk_text,
                        "chunk_index": chunk_index,
                        "page_number": page_num,
                        "section": self._detect_section(chunk_text)
                    })
                    chunk_index += 1

        return chunks

    def _detect_section(self, text: str) -> str:
        """Try to detect section header from text."""
        lines = text.split("\n")[:5]
        for line in lines:
            line = line.strip()
            if re.match(r"^\d+(\.\d+)*\s+[A-Z]", line) or \
               re.match(r"^[A-Z][A-Z\s]{3,}$", line) or \
               line.lower().startswith(("abstract", "introduction", "conclusion", "references", "method", "result", "discussion")):
                return line[:100]
        return ""

    def ingest_paper(
        self,
        file_path: str,
        paper_data: PaperCreate
    ) -> Dict[str, Any]:
        """Full ingestion pipeline for a paper."""
        db = SessionLocal()
        try:
            # Create paper record
            paper = Paper(
                title=paper_data.title,
                authors=paper_data.authors,
                university=paper_data.university,
                year=paper_data.year,
                abstract=paper_data.abstract,
                doi=paper_data.doi,
                url=paper_data.url,
                chunk_count=0
            )
            db.add(paper)
            db.flush()

            # Extract and chunk
            pages = self.extract_text_from_pdf(file_path)
            chunks = self.chunk_text(pages)

            # Prepare chunks for embedding
            chunk_records = []
            for chunk in chunks:
                chunk_records.append({
                    "paper_id": paper.id,
                    "content": chunk["content"],
                    "chunk_index": chunk["chunk_index"],
                    "page_number": chunk.get("page_number"),
                    "section": chunk.get("section", ""),
                    "university": paper_data.university,
                })

            # Generate embeddings
            texts = [c["content"] for c in chunk_records]
            embeddings = embedding_service.embed_texts(texts)

            # Add to vector store
            chroma_ids = vector_store.add_chunks(chunk_records)
            vector_store.add_embeddings(embeddings)

            # Save chunks to SQL
            for i, (chunk_record, chroma_id) in enumerate(zip(chunk_records, chroma_ids)):
                chunk = Chunk(
                    paper_id=paper.id,
                    content=chunk_record["content"],
                    chunk_index=chunk_record["chunk_index"],
                    page_number=chunk_record.get("page_number"),
                    section=chunk_record.get("section"),
                    embedding_id=chroma_id
                )
                db.add(chunk)

            paper.chunk_count = len(chunks)
            db.commit()

            return {
                "paper_id": paper.id,
                "chunks_created": len(chunks),
                "message": f"Successfully ingested '{paper.title}' with {len(chunks)} chunks"
            }

        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

    def delete_paper(self, paper_id: int) -> bool:
        """Delete a paper and its chunks."""
        db = SessionLocal()
        try:
            paper = db.query(Paper).filter(Paper.id == paper_id).first()
            if not paper:
                return False

            vector_store.delete_paper_chunks(paper_id)
            db.delete(paper)
            db.commit()
            return True
        finally:
            db.close()


ingestion_service = IngestionService()