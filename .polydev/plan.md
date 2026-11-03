# SkolarPulse - AI-Powered Research Paper Platform

## Overview
Build a platform where university research papers are indexed via AI embeddings, allowing users to ask questions and receive answers with cited sources and university attribution.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS (chat interface, paper browser)
- **Backend**: Node.js/Express API (or Python FastAPI for better ML integration)
- **Vector DB**: Pinecone, Weaviate, or local ChromaDB for embeddings
- **Embeddings**: OpenAI text-embedding-3-small or sentence-transformers
- **LLM**: OpenAI GPT-4o / Anthropic Claude for answer generation
- **Paper Ingestion**: PDF parsing, metadata extraction, university detection

## Implementation Stages

### Stage 1: Project Setup & Core Infrastructure
- Initialize React + Vite + Tailwind project
- Set up Express/FastAPI backend with TypeScript
- Configure vector database (ChromaDB for local dev, Pinecone for prod)
- Create database schema for papers, chunks, universities

### Stage 2: Paper Ingestion Pipeline
- PDF text extraction (pdf-parse, pdfjs-dist, or PyMuPDF)
- Chunking strategy (semantic/recursive with overlap)
- Embedding generation and vector storage
- University metadata extraction (from PDF metadata, affiliations, or manual mapping)
- CLI/script for batch importing papers

### Stage 3: Query & Retrieval Engine
- Query embedding generation
- Vector similarity search (top-k with metadata filtering)
- Re-ranking (cross-encoder or MMR for diversity)
- Context assembly with source tracking

### Stage 4: Answer Generation with Citations
- Prompt engineering for grounded answers
- Citation format: [Author et al., Year, University] + chunk reference
- Streaming responses for better UX
- Source panel showing relevant paper excerpts

### Stage 5: Frontend - Chat Interface
- Chat UI with message history
- Source citations inline and expandable source panel
- University filter/tags
- Paper browser/viewer

### Stage 6: Polish & Deploy
- Authentication (optional, for saved chats)
- Rate limiting, caching
- Docker-compose for local dev
- Deploy configs (Vercel + Railway/Render)

## Tech Stack Decisions Needed
1. **Backend language**: Node.js/TypeScript or Python/FastAPI?
2. **Vector DB**: Local ChromaDB (free, easy) or Pinecone (managed, scalable)?
3. **LLM Provider**: OpenAI, Anthropic, or local (Ollama)?
4. **Auth needed?**: Simple demo or user accounts?

## File Structure (planned)
```
skolarpulse/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/  # Chat, SourcePanel, PaperCard
│   │   ├── hooks/       # useChat, usePapers
│   │   ├── services/    # API client
│   │   └── App.tsx
│   └── package.json
├── backend/           # FastAPI or Express
│   ├── src/
│   │   ├── routes/      # /api/chat, /api/papers, /api/ingest
│   │   ├── services/    # embeddings, retrieval, generation
│   │   ├── models/      # Pydantic/Zod schemas
│   │   └── main.py/ts
│   └── requirements.txt / package.json
├── ingestion/         # Paper processing scripts
│   ├── parse_pdf.py
│   ├── chunk.py
│   ├── embed.py
│   └── ingest.py
├── docker-compose.yml
└── README.md
```

Let me know your preferences on the tech stack decisions above, and I'll start building.