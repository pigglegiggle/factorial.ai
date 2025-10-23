'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Share2, MessageSquare, CheckCircle } from 'lucide-react';

interface ForumPostFormProps {
  newsCheckId: number;
}

export default function ForumPostForm({ newsCheckId }: ForumPostFormProps) {
  const { token } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Authentication required');
      return;
    }

    if (content.trim().length < 10) {
      setError('Post content must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          news_check_id: newsCheckId,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setContent('');
      } else {
        setError(data.error || 'Failed to create forum post');
      }
    } catch (error) {
      console.error('Forum post creation error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 p-6 shadow-xl h-full flex flex-col justify-center">
        <div className="text-center flex flex-col justify-center items-center min-h-[200px]">
          <div className="p-4 bg-green-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Posted to Forum!</h3>
          <p className="text-zinc-400 mb-4">Your insights are now part of the community discussion.</p>
          <a 
            href="/forum" 
            className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <span>View in Forum</span>
            <span>→</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 p-6 shadow-xl h-full flex flex-col justify-center">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <MessageSquare className="h-5 w-5 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-white">Share to Forum</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="forum-content" className="block text-sm font-medium text-zinc-300 mb-2">
            Share your thoughts about this analysis
          </label>
          <textarea
            id="forum-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you think about this news check? Share your insights, additional context, or questions..."
            rows={4}
            className="w-full p-4 bg-zinc-700/50 border border-zinc-600 rounded-xl text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors resize-none"
            disabled={isSubmitting}
          />
          <p className="text-xs text-zinc-400 mt-2">
            {content.length}/10 characters minimum
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || content.trim().length < 10}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold disabled:bg-zinc-600 disabled:cursor-not-allowed transition-all hover:scale-[1.02] flex items-center justify-center space-x-2 shadow-lg"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Posting...</span>
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              <span>Post to Forum</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
