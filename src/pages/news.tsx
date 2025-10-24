import React, { useState } from 'react';
import { Search, Calendar, ExternalLink, Clock, Newspaper, AlertCircle } from 'lucide-react';

interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
  query?: string;
  page?: number;
  pageSize?: number;
}

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState('bitcoin');
  const [lastSearchQuery, setLastSearchQuery] = useState('bitcoin'); // For display purposes
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const searchNews = async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastSearchQuery(query); // Update the display query
    
    try {
      const response = await fetch(
        `/api/news?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=20`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch news articles');
      }

      const data: NewsResponse = await response.json();
      setArticles(data.articles);
      setTotalResults(data.totalResults);
      setHasSearched(true);
    } catch (error) {
      console.error('Error fetching news:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to fetch news articles. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchNews(searchQuery);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <div className="min-h-screen bg-[#111114] text-white">
      {/* Header */}
      <div className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/20 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/20">
                <Newspaper className="h-12 w-12 text-blue-400" />
              </div>
              <div className="text-left">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  Latest News
                </h1>
                <p className="text-lg text-zinc-400 mt-2">
                  Search and discover breaking news from around the world
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search Section */}
        <div className="mb-12">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for news articles..."
                className="w-full pl-12 pr-32 py-4 bg-zinc-800/50 border border-zinc-700 rounded-2xl text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-lg"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white px-6 rounded-xl font-semibold transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results Summary */}
        {hasSearched && !isLoading && (
          <div className="mb-8 text-center">
            <p className="text-zinc-400">
              {error ? (
                <span className="text-red-400 flex items-center justify-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </span>
              ) : (
                `Found ${totalResults.toLocaleString()} articles for "${lastSearchQuery}"`
              )}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-32">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-2 border-blue-500/20 border-t-blue-400 mx-auto"></div>
              <p className="text-zinc-400 text-lg">Searching for news articles...</p>
            </div>
          </div>
        )}

        {/* News Articles Grid */}
        {!isLoading && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <article
                key={index}
                className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                {/* Article Image */}
                {article.urlToImage ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                ) : (
                  <div className="h-48 bg-zinc-700/50 flex items-center justify-center">
                    <Newspaper className="h-12 w-12 text-zinc-500" />
                  </div>
                )}

                {/* Article Content */}
                <div className="p-6 space-y-4">
                  {/* Source and Date */}
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span className="font-medium text-blue-400">{article.source?.name}</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{getTimeSince(article.publishedAt)}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </h2>

                  {/* Description */}
                  {article.description && (
                    <p className="text-zinc-300 text-sm line-clamp-3 leading-relaxed">
                      {article.description}
                    </p>
                  )}

                  {/* Author */}
                  {article.author && (
                    <p className="text-xs text-zinc-500">
                      By {article.author}
                    </p>
                  )}

                  {/* Read More Button */}
                  <div className="pt-2">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors group"
                    >
                      <span>Read full article</span>
                      <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && hasSearched && articles.length === 0 && !error && (
          <div className="text-center py-16">
            <Newspaper className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-zinc-400 mb-2">No articles found</h3>
            <p className="text-zinc-500">Try searching with different keywords</p>
          </div>
        )}

        {/* Welcome Message for First Visit */}
        {!hasSearched && !isLoading && (
          <div className="text-center py-16">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="p-8 bg-zinc-800/30 rounded-2xl border border-zinc-700">
                <Newspaper className="h-16 w-16 text-blue-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">Discover Breaking News</h3>
                <p className="text-zinc-400 text-lg leading-relaxed mb-6">
                  Search for the latest news articles from thousands of sources worldwide. 
                  Stay informed about topics that matter to you.
                </p>
                <button
                  onClick={() => searchNews(searchQuery)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Search className="h-4 w-4" />
                  <span>Search "{lastSearchQuery}"</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
