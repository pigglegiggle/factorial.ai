'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Star, Send, CheckCircle } from 'lucide-react';

interface FeedbackFormProps {
  newsCheckId: number;
}

export default function FeedbackForm({ newsCheckId }: FeedbackFormProps) {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Authentication required');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          news_check_id: newsCheckId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setRating(0);
        setComment('');
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center space-x-2">
        <CheckCircle className="h-5 w-5 text-green-400" />
        <p className="text-green-400 font-medium">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Star className="h-5 w-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">Rate this Analysis</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Rate the accuracy of this analysis
          </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-1 rounded transition-colors ${
                  star <= rating
                    ? 'text-yellow-400 hover:text-yellow-500'
                    : 'text-zinc-600 hover:text-zinc-500'
                }`}
              >
                <Star className={`h-6 w-6 ${star <= rating ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            1 = Very Poor, 5 = Excellent
          </p>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-zinc-300 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts on the analysis quality..."
            rows={3}
            className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-500"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Submit Feedback</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
