import React from 'react';
import { ChevronDown, ChevronUp, Copy, Check, ExternalLink, FileText, Building2, X } from 'lucide-react';
import type { SourceCitation } from '../types';

interface SourcePanelProps {
  sources: SourceCitation[];
  onClose: () => void;
}

export default function SourcePanel({ sources, onClose }: SourcePanelProps) {
  if (sources.length === 0) return null;

  const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white shadow-xl max-w-2xl w-full mx-auto mt-4 mb-4 rounded-xl border border-gray-200 overflow-hidden animate-slide-in">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-600" />
          Sources ({sources.length})
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close sources"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh] scrollbar-thin">
        {sources.map((source, index) => (
          <div
            key={`${source.paper_id}-${source.chunk_index}`}
            className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50"
          >
            <button
              onClick={() => setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))}
              className="w-full p-4 text-left flex items-start justify-between gap-4 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                    Source {index + 1}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                    {source.university}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                    {source.year}
                  </span>
                  <span className="text-xs text-gray-500">Similarity: {(source.similarity_score * 100).toFixed(1)}%</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">{source.paper_title}</h4>
                <p className="text-sm text-gray-500 flex flex-wrap gap-2">
                  {source.authors.slice(0, 3).map((a, i) => (
                    <span key={i}>{a}{i < 2 && ', '}</span>
                  ))}
                  {source.authors.length > 3 && <span>et al.</span>}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {expanded[index] ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {expanded[index] && (
              <div className="p-4 border-t border-gray-200 bg-white animate-expand">
                <div className="prose prose-sm max-w-none text-gray-700 mb-4 whitespace-pre-wrap">
                  {source.chunk_text}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(source.chunk_text)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy excerpt
                  </button>
                  {source.paper_title && (
                    <a
                      href={`https://scholar.google.com/scholar?q=${encodeURIComponent(source.paper_title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Find paper
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <p className="text-sm text-gray-500 text-center">
          Click on a source to expand and view the full excerpt. All answers are grounded in these research papers.
        </p>
      </div>
    </div>
  );
}