'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { MessageSquare, ThumbsUp, ThumbsDown, Clock, User, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ForumPost {
  id: number;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  username: string;
  result_json: {
    is_fake: boolean;
    confidence: number;
    explanation: string;
    tags: string[];
  };
  is_fake: boolean;
  confidence: number;
  news_content: string;
  tags: string[];
  user_vote?: 'upvote' | 'downvote' | null;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_posts: number;
  has_next: boolean;
  has_previous: boolean;
}

export default function ForumPage() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('recent');
  const [selectedTag, setSelectedTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [userVotes, setUserVotes] = useState<{ [postId: number]: 'upvote' | 'downvote' | null }>({});

  useEffect(() => {
    fetchPosts();
    fetchTags();
  }, [currentPage, sortBy, selectedTag]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sort: sortBy,
      });
      
      if (selectedTag) {
        params.append('tag', selectedTag);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include auth token if user is logged in
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/forum?${params}`, { headers });
      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts);
        setPagination(data.pagination);
        
        // Initialize user votes from the backend data
        if (user && data.posts) {
          const votes: { [postId: number]: 'upvote' | 'downvote' | null } = {};
          data.posts.forEach((post: ForumPost) => {
            votes[post.id] = post.user_vote || null;
          });
          setUserVotes(votes);
        }
        
        setError(null);
      } else {
        setError(data.error || 'Failed to load forum posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();

      if (response.ok) {
        const tags = data.tags.map((tag: any) => tag.name);
        setAvailableTags(tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleVote = async (postId: number, voteType: 'upvote' | 'downvote') => {
    if (!user || !token) {
      setError('Please log in to vote');
      return;
    }

    try {
      const response = await fetch(`/api/forum/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ vote_type: voteType }),
      });

      const data = await response.json();

      if (response.ok) {
        // Don't do optimistic updates - let the backend handle all logic
        // Just refresh posts to get the actual updated state
        fetchPosts();
        
        // Update user votes based on backend response
        if (data.action === 'removed') {
          setUserVotes(prev => ({
            ...prev,
            [postId]: null
          }));
        } else {
          setUserVotes(prev => ({
            ...prev,
            [postId]: data.vote_type
          }));
        }
      } else {
        setError(data.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Vote error:', error);
      setError('Network error. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getResultColor = (isFake: boolean) => {
    return isFake ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100';
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-[#111114] text-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/30 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center space-x-3">
              <MessageSquare className="h-10 w-10 text-blue-400" />
              <span>Factorial.ai Forum</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Discuss news analysis results, share insights, and learn from the community.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-blue-400 text-lg">
                <Link href="/auth/login" className="text-blue-300 underline font-medium">Log in</Link> to participate in discussions and vote on posts.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6 mb-8 max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-white mb-4">Filter & Sort</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="controversial">Most Controversial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Filter by Tag</label>
              <select
                value={selectedTag}
                onChange={(e) => {
                  setSelectedTag(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              >
                <option value="">All Tags</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8 max-w-4xl mx-auto">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20 max-w-4xl mx-auto">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            <span className="ml-4 text-zinc-300 text-lg">Loading posts...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 max-w-4xl mx-auto">
            <MessageSquare className="h-20 w-20 mx-auto text-zinc-600 mb-6" />
            <h2 className="text-2xl font-semibold text-zinc-300 mb-4">No posts found</h2>
            <p className="text-zinc-500 text-lg">
              Be the first to share a news analysis and start a discussion!
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6 max-w-4xl mx-auto">
              {posts.map((post) => (
                <div key={post.id} className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
                {/* Post header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-zinc-400" />
                    <span className="font-medium text-white">{post.username}</span>
                    <span className="text-zinc-500">•</span>
                    <div className="flex items-center space-x-1 text-zinc-500">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* News analysis summary */}
                <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      post.is_fake ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-green-400 bg-green-500/10 border border-green-500/20'
                    }`}>
                      {post.is_fake ? 'Likely Fake' : 'Likely Real'} ({post.confidence}% confidence)
                    </span>
                  </div>
                  
                  <p className="text-sm text-zinc-300 mb-2">
                    <strong>News:</strong> {truncateText(post.news_content, 150)}
                  </p>
                  
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center space-x-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs border border-blue-500/30"
                        >
                          <Tag className="h-3 w-3" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post content */}
                <p className="text-zinc-300 leading-relaxed mb-4">{post.content}</p>

                {/* Voting and actions */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleVote(post.id, 'upvote')}
                    disabled={!user}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      userVotes[post.id] === 'upvote'
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                    } disabled:text-zinc-600 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
                  >
                    <ThumbsUp className={`h-5 w-5 ${userVotes[post.id] === 'upvote' ? 'fill-current' : ''}`} />
                    <span className="font-medium">{post.upvotes}</span>
                  </button>
                  
                  <button
                    onClick={() => handleVote(post.id, 'downvote')}
                    disabled={!user}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      userVotes[post.id] === 'downvote'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                    } disabled:text-zinc-600 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
                  >
                    <ThumbsDown className={`h-5 w-5 ${userVotes[post.id] === 'downvote' ? 'fill-current' : ''}`} />
                    <span className="font-medium">{post.downvotes}</span>
                  </button>

                  <Link
                    href={`/forum/${post.id}`}
                    className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span>Comments</span>
                  </Link>
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
