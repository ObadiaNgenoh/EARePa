from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: int
    role: UserRole = UserRole.USER
    created_at: datetime
    is_active: bool = True

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


class PaperBase(BaseModel):
    title: str
    authors: List[str]
    university: str
    year: int
    abstract: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None


class PaperCreate(PaperBase):
    pass


class Paper(PaperBase):
    id: int
    chunk_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class ChunkBase(BaseModel):
    paper_id: int
    content: str
    chunk_index: int
    page_number: Optional[int] = None
    section: Optional[str] = None


class Chunk(ChunkBase):
    id: int
    embedding_id: Optional[str] = None

    class Config:
        from_attributes = True


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    university_filter: Optional[List[str]] = None
    top_k: int = 5


class SourceCitation(BaseModel):
    paper_id: int
    paper_title: str
    authors: List[str]
    university: str
    year: int
    chunk_text: str
    chunk_index: int
    similarity_score: float


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
    conversation_id: str


class IngestRequest(BaseModel):
    file_path: str
    title: Optional[str] = None
    authors: Optional[List[str]] = None
    university: Optional[str] = None
    year: Optional[int] = None


class IngestResponse(BaseModel):
    paper_id: int
    chunks_created: int
    message: str


class UniversityStats(BaseModel):
    university: str
    paper_count: int
    chunk_count: int


class HealthResponse(BaseModel):
    status: str
    chroma_connected: bool
    anthropic_configured: bool
    voyage_configured: bool