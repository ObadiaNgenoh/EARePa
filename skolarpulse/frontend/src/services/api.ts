import axios from 'axios';
import type {
  User, Paper, ChatRequest, ChatResponse, Conversation,
  UniversityStats, HealthResponse, SourceCitation
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; token_type: string }>('/auth/login', new URLSearchParams({ username: email, password })),
  register: (data: { email: string; username: string; password: string }) =>
    api.post<User>('/auth/register', data),
  me: () => api.get<User>('/auth/me'),
};

export const papersApi = {
  list: (params?: { university?: string; year?: number; limit?: number; offset?: number }) =>
    api.get<Paper[]>('/papers', { params }),
  get: (id: number) => api.get<Paper>(`/papers/${id}`),
  delete: (id: number) => api.delete(`/papers/${id}`),
  ingest: (data: { file_path: string; title?: string; authors?: string[]; university?: string; year?: number }) =>
    api.post<{ paper_id: number; chunks_created: number; message: string }>('/papers/ingest', data),
};

export const chatApi = {
  send: (data: ChatRequest) => api.post<ChatResponse>('/chat', data),
  history: () => api.get<Conversation[]>('/chat/history'),
  get: (id: number) => api.get<{ id: number; title: string; messages: ChatMessage[] }>(`/chat/${id}`),
  delete: (id: number) => api.delete(`/chat/${id}`),
};

export const universitiesApi = {
  list: () => api.get<UniversityStats[]>('/universities'),
};

export const healthApi = {
  check: () => api.get<HealthResponse>('/health'),
};

export default api;