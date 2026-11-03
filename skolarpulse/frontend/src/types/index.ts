export interface User {
  id: number;
  email: string;
  username: string;
  role: 'user' | 'admin';
  created_at: string;
  is_active: boolean;
}

export interface Paper {
  id: number;
  title: string;
  authors: string[];
  university: string;
  year: number;
  abstract?: string;
  doi?: string;
  url?: string;
  chunk_count: number;
  created_at: string;
}

export interface SourceCitation {
  paper_id: number;
  paper_title: string;
  authors: string[];
  university: string;
  year: number;
  chunk_text: string;
  chunk_index: number;
  similarity_score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  created_at?: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  university_filter?: string[];
  top_k?: number;
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  conversation_id: string;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface UniversityStats {
  university: string;
  paper_count: number;
  chunk_count: number;
}

export interface HealthResponse {
  status: string;
  chroma_connected: boolean;
  anthropic_configured: boolean;
  voyage_configured: boolean;
}