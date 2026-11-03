[Earlier content for /workspace/skolarpulse/README.md (2838 chars, already written to disk). The module surface below may not show every signature you need — re-read with read_file before editing this file again, OR before importing/calling anything from it in another file. Do not recreate it from scratch and do not guess a function's parameters from memory.
Module surface:
# SkolarPulse
## Features
## Tech Stack
## Project Structure
## Getting Started
### Prerequisites
### 1. Clone the Repository
### 2. Configure Environment
### 3. Start with Docker
### 4. Manual Setup
#### Backend
#### Frontend
## API Endpoints
## Usage
### 1. Register an Account
### 2. Ingest Research Papers
### 3. Ask Questions
## How It Works
1. **Ingestion**: PDFs are parsed, chunked, embedded with Voyage AI, and stored in ChromaDB
2. **Retrieval**: User queries are embedded and matched against paper chunks via vector similarity
3. **Generation**: Claude synthesizes an answer grounded in the retrieved sources, with inline citations
4. **Citations**: Each answer includes source references with university, author, and page info]