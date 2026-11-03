import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { papersApi, universitiesApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Search, Filter, Building2, Calendar, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { Paper, UniversityStats } from '../types';

export default function PapersPage() {
  const { user } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [universities, setUniversities] = useState<UniversityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 20, offset: (page - 1) * 20 };
      if (selectedUniversity) params.university = selectedUniversity;
      if (selectedYear) params.year = parseInt(selectedYear);
      const response = await papersApi.list(params);
      setPapers(page === 1 ? response.data : [...papers, ...response.data]);
      setHasMore(response.data.length === 20);
    } catch (err) {
      console.error('Failed to fetch papers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const response = await universitiesApi.list();
      setUniversities(response.data);
    } catch (err) {
      console.error('Failed to fetch universities:', err);
    }
  };

  useEffect(() => {
    fetchPapers();
    fetchUniversities();
  }, [selectedUniversity, selectedYear, page]);

  const filteredPapers = papers.filter((paper) =>
    paper.title.toLowerCase().includes(search.toLowerCase()) ||
    paper.authors.some((a) => a.toLowerCase().includes(search.toLowerCase()))
  );

  const years = [...new Set(papers.map((p) => p.year))].sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Research Papers</h1>
          <p className="text-gray-500 mt-1">Browse and explore indexed academic papers</p>
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search papers by title, author..."
                  className="input pl-10"
                />
              </div>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="btn-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {filterOpen && (
              <div className="mt-4 flex flex-wrap gap-4 animate-slide-in">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                  <select
                    value={selectedUniversity}
                    onChange={(e) => { setSelectedUniversity(e.target.value); setPage(1); }}
                    className="input appearance-none bg-white"
                  >
                    <option value="">All Universities</option>
                    {universities.map((u) => (
                      <option key={u.university} value={u.university}>
                        {u.university} ({u.paper_count})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
                    className="input appearance-none bg-white"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {loading && page === 1 ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Loading papers...</p>
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No papers found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                {filteredPapers.map((paper) => (
                  <Link
                    key={paper.id}
                    to={`/papers/${paper.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                            {paper.university}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            {paper.year}
                          </span>
                          <span className="text-xs text-gray-500">{paper.chunk_count} chunks</span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{paper.title}</h3>
                        <p className="text-sm text-gray-500 flex flex-wrap gap-1">
                          {paper.authors.slice(0, 3).map((a, i) => (
                            <span key={i}>{a}{i < 2 && ', '}</span>
                          ))}
                          {paper.authors.length > 3 && <span>et al.</span>}
                        </p>
                        {paper.abstract && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{paper.abstract}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <FileText className="w-5 h-5" />
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </div>
                  </Link>
                ))}

                {hasMore && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loading}
                    className="w-full py-4 text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      <>
                        Load more papers
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}