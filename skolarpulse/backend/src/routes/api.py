from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from src.models.database import get_db, User, Paper, Conversation, Message
from src.models.schemas import (
    UserCreate, UserLogin, User, Token, PaperCreate, Paper,
    ChatRequest, ChatResponse, SourceCitation, IngestRequest, IngestResponse,
    UniversityStats, HealthResponse
)
from src.services.auth_service import (
    create_access_token, authenticate_user, create_user,
    get_user_by_id, decode_token
)
from src.services.ingestion_service import ingestion_service
from src.services.retrieval_service import retrieval_service
from src.services.generation_service import generation_service
from src.services.chroma_service import vector_store
from src.services.embedding_service import embedding_service
from src.core.config import get_settings
from datetime import timedelta
import uuid

settings = get_settings()
router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    token_data = decode_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = get_user_by_id(token_data.user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/auth/register", response_model=User)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = create_user(user_data)
    return user


@router.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=timedelta(minutes=settings.jwt_expire_minutes)
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/auth/me", response_model=User)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/papers/ingest", response_model=IngestResponse)
def ingest_paper(request: IngestRequest, current_user: User = Depends(get_current_user)):
    from src.models.schemas import PaperCreate
    paper_data = PaperCreate(
        title=request.title or "Untitled",
        authors=request.authors or [],
        university=request.university or "Unknown",
        year=request.year or 2024,
    )
    result = ingestion_service.ingest_paper(request.file_path, paper_data)
    return result


@router.get("/papers", response_model=List[Paper])
def list_papers(
    university: Optional[str] = None,
    year: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Paper)
    if university:
        query = query.filter(Paper.university == university)
    if year:
        query = query.filter(Paper.year == year)
    papers = query.order_by(Paper.created_at.desc()).offset(offset).limit(limit).all()
    return papers


@router.get("/papers/{paper_id}", response_model=Paper)
def get_paper(paper_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


@router.delete("/papers/{paper_id}")
def delete_paper(paper_id: int, current_user: User = Depends(get_current_user)):
    success = ingestion_service.delete_paper(paper_id)
    if not success:
        raise HTTPException(status_code=404, detail="Paper not found")
    return {"message": "Paper deleted"}


@router.get("/universities", response_model=List[UniversityStats])
def get_universities(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stats = []
    universities = db.query(Paper.university).distinct().all()
    for (univ,) in universities:
        paper_count = db.query(Paper).filter(Paper.university == univ).count()
        chunk_count = sum(p.chunk_count for p in db.query(Paper).filter(Paper.university == univ).all())
        stats.append(UniversityStats(university=univ, paper_count=paper_count, chunk_count=chunk_count))
    return stats


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, current_user: User = Depends(get_current_user)):
    conversation_id = request.conversation_id or str(uuid.uuid4())

    sources = retrieval_service.retrieve(
        query=request.message,
        top_k=request.top_k,
        university_filter=request.university_filter
    )

    answer = generation_service.generate_answer(request.message, sources)

    db = next(get_db())
    try:
        conv = None
        if request.conversation_id:
            conv = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
        if not conv:
            conv = Conversation(user_id=current_user.id, title=request.message[:50])
            db.add(conv)
            db.flush()

        user_msg = Message(conversation_id=conv.id, role="user", content=request.message)
        assistant_msg = Message(
            conversation_id=conv.id,
            role="assistant",
            content=answer,
            sources=[s.model_dump() for s in sources]
        )
        db.add_all([user_msg, assistant_msg])
        db.commit()
    finally:
        db.close()

    return ChatResponse(
        answer=answer,
        sources=sources,
        conversation_id=str(conv.id)
    )


@router.get("/chat/history")
def get_chat_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "message_count": len(c.messages)
        }
        for c in conversations
    ]


@router.get("/chat/{conversation_id}")
def get_conversation(conversation_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {
        "id": conv.id,
        "title": conv.title,
        "messages": [
            {"role": m.role, "content": m.content, "sources": m.sources, "created_at": m.created_at}
            for m in conv.messages
        ]
    }


@router.delete("/chat/{conversation_id}")
def delete_conversation(conversation_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted"}


@router.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        chroma_connected=vector_store.health_check(),
        anthropic_configured=bool(settings.anthropic_api_key and settings.anthropic_api_key != "your_anthropic_key_here"),
        voyage_configured=bool(settings.voyage_api_key and settings.voyage_api_key != "your_voyage_key_here")
    )