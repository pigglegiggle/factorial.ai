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
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <p className="text-green-400 font-medium">Posted to Forum!</p>
        </div>
        <a 
          href="/forum" 
          className="text-blue-400 hover:text-blue-300 underline text-sm"
        >
          View in Forum →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <MessageSquare className="h-5 w-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Share to Forum</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-500"
            disabled={isSubmitting}
          />
          <p className="text-xs text-zinc-500 mt-1">
            {content.length}/10 characters minimum
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || content.trim().length < 10}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
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
