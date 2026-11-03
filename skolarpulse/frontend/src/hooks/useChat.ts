import { useState, useCallback } from 'react';
import { chatApi } from '../services/api';
import type { ChatRequest, ChatResponse, Conversation, ChatMessage } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [history, setHistory] = useState<Conversation[]>([]);

  const sendMessage = useCallback(async (request: ChatRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await chatApi.send({
        ...request,
        conversation_id: request.conversation_id || conversationId || undefined,
      });
      const { answer, sources, conversation_id } = response.data;
      setConversationId(conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: request.message },
        { role: 'assistant', content: answer, sources },
      ]);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to send message';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const loadHistory = useCallback(async () => {
    try {
      const response = await chatApi.history();
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  const loadConversation = useCallback(async (id: number) => {
    try {
      const response = await chatApi.get(id);
      setMessages(response.data.messages);
      setConversationId(String(response.data.id));
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  }, []);

  const newConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    conversationId,
    history,
    sendMessage,
    loadHistory,
    loadConversation,
    newConversation,
  };
}