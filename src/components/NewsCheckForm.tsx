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
  Shield,
  Users
} from 'lucide-react';

interface NewsAnalysis {
  is_fake: boolean;
  confidence: number;
  content_type?: 'factual_claim' | 'opinion' | 'mixed' | 'satirical' | 'unclear';
  credibility_assessment?: 'highly_credible' | 'likely_credible' | 'uncertain' | 'likely_false' | 'highly_false' | 'opinion_based' | 'satirical';
  explanation: string;
  summary?: string;
  detailed_analysis?: {
    step1_content_analysis: string;
    step2_source_verification: string;
    step3_fact_checking: string;
    step4_credibility_assessment: string;
    step5_final_verdict: string;
  };
  categories?: string[];
  tags?: string[]; // Keep for backward compatibility
  feedback_enhanced?: boolean;
  confidence_adjusted?: boolean;
  original_confidence?: number;
  adjustment_reason?: string;
  analysis_badges?: Array<{
    type: 'warning' | 'caution' | 'info';
    text: string;
    description: string;
  }>;
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
  const [currentStep, setCurrentStep] = useState(0);
  const [aiChain, setAiChain] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

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
    setAiChain(null);
    setShowFeedbackForm(false);
    setShowForumForm(false);
    setCurrentStep(0);
    setRetryCount(0);
    setIsRetrying(false);

    // Progress through steps with realistic timing
    const progressSteps = async () => {
      const stepTimings = [1000, 2000, 3000, 2500, 1500]; // Realistic timing for each step
      
      for (let i = 0; i < stepTimings.length; i++) {
        setCurrentStep(i);
        if (i < stepTimings.length - 1) {
          await new Promise(resolve => setTimeout(resolve, stepTimings[i]));
        }
      }
    };

    // Start the step progression
    const stepProgressPromise = progressSteps();

    // Retry mechanism for frontend API calls
    const makeAPICall = async (retryAttempt = 0): Promise<any> => {
      const maxRetries = 3;
      
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
          return data;
        } else {
          // Check if it's a service overload error
          const isRetryableError = 
            response.status === 503 || 
            response.status === 429 ||
            data.error?.includes('overloaded') ||
            data.error?.includes('try again');

          if (isRetryableError && retryAttempt < maxRetries) {
            setRetryCount(retryAttempt + 1);
            setIsRetrying(true);
            
            const delay = 2000 * Math.pow(1.5, retryAttempt); // Progressive delay
            console.log(`🔄 Retrying API call (${retryAttempt + 1}/${maxRetries}) in ${delay}ms...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            setIsRetrying(false);
            
            return makeAPICall(retryAttempt + 1);
          }
          
          throw new Error(data.error || 'Analysis failed');
        }
      } catch (error: any) {
        if (retryAttempt < maxRetries && (
          error.message?.includes('fetch') ||
          error.message?.includes('network') ||
          error.message?.includes('overloaded')
        )) {
          setRetryCount(retryAttempt + 1);
          setIsRetrying(true);
          
          const delay = 2000 * Math.pow(1.5, retryAttempt);
          console.log(`🔄 Retrying due to network error (${retryAttempt + 1}/${maxRetries}) in ${delay}ms...`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          setIsRetrying(false);
          
          return makeAPICall(retryAttempt + 1);
        }
        
        throw error;
      }
    };

    try {
      // Start both API call and step animation
      const [data] = await Promise.all([
        makeAPICall(),
        stepProgressPromise
      ]);
      
      // Complete the progress animation
      setCurrentStep(4); // Last step
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause

      setResult(data);
      setAiChain(data.chain);
      setShowFeedbackForm(true);
      setShowForumForm(true);
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Analysis failed. Please try again.');
      // Wait for step animation to complete even on error
      await stepProgressPromise;
    } finally {
      setIsLoading(false);
      setCurrentStep(0);
      setRetryCount(0);
      setIsRetrying(false);
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

  const LoadingOverlay = () => {
    const steps = [
      { icon: <Search className="w-6 h-6" />, text: 'Analyzing your content...', description: 'Reading and understanding the provided information' },
      { icon: <Zap className="w-6 h-6" />, text: 'Generating AI opinion...', description: 'Initial AI assessment without external sources' },
      { icon: <Globe className="w-6 h-6" />, text: 'Searching for reliable sources...', description: 'Finding credible sources using Google Search grounding' },
      { icon: <TrendingUp className="w-6 h-6" />, text: 'Cross-referencing with feedback data...', description: 'Analyzing historical feedback patterns' },
      { icon: <Shield className="w-6 h-6" />, text: 'Finalizing credibility score...', description: 'Computing final verdict with confidence calibration' }
    ];

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-700 p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isRetrying ? 'Retrying Analysis...' : 'AI Analysis in Progress'}
            </h3>
            <p className="text-zinc-400">
              {isRetrying 
                ? `AI service was busy, retrying (attempt ${retryCount}/3)...` 
                : 'Our AI is fact-checking your content...'
              }
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-start space-x-3 transition-all duration-500 ${
                  index <= currentStep 
                    ? 'opacity-100 text-white' 
                    : 'opacity-40 text-zinc-500'
                }`}
              >
                <div className={`mt-0.5 transition-colors duration-300 ${
                  index <= currentStep ? 'text-blue-400' : 'text-zinc-600'
                }`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className={`font-medium transition-colors duration-300 ${
                    index === currentStep ? 'text-blue-400' : index < currentStep ? 'text-green-400' : 'text-zinc-500'
                  }`}>
                    {step.text}
                  </div>
                  <div className="text-sm text-zinc-400 mt-1">
                    {step.description}
                  </div>
                </div>
                {index < currentStep && (
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                )}
                {index === currentStep && (
                  <Loader className="w-5 h-5 text-blue-400 animate-spin mt-0.5" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="text-center mt-4 text-sm text-zinc-400">
            {isRetrying ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader className="w-4 h-4 animate-spin text-yellow-400" />
                <span className="text-yellow-400">Retrying... (attempt {retryCount}/3)</span>
              </div>
            ) : (
              <span>Step {currentStep + 1} of {steps.length}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#111114] text-white">
      {/* Compact Header */}
      <div className="bg-zinc-900/50 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl font-bold">
                <span className="gradient-text">Factorial</span><span className="text-blue-400">.ai</span>
              </h1>
            </div>
            <div className="flex items-center space-x-6 text-sm text-zinc-400">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span>Self-Learning AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span>Feedback Enhanced</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Left Right Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(100vh-120px)]">
          
          {/* Left Panel - Input Section */}
          <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 p-6 h-fit">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">AI Fact Checker</h2>
              <p className="text-zinc-400">Verify news authenticity with advanced AI</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input type toggle */}
            <div className="flex justify-center">
              <div className="bg-zinc-700/50 p-1 rounded-xl flex">
                <button
                  type="button"
                  onClick={() => setInputType('text')}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    inputType === 'text'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Text Input</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputType('url')}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    inputType === 'url'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Globe className="h-4 w-4" />
                  <span>URL Input</span>
                </button>
              </div>
            </div>

            {/* Input field */}
            {inputType === 'text' ? (
              <div>
                <label htmlFor="newsText" className="block text-lg font-medium text-white mb-3 text-center">
                  Enter news content to analyze
                </label>
                <textarea
                  id="newsText"
                  value={newsText}
                  onChange={(e) => setNewsText(e.target.value)}
                  placeholder="Paste the news article content here..."
                  rows={6}
                  className="w-full p-4 bg-zinc-700/50 border border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-400 resize-none text-lg"
                  disabled={isLoading}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="newsUrl" className="block text-lg font-medium text-white mb-3 text-center">
                  Enter news article URL
                </label>
                <input
                  id="newsUrl"
                  type="url"
                  value={newsUrl}
                  onChange={(e) => setNewsUrl(e.target.value)}
                  placeholder="https://example.com/news-article"
                  className="w-full p-4 bg-zinc-700/50 border border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-400 text-lg"
                  disabled={isLoading}
                />
              </div>
            )}

              {/* Submit button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading || (!newsText.trim() && !newsUrl.trim())}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors flex items-center space-x-3 w-full justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      <span>Analyze News</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Error message */}
            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-center text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Right Panel - Results Section */}
          <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 overflow-hidden">
            {result ? (
          <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 overflow-hidden">
            {/* Results Header */}
            <div className={`p-8 flex justify-center items-center text-center border-b border-zinc-700 ${
              result.result.is_fake ? 'bg-red-500/5' : 'bg-green-500/5'
            }`}>
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                result.result.is_fake 
                  ? 'bg-red-500/20 border-2 border-red-500/30' 
                  : 'bg-green-500/20 border-2 border-green-500/30'
              }`}>
                {getResultIcon(result.result.is_fake)}
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">
                {result.result.is_fake ? 'Likely Misinformation' : 'Appears Authentic'}
              </h2>
              
              <div className={`text-5xl font-bold mb-2 ${
                result.result.is_fake ? 'text-red-400' : 'text-green-400'
              }`}>
                {result.result.confidence}%
              </div>
              <p className="text-zinc-400 text-lg">confidence level</p>
            </div>

            {/* Analysis Content */}
            <div className="p-8">
              {/* AI Analysis */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  <span>AI Analysis</span>
                </h3>
                <div className="bg-zinc-700/30 rounded-xl p-6 border border-zinc-600">
                  <p className="text-zinc-200 leading-relaxed text-lg">{result.result.explanation}</p>
                </div>
              </div>

              {/* Categories/Tags */}
              {((result.result.categories && result.result.categories.length > 0) || (result.result.tags && result.result.tags.length > 0)) && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <Tag className="h-5 w-5 text-blue-400" />
                    <span>{result.result.categories ? 'Categories' : 'Related Topics'}</span>
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {(result.result.categories || result.result.tags || []).map((item: string, index: number) => (
                      <span
                        key={index}
                        className="bg-blue-500/10 text-blue-300 px-4 py-2 rounded-xl text-sm border border-blue-500/20"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Shield className="h-16 w-16 text-zinc-600 mb-4" />
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">Ready to Analyze</h3>
              <p className="text-zinc-500">Enter news content to get AI-powered fact-checking results</p>
            </div>
          )}
          </div>
        </div>

        {/* Forms Section - Below Main Layout */}
        {result && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {showFeedbackForm && (
              <FeedbackForm newsCheckId={result.id} />
            )}
            {showForumForm && user && (
              <ForumPostForm newsCheckId={result.id} />
            )}
          </div>
        )}

        {!user && result && (
          <div className="mt-8 bg-zinc-800/30 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Join the Community</h3>
            <p className="text-zinc-400 mb-4">Sign up to rate analyses and share insights</p>
            <div className="flex justify-center space-x-4">
              <a
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Account
              </a>
              <a
                href="/auth/login"
                className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}
    </div>
  );
};

export default NewsCheckForm;
