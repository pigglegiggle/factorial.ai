'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { Clock, CheckCircle, AlertTriangle, Tag, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface HistoryItem {
  id: number;
  input_text?: string;
  input_url?: string;
  result_json: {
    is_fake: boolean;
    confidence: number;
    explanation: string;
    tags: string[];
  };
  is_fake: boolean;
  confidence: number;
  created_at: string;
  tags: string[];
  feedback_count: number;
  forum_posts_count: number;
}

interface Statistics {
  total_checks: number;
  fake_count: number;
  real_count: number;
  avg_confidence: number;
  fake_percentage: number;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_checks: number;
  has_next: boolean;
  has_previous: boolean;
}

export default function HistoryPage() {
  const { user, token } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user && token) {
      fetchHistory();
    } else {
      setIsLoading(false);
    }
  }, [user, token, currentPage]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/user/history?page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setHistory(data.history);
        setStatistics(data.statistics);
        setPagination(data.pagination);
        setError(null);
      } else {
        setError(data.error || 'Failed to load history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getResultIcon = (isFake: boolean) => {
    return isFake ? (
      <AlertTriangle className="h-6 w-6 text-red-500" />
    ) : (
      <CheckCircle className="h-6 w-6 text-green-500" />
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const exportHistory = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Date,Input,Type,Result,Confidence,Explanation,Tags\n' +
      history.map(item => {
        const input = item.input_text || item.input_url || '';
        const type = item.input_url ? 'URL' : 'Text';
        const result = item.is_fake ? 'Fake' : 'Real';
        const explanation = item.result_json.explanation.replace(/"/g, '""');
        const tags = item.tags.join(';');
        return `"${formatDate(item.created_at)}","${input.replace(/"/g, '""')}","${type}","${result}",${item.confidence},"${explanation}","${tags}"`;
      }).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `news-check-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#111114] text-white">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-white mb-4">History</h1>
            <p className="text-zinc-400 mb-8">
              Please <Link href="/auth/login" className="text-blue-400 underline">log in</Link> to view your news check history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111114] text-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/30 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4 flex items-center space-x-3">
                <Clock className="h-10 w-10 text-blue-400" />
                <span>Your History</span>
              </h1>
              <p className="text-xl text-zinc-400">
                View and manage your news check history and statistics.
              </p>
            </div>
            {history.length > 0 && (
              <button
                onClick={exportHistory}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download className="h-5 w-5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
              <h3 className="font-semibold text-zinc-300 mb-3 text-sm uppercase tracking-wider">Total Checks</h3>
              <p className="text-3xl font-bold text-white">{statistics.total_checks}</p>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
              <h3 className="font-semibold text-zinc-300 mb-3 text-sm uppercase tracking-wider">Real News</h3>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <p className="text-3xl font-bold text-green-400">{statistics.real_count}</p>
              </div>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
              <h3 className="font-semibold text-zinc-300 mb-3 text-sm uppercase tracking-wider">Fake News</h3>
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <p className="text-3xl font-bold text-red-400">{statistics.fake_count}</p>
              </div>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
              <h3 className="font-semibold text-zinc-300 mb-3 text-sm uppercase tracking-wider">Avg Confidence</h3>
              <p className="text-3xl font-bold text-blue-400">
                {statistics.avg_confidence}%
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8 max-w-4xl mx-auto">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            <span className="ml-4 text-zinc-300 text-lg">Loading history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 max-w-4xl mx-auto">
            <CheckCircle className="h-20 w-20 mx-auto text-zinc-600 mb-6" />
            <h2 className="text-2xl font-semibold text-zinc-300 mb-4">No history found</h2>
            <p className="text-zinc-500 mb-8 text-lg">
              You haven't checked any news yet.
            </p>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span>Check Your First News</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-6 max-w-4xl mx-auto">
              {history.map((item) => (
                <div key={item.id} className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getResultIcon(item.is_fake)}
                    <div>
                      <h3 className={`font-semibold text-lg ${
                        item.is_fake ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {item.is_fake ? 'Likely Fake/Misleading' : 'Likely Real/Credible'}
                      </h3>
                      <p className="text-sm text-blue-400">
                        {item.confidence}% confidence
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-zinc-500">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{formatDate(item.created_at)}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-zinc-300 mb-2">
                    {item.input_url ? 'URL Checked:' : 'Text Checked:'}
                  </h4>
                  <p className="text-zinc-300 bg-zinc-800/50 p-3 rounded-lg">
                    {truncateText(item.input_text || item.input_url || '', 200)}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-zinc-300 mb-2">Analysis:</h4>
                  <p className="text-zinc-300 leading-relaxed">
                    {truncateText(item.result_json.explanation, 300)}
                  </p>
                </div>

                {item.tags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-zinc-300 mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center space-x-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm border border-blue-500/30"
                        >
                          <Tag className="h-3 w-3" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-zinc-400">
                  <div className="flex space-x-4">
                    <span>💬 {item.feedback_count} feedback(s)</span>
                    <span>📝 {item.forum_posts_count} forum post(s)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex justify-center items-center space-x-6 mt-12 pb-8">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.has_previous}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                
                <span className="text-zinc-300 bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800">
                  Page {pagination.current_page} of {pagination.total_pages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.has_next}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
