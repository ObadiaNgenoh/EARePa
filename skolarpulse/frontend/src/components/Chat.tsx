import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, Copy, Check, MessageSquare, X } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import SourcePanel from './SourcePanel';
import type { SourceCitation } from '../types';

export default function Chat() {
  const { user } = useAuth();
  const {
    messages,
    loading,
    error,
    conversationId,
    history,
    sendMessage,
    loadHistory,
    loadConversation,
    newConversation,
  } = useChat();

  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSources, setSelectedSources] = useState<SourceCitation[]>([]);
  const [showSources, setShowSources] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input;
    setInput('');
    textareaRef.current?.focus();

    await sendMessage({ message, conversation_id: conversationId || undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getLastAssistantMessage = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i];
      }
    }
    return null;
  };

  const lastAssistant = getLastAssistantMessage();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Please log in to start chatting</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">SkolarPulse</h1>
            <p className="text-xs text-gray-500">AI Research Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Chat history"
          >
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Chat History Sidebar */}
      {showHistory && (
        <div className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-100 z-20 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium">Chat History</h3>
            <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={newConversation}
            className="mx-4 mb-4 btn-secondary text-sm flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            New Chat
          </button>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No conversations yet</p>
            ) : (
              history.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    conversationId === String(conv.id)
                      ? 'bg-primary-50 border border-primary-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-sm truncate">{conv.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(conv.updated_at).toLocaleDateString()} · {conv.message_count} messages
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Welcome to SkolarPulse</h3>
            <p className="text-sm max-w-md">
              Ask me any research question and I'll find answers from indexed academic papers with proper citations.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {[
                "What are recent findings on transformer architectures?",
                "How does climate change affect crop yields?",
                "Latest research on quantum computing algorithms",
                "Impact of social media on mental health",
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(suggestion);
                    handleSubmit(new React.FormEvent('submit'));
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {message.role === 'user' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
            </div>
            <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
              <div
                className={`inline-block px-4 py-2 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                }`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown className="markdown-content text-left" />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
              {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 justify-end">
                  {message.sources.map((source, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedSources(message.sources!);
                        setShowSources(true);
                      }}
                      className="source-citation"
                    >
                      [{i + 1}] {source.authors[0]} et al., {source.university}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-gray-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Toast */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-700">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a research question..."
            rows={1}
            className="flex-1 input resize-none min-h-[44px] max-h-32"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary flex items-center justify-center h-12 px-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}