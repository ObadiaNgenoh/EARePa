import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { chatApi } from '../services/api';
import { History, MessageSquare, ArrowLeft, Clock, Trash2 } from 'lucide-react';
import type { Conversation } from '../types';

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const data = await chatApi.getHistory();
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this conversation?')) return;
    try {
      await chatApi.deleteConversation(id);
      setConversations(conversations.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Conversation History</h1>
        <Link to="/" className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          New Chat
        </Link>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No conversations yet. Start chatting!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map(conv => (
            <Link
              key={conv.id}
              to={`/history/${conv.id}`}
              className="card p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <MessageSquare className="w-6 h-6 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900 truncate max-w-md">
                    {conv.title || 'Untitled Conversation'}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={e => { e.preventDefault(); handleDelete(conv.id); }}
                className="text-red-500 hover:text-red-700 p-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}