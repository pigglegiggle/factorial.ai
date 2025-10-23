'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import ForumFeedbackForm from '@/components/ForumFeedbackForm';
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
  const [votingStates, setVotingStates] = useState<{ [postId: number]: boolean }>({});

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

    if (votingStates[postId]) return; // Prevent double clicking

    setVotingStates(prev => ({ ...prev, [postId]: true }));
    setError(null);

    // Store previous state for rollback on error
    const previousPosts = posts;
    const previousUserVote = userVotes[postId];

    try {
      // Optimistic update
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          const newPost = { ...post };
          let newUserVote: 'upvote' | 'downvote' | null = voteType;

          if (previousUserVote === voteType) {
            // User is removing their vote
            newUserVote = null;
            if (voteType === 'upvote') {
              newPost.upvotes = Math.max(0, newPost.upvotes - 1);
            } else {
              newPost.downvotes = Math.max(0, newPost.downvotes - 1);
            }
          } else {
            // User is changing or adding vote
            if (previousUserVote === 'upvote') {
              newPost.upvotes = Math.max(0, newPost.upvotes - 1);
            } else if (previousUserVote === 'downvote') {
              newPost.downvotes = Math.max(0, newPost.downvotes - 1);
            }

            if (voteType === 'upvote') {
              newPost.upvotes += 1;
            } else {
              newPost.downvotes += 1;
            }
          }

          return newPost;
        }
        return post;
      });

      setPosts(updatedPosts);
      
      // Update user vote optimistically
      const newUserVote = previousUserVote === voteType ? null : voteType;
      setUserVotes(prev => ({
        ...prev,
        [postId]: newUserVote
      }));

      // Make API call
      const response = await fetch(`/api/forum/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ vote_type: voteType }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Rollback on error
        setPosts(previousPosts);
        setUserVotes(prev => ({
          ...prev,
          [postId]: previousUserVote
        }));
        setError(data.error || 'Failed to vote');
      } else {
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
        
        // Sync with actual server data if provided
        if (data.upvotes !== undefined && data.downvotes !== undefined) {
          setPosts(prevPosts => prevPosts.map(post => 
            post.id === postId 
              ? { ...post, upvotes: data.upvotes, downvotes: data.downvotes }
              : post
          ));
        }
      }
    } catch (error) {
      // Rollback on error
      setPosts(previousPosts);
      setUserVotes(prev => ({
        ...prev,
        [postId]: previousUserVote
      }));
      console.error('Vote error:', error);
      setError('Network error. Please try again.');
    } finally {
      setVotingStates(prev => ({ ...prev, [postId]: false }));
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

  const getResultColor = (isFake: boolean) => {
    return isFake ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100';
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-[#111114] text-white">
      {/* Modern Header */}
      <div className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/20 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl border border-green-500/20">
                <MessageSquare className="h-12 w-12 text-green-400" />
              </div>
              <div className="text-left">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  Community Forum
                </h1>
                <p className="text-lg text-zinc-400 mt-2">
                  Share insights, discuss analysis results, and learn together
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {!user && (
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-8 mb-12 shadow-xl">
            <div className="text-center space-y-4">
              <div className="p-4 bg-blue-500/20 rounded-2xl w-fit mx-auto">
                <User className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Join the Discussion</h3>
              <p className="text-zinc-400 leading-relaxed">
                <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Log in</Link> to participate in discussions, vote on posts, and share your insights with the community.
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Filters */}
        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-8 mb-12 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Tag className="h-5 w-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Filter & Sort Posts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-3">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-4 bg-zinc-700/50 border border-zinc-600 rounded-xl text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-lg"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-3">Filter by Tag</label>
              <select
                value={selectedTag}
                onChange={(e) => {
                  setSelectedTag(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-4 bg-zinc-700/50 border border-zinc-600 rounded-xl text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-lg"
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
          <div className="bg-zinc-800/50 border border-red-500/20 rounded-2xl p-8 mb-12 shadow-xl">
            <div className="text-center space-y-3">
              <div className="p-3 bg-red-500/20 rounded-2xl w-fit mx-auto">
                <MessageSquare className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-2 border-green-500/20 border-t-green-400 mx-auto"></div>
              <p className="text-zinc-400 text-lg">Loading community discussions...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="p-8 bg-zinc-800/30 rounded-2xl border border-zinc-700">
                <MessageSquare className="h-16 w-16 text-green-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">Start the Conversation</h3>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  No discussions yet! Be the first to share a news analysis and engage with the community.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-zinc-600"
                >
                  {/* Post header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <User className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <span className="font-semibold text-white text-lg">{post.username}</span>
                        <div className="flex items-center space-x-2 text-zinc-400 text-sm mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced News analysis summary */}
                  <div className="bg-zinc-700/30 rounded-2xl p-6 mb-6 border border-zinc-600/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${
                        post.is_fake 
                          ? 'text-red-300 bg-red-500/20 border-red-500/30' 
                          : 'text-green-300 bg-green-500/20 border-green-500/30'
                      }`}>
                        {post.is_fake ? 'Likely Fake' : 'Likely Real'} ({post.confidence}% confidence)
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-zinc-800/50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-zinc-300 mb-2">Analyzed Content:</h4>
                        <p className="text-zinc-200 leading-relaxed">
                          {truncateText(post.news_content, 200)}
                        </p>
                      </div>
                      
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-200 px-3 py-1 rounded-lg text-sm font-medium border border-blue-500/30"
                            >
                              <Tag className="h-3 w-3" />
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Post content */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-3">Community Discussion:</h4>
                    <p className="text-zinc-200 leading-relaxed text-lg bg-zinc-700/20 rounded-xl p-4 border border-zinc-600/20">
                      {post.content}
                    </p>
                  </div>

                  {/* Enhanced Voting and actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-600/30 mb-6">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleVote(post.id, 'upvote')}
                        disabled={!user || votingStates[post.id]}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                          userVotes[post.id] === 'upvote'
                            ? 'bg-green-500/20 text-green-300 border-2 border-green-500/40 shadow-green-500/20 shadow-lg'
                            : 'text-green-400 hover:text-green-300 hover:bg-green-500/10 border-2 border-transparent hover:border-green-500/20'
                        } disabled:text-zinc-600 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                          votingStates[post.id] ? 'opacity-50' : ''
                        }`}
                      >
                        {votingStates[post.id] && userVotes[post.id] !== 'downvote' ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400"></div>
                        ) : (
                          <ThumbsUp className={`h-5 w-5 ${userVotes[post.id] === 'upvote' ? 'fill-current' : ''}`} />
                        )}
                        <span>{post.upvotes}</span>
                      </button>
                      
                      <button
                        onClick={() => handleVote(post.id, 'downvote')}
                        disabled={!user || votingStates[post.id]}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                          userVotes[post.id] === 'downvote'
                            ? 'bg-red-500/20 text-red-300 border-2 border-red-500/40 shadow-red-500/20 shadow-lg'
                            : 'text-red-400 hover:text-red-300 hover:bg-red-500/10 border-2 border-transparent hover:border-red-500/20'
                        } disabled:text-zinc-600 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                          votingStates[post.id] ? 'opacity-50' : ''
                        }`}
                      >
                        {votingStates[post.id] && userVotes[post.id] !== 'upvote' ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
                        ) : (
                          <ThumbsDown className={`h-5 w-5 ${userVotes[post.id] === 'downvote' ? 'fill-current' : ''}`} />
                        )}
                        <span>{post.downvotes}</span>
                      </button>
                    </div>

                    <Link
                      href={`/forum/${post.id}`}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>View Discussion</span>
                    </Link>
                  </div>

                  {/* Community Feedback Section */}
                  <div className="border-t border-zinc-600/30 pt-6">
                    <ForumFeedbackForm forumPostId={post.id} />
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
                    Total: {pagination.total_posts} posts
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
