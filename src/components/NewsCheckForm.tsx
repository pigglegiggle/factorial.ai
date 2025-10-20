'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import FeedbackForm from './FeedbackForm';
import ForumPostForm from './ForumPostForm';
import { 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Loader, 
  Tag, 
  MessageSquare, 
  FileText,
  Globe,
  Zap,
  TrendingUp,
  Shield
} from 'lucide-react';

interface NewsAnalysis {
  is_fake: boolean;
  confidence: number;
  explanation: string;
  tags: string[];
  feedback_enhanced?: boolean;
  confidence_adjusted?: boolean;
  original_confidence?: number;
  adjustment_reason?: string;
}

interface NewsCheckResult {
  id: number;
  result: NewsAnalysis;
  created_at: string;
  message: string;
}

const NewsCheckForm: React.FC = () => {
  const { user, token } = useAuth();
  const [inputType, setInputType] = useState<'text' | 'url'>('text');
  const [newsText, setNewsText] = useState('');
  const [newsUrl, setNewsUrl] = useState('');
  const [result, setResult] = useState<NewsCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showForumForm, setShowForumForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const content = inputType === 'text' ? newsText : newsUrl;
    if (!content.trim()) {
      setError('Please enter some news content or URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setShowFeedbackForm(false);
    setShowForumForm(false);

    try {
      const requestBody = inputType === 'text' 
        ? { input_text: newsText }
        : { input_url: newsUrl };

      const response = await fetch('/api/check-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setShowFeedbackForm(true);
        setShowForumForm(true);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getResultColor = (isFake: boolean) => {
    return isFake ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-green-400 bg-green-500/10 border-green-500/20';
  };

  const getResultIcon = (isFake: boolean) => {
    return isFake ? (
      <AlertTriangle className="h-8 w-8 text-red-400" />
    ) : (
      <CheckCircle className="h-8 w-8 text-green-400" />
    );
  };

  const SkeletonPlaceholder = () => (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-8 h-full">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-zinc-800 rounded-full skeleton"></div>
        <div className="space-y-2">
          <div className="w-32 h-6 bg-zinc-800 rounded skeleton"></div>
          <div className="w-48 h-4 bg-zinc-800 rounded skeleton"></div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="w-20 h-4 bg-zinc-800 rounded skeleton mb-2"></div>
          <div className="space-y-2">
            <div className="w-full h-4 bg-zinc-800 rounded skeleton"></div>
            <div className="w-4/5 h-4 bg-zinc-800 rounded skeleton"></div>
            <div className="w-3/5 h-4 bg-zinc-800 rounded skeleton"></div>
          </div>
        </div>
        
        <div>
          <div className="w-12 h-4 bg-zinc-800 rounded skeleton mb-2"></div>
          <div className="flex flex-wrap gap-2">
            <div className="w-16 h-6 bg-zinc-800 rounded skeleton"></div>
            <div className="w-20 h-6 bg-zinc-800 rounded skeleton"></div>
            <div className="w-24 h-6 bg-zinc-800 rounded skeleton"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111114] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden mb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center mb-0">
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
              <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-blue-400" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center sm:text-left">
                <span className="gradient-text">Factorial</span><span className="text-blue-400">.ai</span>
              </h1>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto text-center px-4">
              Advanced AI-powered fact-checking to combat misinformation in real-time
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 mt-8 text-sm text-zinc-500">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span>Self-Learning AI Model</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span>Improves with Feedback</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Left Panel - Input Form */}
          <div className="space-y-8">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-8">
              <h2 className="text-2xl font-bold mb-6 text-white">Analyze News Content</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Input type toggle */}
                <div className="flex">
                  <div className="bg-zinc-800/50 p-1 rounded-lg flex w-full">
                    <button
                      type="button"
                      onClick={() => setInputType('text')}
                      className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                        inputType === 'text'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Text Input</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputType('url')}
                      className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                        inputType === 'url'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                      }`}
                    >
                      <Globe className="h-4 w-4" />
                      <span>URL Input</span>
                    </button>
                  </div>
                </div>

                {/* Input field */}
                <div className="space-y-2">
                  {inputType === 'text' ? (
                    <div>
                      <label htmlFor="newsText" className="block text-sm font-medium text-zinc-300 mb-2">
                        Enter news content to analyze
                      </label>
                      <textarea
                        id="newsText"
                        value={newsText}
                        onChange={(e) => setNewsText(e.target.value)}
                        placeholder="Paste the news article content here..."
                        rows={8}
                        className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-500 resize-none"
                        disabled={isLoading}
                      />
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="newsUrl" className="block text-sm font-medium text-zinc-300 mb-2">
                        Enter news article URL
                      </label>
                      <input
                        id="newsUrl"
                        type="url"
                        value={newsUrl}
                        onChange={(e) => setNewsUrl(e.target.value)}
                        placeholder="https://example.com/news-article"
                        className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-500"
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading || (!newsText.trim() && !newsUrl.trim())}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3 font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Analyzing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      <span>Analyze News</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error message */}
              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-8">
            {isLoading ? (
              <SkeletonPlaceholder />
            ) : result ? (
              <div className={`bg-zinc-900/50 backdrop-blur-sm rounded-xl border p-8 analysis-card-enter ${getResultColor(result.result.is_fake)}`}>
                <div className="flex items-center space-x-3 mb-6">
                  {getResultIcon(result.result.is_fake)}
                  <div>
                    <h2 className="text-2xl font-bold text-white">Analysis Complete</h2>
                    <div className="flex flex-col space-y-2 mt-2">
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getResultColor(result.result.is_fake)}`}>
                        {result.result.is_fake ? 'Likely Fake News' : 'Likely Authentic'} ({result.result.confidence}% confidence)
                      </span>
                      
                      {/* Feedback Enhancement Indicators */}
                      <div className="flex flex-wrap gap-2">
                        {result.result.feedback_enhanced && (
                          <span className="inline-flex items-center space-x-1 bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs border border-purple-500/30">
                            <TrendingUp className="h-3 w-3" />
                            <span>Enhanced by User Feedback</span>
                          </span>
                        )}
                        {result.result.confidence_adjusted && (
                          <span className="inline-flex items-center space-x-1 bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs border border-yellow-500/30" title={result.result.adjustment_reason}>
                            <Zap className="h-3 w-3" />
                            <span>Confidence Calibrated</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-zinc-300 mb-3 flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>AI Analysis:</span>
                    </h3>
                    <p className="text-zinc-300 leading-relaxed bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">{result.result.explanation}</p>
                  </div>
                  
                  {result.result.tags && result.result.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-zinc-300 mb-3 flex items-center space-x-2">
                        <Tag className="h-4 w-4" />
                        <span>Related Tags:</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.result.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center space-x-1 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-500/30"
                          >
                            <Tag className="h-3 w-3" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/30 rounded-xl border border-zinc-800 border-dashed p-12 text-center">
                <Shield className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-zinc-400 mb-2">Ready to Analyze</h3>
                <p className="text-zinc-500">Enter news content on the left to get instant AI-powered fact-checking results</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Forms */}
        {result && (
          <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Feedback Form */}
            {showFeedbackForm && (
              <div>
                <FeedbackForm
                  newsCheckId={result.id}
                />
              </div>
            )}

            {/* Forum Post Form */}
            {showForumForm && user && (
              <div>
                <ForumPostForm
                  newsCheckId={result.id}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsCheckForm;
