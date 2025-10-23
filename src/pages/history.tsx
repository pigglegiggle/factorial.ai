'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { Clock, CheckCircle, AlertTriangle, Tag, Download, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
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
    content_type?: 'factual_claim' | 'opinion' | 'mixed' | 'satirical' | 'unclear';
    credibility_assessment?: 'highly_credible' | 'likely_credible' | 'uncertain' | 'likely_false' | 'highly_false' | 'opinion_based' | 'satirical';
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
  opinion_count?: number;
  satirical_count?: number;
  mixed_count?: number;
  unclear_count?: number;
  factual_count?: number;
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
        
        // Calculate enhanced statistics including content types
        const enhancedStats = {
          ...data.statistics,
          opinion_count: data.history.filter((item: HistoryItem) => item.result_json.content_type === 'opinion').length,
          satirical_count: data.history.filter((item: HistoryItem) => item.result_json.content_type === 'satirical').length,
          mixed_count: data.history.filter((item: HistoryItem) => item.result_json.content_type === 'mixed').length,
          unclear_count: data.history.filter((item: HistoryItem) => item.result_json.content_type === 'unclear').length,
          factual_count: data.history.filter((item: HistoryItem) => !item.result_json.content_type || item.result_json.content_type === 'factual_claim').length,
        };
        
        setStatistics(enhancedStats);
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
    // Format in Bangkok time (Asia/Bangkok timezone)
    return date.toLocaleDateString('th-TH', { 
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ' ' + date.toLocaleTimeString('th-TH', { 
      timeZone: 'Asia/Bangkok',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getResultInfo = (item: HistoryItem) => {
    const contentType = item.result_json.content_type;
    
    switch (contentType) {
      case 'opinion':
        return {
          title: 'Opinion Content',
          color: 'blue',
          icon: <MessageSquare className="h-6 w-6 text-blue-400" />,
          bgColor: 'bg-blue-500/20 border border-blue-500/30',
          textColor: 'text-blue-300'
        };
      case 'satirical':
        return {
          title: 'Satirical Content',
          color: 'purple',
          icon: <MessageSquare className="h-6 w-6 text-purple-400" />,
          bgColor: 'bg-purple-500/20 border border-purple-500/30',
          textColor: 'text-purple-300'
        };
      case 'mixed':
        return {
          title: item.is_fake ? 'Mixed Content (Contains False Claims)' : 'Mixed Content (Mostly Valid)',
          color: item.is_fake ? 'red' : 'yellow',
          icon: item.is_fake ? <AlertTriangle className="h-6 w-6 text-red-400" /> : <CheckCircle className="h-6 w-6 text-yellow-400" />,
          bgColor: item.is_fake ? 'bg-red-500/20 border border-red-500/30' : 'bg-yellow-500/20 border border-yellow-500/30',
          textColor: item.is_fake ? 'text-red-300' : 'text-yellow-300'
        };
      case 'unclear':
        return {
          title: 'Unclear Content',
          color: 'gray',
          icon: <AlertTriangle className="h-6 w-6 text-gray-400" />,
          bgColor: 'bg-gray-500/20 border border-gray-500/30',
          textColor: 'text-gray-300'
        };
      default: // factual_claim
        return {
          title: item.is_fake ? 'Likely Misinformation' : 'Appears Authentic',
          color: item.is_fake ? 'red' : 'green',
          icon: item.is_fake ? <AlertTriangle className="h-6 w-6 text-red-400" /> : <CheckCircle className="h-6 w-6 text-green-400" />,
          bgColor: item.is_fake ? 'bg-red-500/20 border border-red-500/30' : 'bg-green-500/20 border border-green-500/30',
          textColor: item.is_fake ? 'text-red-300' : 'text-green-300'
        };
    }
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
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center space-y-8">
            <div className="p-8 bg-zinc-800/30 rounded-2xl border border-zinc-700 max-w-2xl mx-auto">
              <div className="p-6 bg-blue-500/20 rounded-2xl w-fit mx-auto mb-8">
                <Clock className="h-16 w-16 text-blue-400" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-6">Access Your History</h1>
              <p className="text-zinc-400 text-xl leading-relaxed mb-8">
                Please log in to view your fact-checking history, statistics, and insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/auth/login" 
                  className="flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all hover:scale-105 shadow-lg"
                >
                  <span>Sign In</span>
                </Link>
                <Link 
                  href="/auth/register" 
                  className="flex items-center space-x-3 bg-zinc-700 hover:bg-zinc-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all hover:scale-105"
                >
                  <span>Create Account</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111114] text-white">
      {/* Enhanced Header Section */}
      <div className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/20 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30">
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold text-white bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                    Your History
                  </h1>
                  <p className="text-xl text-zinc-400 mt-2">
                    Track your fact-checking journey and insights
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2 bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-700">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-zinc-300">Live Analytics</span>
                </div>
                <div className="flex items-center space-x-2 text-zinc-400">
                  <span>Bangkok Time</span>
                </div>
              </div>
            </div>
            {history.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={exportHistory}
                  className="flex items-center space-x-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all hover:scale-105 shadow-lg shadow-green-500/20"
                >
                  <Download className="h-5 w-5" />
                  <span>Export Data</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Enhanced Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-16">
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-6 hover:border-zinc-600 hover:bg-zinc-800/70 transition-all duration-300 shadow-xl hover:shadow-2xl group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
              </div>
              <h3 className="font-semibold text-zinc-300 mb-2 text-xs uppercase tracking-wider">Total Checks</h3>
              <p className="text-3xl font-bold text-white mb-2">{statistics.total_checks}</p>
              <div className="w-full bg-zinc-700 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>
            
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-6 hover:border-zinc-600 hover:bg-zinc-800/70 transition-all duration-300 shadow-xl hover:shadow-2xl group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
              </div>
              <h3 className="font-semibold text-zinc-300 mb-2 text-xs uppercase tracking-wider">Authentic</h3>
              <p className="text-3xl font-bold text-green-400 mb-2">{statistics.real_count}</p>
              <div className="w-full bg-zinc-700 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full" 
                     style={{width: `${statistics.total_checks > 0 ? (statistics.real_count / statistics.total_checks) * 100 : 0}%`}}>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-6 hover:border-zinc-600 hover:bg-zinc-800/70 transition-all duration-300 shadow-xl hover:shadow-2xl group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
              </div>
              <h3 className="font-semibold text-zinc-300 mb-2 text-xs uppercase tracking-wider">Misinformation</h3>
              <p className="text-3xl font-bold text-red-400 mb-2">{statistics.fake_count}</p>
              <div className="w-full bg-zinc-700 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 h-1.5 rounded-full" 
                     style={{width: `${statistics.total_checks > 0 ? (statistics.fake_count / statistics.total_checks) * 100 : 0}%`}}>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-6 hover:border-zinc-600 hover:bg-zinc-800/70 transition-all duration-300 shadow-xl hover:shadow-2xl group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-400/20 rounded-xl group-hover:bg-blue-400/30 transition-colors">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </div>
              </div>
              <h3 className="font-semibold text-zinc-300 mb-2 text-xs uppercase tracking-wider">Opinion</h3>
              <p className="text-3xl font-bold text-blue-400 mb-2">{statistics.opinion_count || 0}</p>
              <div className="w-full bg-zinc-700 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-1.5 rounded-full" 
                     style={{width: `${statistics.total_checks > 0 ? ((statistics.opinion_count || 0) / statistics.total_checks) * 100 : 0}%`}}>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-6 hover:border-zinc-600 hover:bg-zinc-800/70 transition-all duration-300 shadow-xl hover:shadow-2xl group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <h3 className="font-semibold text-zinc-300 mb-2 text-xs uppercase tracking-wider">Satirical</h3>
              <p className="text-3xl font-bold text-purple-400 mb-2">{statistics.satirical_count || 0}</p>
              <div className="w-full bg-zinc-700 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-1.5 rounded-full" 
                     style={{width: `${statistics.total_checks > 0 ? ((statistics.satirical_count || 0) / statistics.total_checks) * 100 : 0}%`}}>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-6 hover:border-zinc-600 hover:bg-zinc-800/70 transition-all duration-300 shadow-xl hover:shadow-2xl group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-xl group-hover:bg-yellow-500/30 transition-colors">
                  <div className="h-5 w-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-xs font-bold text-white">%</div>
                </div>
              </div>
              <h3 className="font-semibold text-zinc-300 mb-2 text-xs uppercase tracking-wider">Avg Confidence</h3>
              <p className="text-3xl font-bold text-yellow-400 mb-2">{statistics.avg_confidence}%</p>
              <div className="w-full bg-zinc-700 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-1.5 rounded-full" 
                     style={{width: `${statistics.avg_confidence}%`}}>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-zinc-800/50 border border-red-500/20 rounded-2xl p-8 mb-12 shadow-xl">
            <div className="text-center space-y-3">
              <div className="p-3 bg-red-500/20 rounded-2xl w-fit mx-auto">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <div className="text-center space-y-6">
              <div className="animate-spin rounded-full h-16 w-16 border-2 border-blue-500/20 border-t-blue-400 mx-auto"></div>
              <p className="text-zinc-400 text-xl">Loading your fact-checking journey...</p>
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-32">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="p-8 bg-zinc-800/30 rounded-2xl border border-zinc-700">
                <div className="p-6 bg-blue-500/20 rounded-2xl w-fit mx-auto mb-8">
                  <Clock className="h-16 w-16 text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-6">Start Your Journey</h2>
                <p className="text-zinc-400 text-xl leading-relaxed mb-8">
                  Begin fact-checking news and build your analysis history. Track patterns, insights, and improve media literacy.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/"
                    className="flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all hover:scale-105 shadow-lg"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Analyze Your First News</span>
                  </Link>
                  <Link
                    href="/forum"
                    className="flex items-center space-x-3 bg-zinc-700 hover:bg-zinc-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all hover:scale-105"
                  >
                    <span>Explore Community</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {history.map((item) => (
                <article key={item.id} className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-8 hover:border-zinc-600 hover:bg-zinc-800/70 transition-all duration-300 shadow-xl hover:shadow-2xl">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-2xl ${getResultInfo(item).bgColor}`}>
                      {getResultInfo(item).icon}
                    </div>
                    <div>
                      <h3 className={`font-bold text-xl ${getResultInfo(item).textColor}`}>
                        {getResultInfo(item).title}
                      </h3>
                      <div className="flex items-center space-x-3 mt-2">
                        <div className={`px-3 py-1 rounded-xl text-sm font-semibold ${
                          item.confidence >= 80 
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : item.confidence >= 60
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {item.confidence}% confidence
                        </div>
                        <div className="flex items-center space-x-3 text-zinc-400 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(item.created_at)}</span>
                          {item.result_json.content_type && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.result_json.content_type === 'opinion' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              item.result_json.content_type === 'satirical' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                              item.result_json.content_type === 'mixed' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              item.result_json.content_type === 'unclear' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                              'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                            }`}>
                              {item.result_json.content_type.replace('_', ' ').toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-zinc-700/30 rounded-2xl p-6 border border-zinc-600/30">
                    <h4 className="font-semibold text-zinc-300 mb-4 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>{item.input_url ? 'URL Analyzed' : 'Content Analyzed'}</span>
                    </h4>
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-600/20">
                      <p className="text-zinc-200 leading-relaxed">
                        {truncateText(item.input_text || item.input_url || '', 200)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-700/30 rounded-2xl p-6 border border-zinc-600/30">
                    <h4 className="font-semibold text-zinc-300 mb-4 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span>AI Analysis</span>
                    </h4>
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-600/20">
                      <p className="text-zinc-200 leading-relaxed">
                        {truncateText(item.result_json.explanation, 300)}
                      </p>
                    </div>
                  </div>

                  {item.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-zinc-300 mb-4 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Topics & Tags</span>
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-200 px-4 py-2 rounded-xl text-sm font-medium border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                          >
                            <Tag className="h-4 w-4" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t border-zinc-600/30">
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2 bg-zinc-700/50 px-3 py-2 rounded-lg border border-zinc-600/30">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-zinc-300">{item.feedback_count} feedback</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-zinc-700/50 px-3 py-2 rounded-lg border border-zinc-600/30">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-zinc-300">{item.forum_posts_count} forum posts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

            {/* Enhanced Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex justify-center items-center space-x-8 mt-16 pb-12">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.has_previous}
                  className="flex items-center space-x-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-all hover:scale-105 shadow-lg disabled:hover:scale-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>Previous</span>
                </button>
                
                <div className="bg-zinc-800/50 border border-zinc-700 px-6 py-4 rounded-2xl shadow-xl">
                  <span className="text-zinc-200 font-semibold">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  <p className="text-xs text-zinc-400 mt-1">
                    Total: {pagination.total_checks} checks
                  </p>
                </div>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.has_next}
                  className="flex items-center space-x-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-all hover:scale-105 shadow-lg disabled:hover:scale-100"
                >
                  <span>Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
