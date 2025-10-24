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
  Home,
  ArrowLeft,
  Eye,
  X,
  RotateCcw,
  Plus,
  Users
} from 'lucide-react';

interface NewsAnalysis {
  is_fake: boolean;
  confidence: number;
  content_type: 'factual_claim' | 'opinion' | 'mixed' | 'satirical' | 'unclear';
  credibility_assessment: 'highly_credible' | 'likely_credible' | 'uncertain' | 'likely_false' | 'highly_false' | 'opinion_based' | 'satirical';
  explanation: string;
  summary: string;
  detailed_analysis: {
    step1_content_analysis: string;
    step2_source_verification: string;
    step3_fact_checking: string;
    step4_credibility_assessment: string;
    step5_final_verdict: string;
  };
  categories: string[];
  feedback_enhanced?: boolean;
  confidence_adjusted?: boolean;
  original_confidence?: number;
  adjustment_reason?: string;
  analysis_badges?: Array<{
    type: 'warning' | 'caution' | 'info';
    text: string;
    description: string;
  }>;
  learning_insights?: {
    modelPerformance: string;
    agreementRate: number;
    totalFeedback: number;
    keyIssues: string[];
    recommendedActions: string[];
  };
  opinionContext?: {
    forumDiscussions: number;
    userAgreement: 'high' | 'low' | 'mixed';
    commonPoints: string[];
  };
}

interface NewsCheckResult {
  id: number;
  result: NewsAnalysis;
  created_at: string;
  message: string;
}

const AnalysisPage: React.FC = () => {
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
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [showFullResults, setShowFullResults] = useState(false);

  const resetAnalysis = () => {
    setResult(null);
    setNewsText('');
    setNewsUrl('');
    setError(null);
    setShowFeedbackForm(false);
    setShowForumForm(false);
    setShowFullResults(false);
    setShowDetailedModal(false);
  };

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
          // Handle authentication errors specifically
          if (response.status === 401 && data.error === 'Authentication required') {
            throw new Error('AUTHENTICATION_REQUIRED');
          }
          
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
      
      // Trigger full-screen results immediately
      setShowFullResults(true);
    } catch (error: any) {
      console.error('Error:', error);
      
      // Handle authentication error specifically
      if (error.message === 'AUTHENTICATION_REQUIRED') {
        setError('Please sign in to analyze news content. Create a free account to access our AI fact-checking service.');
      } else {
        setError(error.message || 'Analysis failed. Please try again.');
      }
      
      // Wait for step animation to complete even on error
      await stepProgressPromise;
    } finally {
      setIsLoading(false);
      setCurrentStep(0);
      setRetryCount(0);
      setIsRetrying(false);
    }
  };

  const getResultInfo = (analysis: NewsAnalysis) => {
    // For all content types, use simple binary classification based on is_fake
    if (analysis.content_type === 'opinion') {
      return {
        title: 'Opinion',
        subtitle: `${analysis.confidence}% confidence in assessment`,
        color: 'blue',
        icon: <MessageSquare className="h-8 w-8 text-blue-400" />
      };
    } else if (analysis.content_type === 'unclear') {
      return {
        title: 'Unclear',
        subtitle: `${analysis.confidence}% confidence in assessment`,
        color: 'gray',
        icon: <AlertTriangle className="h-8 w-8 text-gray-400" />
      };
    } else {
      // For factual claims, satirical, mixed - use simple Fake vs True classification
      return {
        title: analysis.is_fake ? 'Fake News' : 'Appears True',
        subtitle: `${analysis.confidence}% confidence level`,
        color: analysis.is_fake ? 'red' : 'green',
        icon: analysis.is_fake ? <AlertTriangle className="h-8 w-8 text-red-400" /> : <CheckCircle className="h-8 w-8 text-green-400" />
      };
    }
  };

  const getResultColor = (analysis: NewsAnalysis) => {
    const info = getResultInfo(analysis);
    switch (info.color) {
      case 'red': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'green': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'blue': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'purple': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'yellow': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
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

  const DetailedAnalysisModal = () => {
    if (!result || !showDetailedModal) return null;

    const analysisSteps = [
      {
        title: "Content Analysis",
        description: "Initial analysis of content structure and language patterns",
        content: result.result.detailed_analysis.step1_content_analysis,
        icon: <FileText className="h-5 w-5" />,
        color: "blue"
      },
      {
        title: "Source Verification",
        description: "Verification of sources and author credibility",
        content: result.result.detailed_analysis.step2_source_verification,
        icon: <Shield className="h-5 w-5" />,
        color: "green"
      },
      {
        title: "Fact Checking",
        description: "Cross-referencing claims with reliable sources",
        content: result.result.detailed_analysis.step3_fact_checking,
        icon: <Search className="h-5 w-5" />,
        color: "purple"
      },
      {
        title: "Credibility Assessment",
        description: "Assessment of logical consistency and bias indicators",
        content: result.result.detailed_analysis.step4_credibility_assessment,
        icon: <TrendingUp className="h-5 w-5" />,
        color: "yellow"
      },
      {
        title: "Final Verdict",
        description: "Final reasoning and confidence calibration",
        content: result.result.detailed_analysis.step5_final_verdict,
        icon: getResultInfo(result.result).icon,
        color: getResultInfo(result.result).color
      }
    ];

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-700 max-w-7xl w-full max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-700">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Detailed AI Analysis</h2>
              <p className="text-zinc-400">Step-by-step breakdown of the fact-checking process</p>
            </div>
            <button
              onClick={() => setShowDetailedModal(false)}
              className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X className="h-6 w-6 text-zinc-400 hover:text-white" />
            </button>
          </div>

          {/* Modal Content - Two Column Layout */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              
              {/* Left: Analysis Steps (2/3 width) */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Analysis Process</h3>
                {analysisSteps.map((step, index) => (
                  <div key={index} className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-${step.color}-500/20 border border-${step.color}-500/30`}>
                        <div className={`text-${step.color}-400`}>
                          {step.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-md font-semibold text-white">
                            {index + 1}. {step.title}
                          </h4>
                        </div>
                        <p className="text-zinc-400 text-xs mb-3">{step.description}</p>
                        <div className="bg-zinc-700/30 rounded-lg p-3 border border-zinc-600">
                          <p className="text-zinc-200 text-sm leading-relaxed">{step.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Key Resources & Insights (1/3 width) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Key Resources & Analysis</h3>
                
                {/* Content Type & Verification Status */}
                <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Content Classification</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-xs">Type</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        result.result.content_type === 'opinion' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        result.result.content_type === 'satirical' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        result.result.content_type === 'mixed' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        result.result.content_type === 'unclear' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                        'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                      }`}>
                        {result.result.content_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-xs">Status</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        result.result.credibility_assessment === 'highly_credible' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        result.result.credibility_assessment === 'likely_credible' ? 'bg-green-400/20 text-green-300 border border-green-400/30' :
                        result.result.credibility_assessment === 'uncertain' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        result.result.credibility_assessment === 'likely_false' ? 'bg-red-400/20 text-red-300 border border-red-400/30' :
                        result.result.credibility_assessment === 'highly_false' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        result.result.credibility_assessment === 'opinion_based' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {result.result.credibility_assessment.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Feedback Enhancement Status */}
                {result.result.feedback_enhanced && (
                  <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Feedback Enhancement</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs text-green-400 font-medium">Enhanced by user feedback</span>
                      </div>
                      {result.result.opinionContext && (
                        <div className="bg-zinc-700/30 rounded-lg p-2 mt-2">
                          <div className="text-xs text-zinc-300">
                            <div className="flex justify-between">
                              <span>Forum Discussions:</span>
                              <span className="text-blue-400">{result.result.opinionContext.forumDiscussions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>User Agreement:</span>
                              <span className={`${
                                result.result.opinionContext.userAgreement === 'high' ? 'text-green-400' :
                                result.result.opinionContext.userAgreement === 'low' ? 'text-red-400' :
                                'text-yellow-400'
                              }`}>
                                {result.result.opinionContext.userAgreement.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {result.result.categories && result.result.categories.length > 0 && (
                  <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4">
                    <h4 className="text-sm font-semibold text-white mb-2">Content Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.result.categories.map((category: string, index: number) => (
                        <span
                          key={index}
                          className="bg-blue-500/10 text-blue-300 px-2 py-1 rounded-md text-xs border border-blue-500/20"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analysis Insights - Enhanced */}
                {result.result.analysis_badges && result.result.analysis_badges.length > 0 && (
                  <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Analysis Insights</h4>
                    <div className="space-y-3">
                      {result.result.analysis_badges.map((badge, index) => (
                        <div key={index} className="group relative">
                          <div className={`p-3 rounded-lg text-xs border ${
                            badge.type === 'warning' ? 'bg-red-500/10 text-red-300 border-red-500/30' :
                            badge.type === 'caution' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' :
                            'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          }`}>
                            <div className="flex items-center space-x-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${
                                badge.type === 'warning' ? 'bg-red-400' :
                                badge.type === 'caution' ? 'bg-yellow-400' :
                                'bg-blue-400'
                              }`}></div>
                              <span className="font-medium">{badge.text}</span>
                            </div>
                            <div className="text-xs opacity-90 ml-4 leading-relaxed">{badge.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Model Learning Metrics - Enhanced with Real Data */}
                {result.result.learning_insights && (
                  <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Community Feedback Analysis</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-xs">Model Performance</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          result.result.learning_insights.modelPerformance === 'Excellent' ? 'bg-green-500/20 text-green-400' :
                          result.result.learning_insights.modelPerformance === 'Good' ? 'bg-blue-500/20 text-blue-400' :
                          result.result.learning_insights.modelPerformance === 'Fair' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {result.result.learning_insights.modelPerformance}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-xs">Community Agreement</span>
                        <span className={`text-xs font-bold ${
                          result.result.learning_insights.agreementRate >= 85 ? 'text-green-400' :
                          result.result.learning_insights.agreementRate >= 70 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {result.result.learning_insights.agreementRate}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-xs">Total Feedback</span>
                        <span className="text-zinc-300 text-xs">{result.result.learning_insights.totalFeedback} reviews</span>
                      </div>

                      {result.result.learning_insights.keyIssues.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-2">
                          <div className="text-xs text-amber-300 font-medium mb-1">Key Issues Detected</div>
                          {result.result.learning_insights.keyIssues.map((issue: string, index: number) => (
                            <div key={index} className="text-xs text-amber-200 flex items-start space-x-1">
                              <span>•</span>
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Community Discussion Points */}
                {result.result.opinionContext && result.result.opinionContext.commonPoints && result.result.opinionContext.commonPoints.length > 0 && (
                  <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Community Discussion Points</h4>
                    <div className="space-y-2">
                      {result.result.opinionContext.commonPoints.map((point: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <MessageSquare className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-zinc-300">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final Assessment */}
                <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Final Assessment</h4>
                  <div className={`text-center p-4 rounded-lg border ${
                    getResultInfo(result.result).color === 'red' ? 'bg-red-500/10 border-red-500/20' :
                    getResultInfo(result.result).color === 'green' ? 'bg-green-500/10 border-green-500/20' :
                    getResultInfo(result.result).color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' :
                    getResultInfo(result.result).color === 'purple' ? 'bg-purple-500/10 border-purple-500/20' :
                    getResultInfo(result.result).color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/20' :
                    'bg-gray-500/10 border-gray-500/20'
                  }`}>
                    <div className="mb-3 flex items-center justify-center w-12 h-12 rounded-full mx-auto ${">
                      {getResultInfo(result.result).icon}
                    </div>
                    <div className={`text-sm font-bold mb-2 ${
                      getResultInfo(result.result).color === 'red' ? 'text-red-400' :
                      getResultInfo(result.result).color === 'green' ? 'text-green-400' :
                      getResultInfo(result.result).color === 'blue' ? 'text-blue-400' :
                      getResultInfo(result.result).color === 'purple' ? 'text-purple-400' :
                      getResultInfo(result.result).color === 'yellow' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>
                      {getResultInfo(result.result).title}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {result.result.feedback_enhanced ? 'Enhanced by community feedback' : 'Base AI assessment'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FullScreenResults = () => {
    if (!result) return null;

    return (
      <div className="max-w-7xl mx-auto">
        {/* Header with Reset Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Analysis Complete</h1>
            <p className="text-zinc-400">Comprehensive fact-checking results</p>
          </div>
          <button
            onClick={resetAnalysis}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Analyze New Content</span>
          </button>
        </div>

        {/* Main Result Card - Wider Layout */}
        <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 overflow-hidden mb-6 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            
            {/* Left: Result Summary */}
            <div className={`p-8 border-b lg:border-b-0 lg:border-r border-zinc-700 flex flex-col justify-center items-center text-center ${getResultColor(result.result)}`}>
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                getResultInfo(result.result).color === 'red' 
                  ? 'bg-red-500/20 border-2 border-red-500/30' 
                  : getResultInfo(result.result).color === 'green'
                  ? 'bg-green-500/20 border-2 border-green-500/30'
                  : getResultInfo(result.result).color === 'blue'
                  ? 'bg-blue-500/20 border-2 border-blue-500/30'
                  : getResultInfo(result.result).color === 'purple'
                  ? 'bg-purple-500/20 border-2 border-purple-500/30'
                  : getResultInfo(result.result).color === 'yellow'
                  ? 'bg-yellow-500/20 border-2 border-yellow-500/30'
                  : 'bg-gray-500/20 border-2 border-gray-500/30'
              }`}>
                <div className="text-xl">
                  {getResultInfo(result.result).icon}
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">
                {getResultInfo(result.result).title}
              </h2>
              
              <div className={`text-4xl font-bold mb-2 ${
                getResultInfo(result.result).color === 'red' ? 'text-red-400' :
                getResultInfo(result.result).color === 'green' ? 'text-green-400' :
                getResultInfo(result.result).color === 'blue' ? 'text-blue-400' :
                getResultInfo(result.result).color === 'purple' ? 'text-purple-400' :
                getResultInfo(result.result).color === 'yellow' ? 'text-yellow-400' :
                'text-gray-400'
              }`}>
                {result.result.confidence}%
              </div>
              <p className="text-zinc-400 mb-4">{getResultInfo(result.result).subtitle}</p>
              
              {/* Content Type Badge */}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                result.result.content_type === 'opinion' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                result.result.content_type === 'satirical' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                result.result.content_type === 'mixed' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                result.result.content_type === 'unclear' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
              }`}>
                {result.result.content_type?.replace('_', ' ').toUpperCase() || 'FACTUAL CLAIM'}
              </span>
            </div>

            {/* Center: AI Analysis */}
            <div className="lg:col-span-2 p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  <span>AI Analysis Summary</span>
                </h3>
                <button
                  onClick={() => setShowDetailedModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-colors text-sm text-zinc-400 hover:text-white border border-zinc-600 hover:border-zinc-500"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
              </div>
              <div className="bg-zinc-700/30 rounded-xl p-6 border border-zinc-600 mb-6">
                <p className="text-zinc-200 leading-relaxed">{result.result.summary}</p>
              </div>

              {/* Enhanced Feedback Enhancement Section */}
              {(result.result.analysis_badges && result.result.analysis_badges.length > 0) || result.result.confidence_adjusted || result.result.opinionContext ? (
                <div className="mb-6 space-y-4">
                  
                  {/* Analysis Badges - Enhanced */}
                  {result.result.analysis_badges && result.result.analysis_badges.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                        <span>Analysis Insights</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.result.analysis_badges.map((badge, index) => (
                          <div key={index} className="group relative">
                            <div className={`p-3 rounded-lg border transition-all hover:shadow-lg ${
                              badge.type === 'warning' ? 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/15' :
                              badge.type === 'caution' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/15' :
                              'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/15'
                            }`}>
                              <div className="flex items-center space-x-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  badge.type === 'warning' ? 'bg-red-400' :
                                  badge.type === 'caution' ? 'bg-yellow-400' :
                                  'bg-blue-400'
                                }`}></div>
                                <span className="text-xs font-medium">{badge.text}</span>
                              </div>
                              <p className="text-xs opacity-90 ml-4">{badge.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Opinion Context Enhancement */}
                  {result.result.opinionContext && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-300 text-sm font-medium">Community Opinion Analysis</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-zinc-400">Forum Discussions:</span>
                          <span className="text-blue-400 ml-1 font-medium">{result.result.opinionContext.forumDiscussions}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">User Agreement:</span>
                          <span className={`ml-1 font-medium ${
                            result.result.opinionContext.userAgreement === 'high' ? 'text-green-400' :
                            result.result.opinionContext.userAgreement === 'low' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                            {result.result.opinionContext.userAgreement.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {result.result.opinionContext.commonPoints && result.result.opinionContext.commonPoints.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-500/20">
                          <div className="text-zinc-400 text-xs mb-2">Common Discussion Points:</div>
                          <div className="flex flex-wrap gap-2">
                            {result.result.opinionContext.commonPoints.slice(0, 3).map((point: string, index: number) => (
                              <span key={index} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enhanced Confidence Adjustment Notice */}
                  {result.result.confidence_adjusted && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                        <span className="text-amber-300 text-sm font-medium">
                          Confidence Adjusted by Feedback
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                        <div>
                          <span className="text-zinc-400">Original AI:</span>
                          <span className="text-white ml-1 font-medium">{result.result.original_confidence}%</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Final:</span>
                          <span className="text-amber-400 ml-1 font-medium">{result.result.confidence}%</span>
                        </div>
                      </div>
                      <p className="text-amber-200 text-xs leading-relaxed">{result.result.adjustment_reason}</p>
                    </div>
                  )}

                  {/* Feedback Enhancement Status */}
                  {result.result.feedback_enhanced && result.result.learning_insights && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-300 text-sm font-medium">Analysis Enhanced by User Feedback</span>
                      </div>
                      <p className="text-green-200 text-xs mt-1 ml-4">
                        This analysis incorporates insights from community discussions and historical feedback patterns.
                      </p>
                      
                      {/* User Agreement Status */}
                      <div className="mt-2 ml-4">
                        {result.result.learning_insights.agreementRate >= 80 ? (
                          <p className="text-green-300 text-xs">
                            <strong>High user agreement:</strong> {result.result.learning_insights.agreementRate}% of users agree with this assessment
                          </p>
                        ) : result.result.learning_insights.agreementRate <= 30 ? (
                          <p className="text-amber-300 text-xs">
                            <strong>Many users disagree:</strong> Only {result.result.learning_insights.agreementRate}% agreement - disputed classification
                          </p>
                        ) : (
                          <p className="text-yellow-300 text-xs">
                            <strong>Mixed user feedback:</strong> {result.result.learning_insights.agreementRate}% agreement - community opinions vary
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Categories */}
              {result.result.categories && result.result.categories.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-blue-400" />
                    <span>Categories</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.result.categories.map((category: string, index: number) => (
                      <span
                        key={index}
                        className="bg-blue-500/10 text-blue-300 px-3 py-1 rounded-lg text-sm border border-blue-500/20"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Feedback and Forum Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {showFeedbackForm && (
            <FeedbackForm newsCheckId={result.id} />
          )}
          {showForumForm && user && (
            <ForumPostForm newsCheckId={result.id} />
          )}
        </div>

        {!user && (
          <div className="mt-6 bg-zinc-800/30 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Join the Community</h3>
            <p className="text-zinc-400 mb-4">Sign up to rate analyses and share insights with fellow fact-checkers</p>
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
    );
  };

  return (
    <div className="min-h-screen bg-[#111114] text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Navigation Header */}
      <div className="relative bg-zinc-900/80 border-b border-zinc-800/50 backdrop-blur-md shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <a href="/" className="group flex items-center space-x-3 text-zinc-400 hover:text-white transition-all duration-300">
                <div className="p-2 rounded-xl bg-zinc-800/50 group-hover:bg-zinc-700/50 border border-zinc-700/50 group-hover:border-zinc-600 transition-all">
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                </div>
                <span className="font-semibold">Back to Home</span>
              </a>
              <div className="w-px h-8 bg-zinc-700/50"></div>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    AI Fact Checker
                  </h1>
                  <p className="text-xs text-zinc-500">Advanced Analysis Engine</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-8 text-sm text-zinc-400">
              <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-300 font-medium">Self-Learning AI</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 rounded-xl border border-green-500/20">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-green-300 font-medium">Real-Time Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Interface */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!showFullResults ? (
          // Side-by-side layout for input and initial results
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Panel - Input Section */}
          <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 p-6 flex flex-col h-full shadow-xl">
            
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-white mb-2">
                Content Analysis
              </h2>
              <p className="text-zinc-400 text-sm">Enter news content below to analyze its credibility with AI</p>
            </div>
            
            <form onSubmit={handleSubmit} className="relative space-y-8 flex-1 flex flex-col">
              {/* Input type toggle */}
              <div className="flex justify-center">
                <div className="bg-zinc-800/60 p-2 rounded-2xl flex border border-zinc-700/50 backdrop-blur-sm shadow-lg">
                  <button
                    type="button"
                    onClick={() => setInputType('text')}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center space-x-3 ${
                      inputType === 'text'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span>Text Analysis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputType('url')}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center space-x-3 ${
                      inputType === 'url'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                    }`}
                  >
                    <Globe className="h-5 w-5" />
                    <span>URL Analysis</span>
                  </button>
                </div>
              </div>

              {/* Input field */}
              {inputType === 'text' ? (
                <div className="flex-1 flex flex-col">
                  <label htmlFor="newsText" className="block font-bold text-white mb-4 text-center text-lg">
                    Enter News Content to Analyze
                  </label>
                  <div className="relative flex-1">
                    <textarea
                      id="newsText"
                      value={newsText}
                      onChange={(e) => setNewsText(e.target.value)}
                      placeholder={!user ? "Please sign in to analyze news content..." : "Paste your news article content here for AI-powered fact-checking..."}
                      className={`w-full p-6 border rounded-2xl text-white placeholder-zinc-500 resize-none flex-1 text-lg leading-relaxed transition-all duration-300 ${
                        !user 
                          ? 'bg-zinc-800/50 border-zinc-700/50 cursor-not-allowed' 
                          : 'bg-zinc-800/60 border-zinc-700/50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm shadow-lg hover:shadow-xl'
                      }`}
                      disabled={isLoading || !user}
                      rows={8}
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-zinc-500">
                      {newsText.length} characters
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <label htmlFor="newsUrl" className="block font-bold text-white mb-4 text-center text-lg">
                    Enter News Article URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                      <Globe className="h-6 w-6 text-zinc-500" />
                    </div>
                    <input
                      id="newsUrl"
                      type="url"
                      value={newsUrl}
                      onChange={(e) => setNewsUrl(e.target.value)}
                      placeholder={!user ? "Please sign in to analyze news URLs..." : "https://example.com/news-article"}
                      className={`w-full pl-16 pr-6 py-6 border rounded-2xl text-white placeholder-zinc-500 text-lg transition-all duration-300 ${
                        !user 
                          ? 'bg-zinc-800/50 border-zinc-700/50 cursor-not-allowed' 
                          : 'bg-zinc-800/60 border-zinc-700/50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm shadow-lg hover:shadow-xl'
                      }`}
                      disabled={isLoading || !user}
                    />
                  </div>
                </div>
              )}

              {/* Submit button */}
              <div className="pt-4">
                {!user ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 text-center backdrop-blur-sm">
                      <div className="flex items-center justify-center mb-3">
                        <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
                          <Shield className="h-6 w-6 text-amber-400" />
                        </div>
                      </div>
                      <p className="text-amber-300 text-lg font-bold mb-2">Authentication Required</p>
                      <p className="text-amber-200 text-sm">Please sign in to access our advanced AI fact-checking service</p>
                    </div>
                    <div className="flex space-x-4">
                      <a
                        href="/auth/login"
                        className="group flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-2xl font-bold text-center transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <span>Sign In</span>
                          <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </a>
                      <a
                        href="/auth/register"
                        className="group flex-1 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 hover:from-green-700 hover:via-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-2xl font-bold text-center transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-green-500/25"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                          <span>Sign Up</span>
                        </div>
                      </a>
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading || (!newsText.trim() && !newsUrl.trim())}
                    className="group relative overflow-hidden w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-zinc-700 disabled:to-zinc-800 disabled:cursor-not-allowed text-white font-bold py-6 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-2xl hover:shadow-blue-500/25 transform hover:scale-[1.02] text-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative flex items-center space-x-3">
                      {isLoading ? (
                        <>
                          <Loader className="h-6 w-6 animate-spin" />
                          <span>Analyzing Content...</span>
                        </>
                      ) : (
                        <>
                          <Search className="h-6 w-6 group-hover:scale-110 transition-transform" />
                          <span>Start AI Analysis</span>
                        </>
                      )}
                    </div>
                  </button>
                )}
              </div>
            </form>

            {/* Error message */}
            {error && (
              <div className="mt-6 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/30">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <p className="text-red-300 font-semibold">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Results Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-md rounded-3xl border border-zinc-700/50 shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl"></div>
            
            {result ? (
              <>
                {/* Results Header */}
                <div className={`relative p-10 text-center border-b border-zinc-700/50 ${getResultColor(result.result)}`}>
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                    getResultInfo(result.result).color === 'red' 
                      ? 'bg-red-500/20 border-2 border-red-500/30' 
                      : getResultInfo(result.result).color === 'green'
                      ? 'bg-green-500/20 border-2 border-green-500/30'
                      : getResultInfo(result.result).color === 'blue'
                      ? 'bg-blue-500/20 border-2 border-blue-500/30'
                      : getResultInfo(result.result).color === 'purple'
                      ? 'bg-purple-500/20 border-2 border-purple-500/30'
                      : getResultInfo(result.result).color === 'yellow'
                      ? 'bg-yellow-500/20 border-2 border-yellow-500/30'
                      : 'bg-gray-500/20 border-2 border-gray-500/30'
                  }`}>
                    {getResultInfo(result.result).icon}
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {getResultInfo(result.result).title}
                  </h2>
                  
                  <div className={`text-5xl font-bold mb-2 ${
                    getResultInfo(result.result).color === 'red' ? 'text-red-400' :
                    getResultInfo(result.result).color === 'green' ? 'text-green-400' :
                    getResultInfo(result.result).color === 'blue' ? 'text-blue-400' :
                    getResultInfo(result.result).color === 'purple' ? 'text-purple-400' :
                    getResultInfo(result.result).color === 'yellow' ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>
                    {result.result.confidence}%
                  </div>
                  <p className="text-zinc-400 text-lg">{getResultInfo(result.result).subtitle}</p>
                  
                  {/* Content Type Badge */}
                  <div className="mt-4 space-y-3">
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        result.result.content_type === 'opinion' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        result.result.content_type === 'satirical' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        result.result.content_type === 'mixed' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        result.result.content_type === 'unclear' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                        'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                      }`}>
                        {result.result.content_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Feedback Enhancement Badges */}
                    {result.result.analysis_badges && result.result.analysis_badges.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {result.result.analysis_badges.map((badge, index) => (
                          <div key={index} className="group relative">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              badge.type === 'warning' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                              badge.type === 'caution' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                              'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {badge.text}
                            </span>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 text-white text-xs rounded-lg border border-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              {badge.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Confidence Adjustment Notice */}
                    {result.result.confidence_adjusted && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-amber-400" />
                          <span className="text-amber-300 text-sm font-medium">
                            Confidence Adjusted: {result.result.original_confidence}% → {result.result.confidence}%
                          </span>
                        </div>
                        <p className="text-amber-200 text-xs mt-1">{result.result.adjustment_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Analysis Content */}
                <div className="relative p-10">
                  {/* AI Analysis */}
                  <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
                          <MessageSquare className="h-6 w-6 text-blue-400" />
                        </div>
                        <span>AI Analysis Summary</span>
                      </h3>
                      <button
                        onClick={() => setShowDetailedModal(true)}
                        className="group flex items-center space-x-2 px-4 py-3 bg-zinc-700/50 hover:bg-zinc-700 rounded-xl transition-all duration-300 text-sm text-zinc-400 hover:text-white border border-zinc-600 hover:border-zinc-500 hover:scale-105"
                      >
                        <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold">View Details</span>
                      </button>
                    </div>
                    <div className="bg-zinc-700/40 rounded-2xl p-8 border border-zinc-600/50 backdrop-blur-sm shadow-xl">
                      <p className="text-zinc-200 leading-relaxed text-lg">{result.result.summary}</p>
                    </div>
                  </div>

                  {/* Categories */}
                  {result.result.categories && result.result.categories.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
                          <Tag className="h-6 w-6 text-blue-400" />
                        </div>
                        <span>Content Categories</span>
                      </h3>
                      <div className="flex flex-wrap gap-4">
                        {result.result.categories.map((category: string, index: number) => (
                          <span
                            key={index}
                            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-300 px-5 py-3 rounded-2xl text-sm font-semibold border border-blue-500/30 hover:border-blue-500/50 transition-all hover:scale-105"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="relative flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-700/20 to-zinc-800/20 rounded-3xl"></div>
                <div className="relative">
                  <div className="inline-block p-4 bg-gradient-to-r from-zinc-600/20 to-zinc-700/20 rounded-xl border border-zinc-600/30 mb-4">
                    <Shield className="h-12 w-12 text-zinc-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-400 mb-3">Ready for Analysis</h3>
                  <p className="text-zinc-500 text-base leading-relaxed max-w-sm">
                    Enter news content or URL in the left panel to get comprehensive AI-powered fact-checking results
                  </p>
                  <div className="mt-8 flex items-center justify-center space-x-4 text-sm text-zinc-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>AI Analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Source Verification</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span>Credibility Score</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        ) : (
          // Full-screen results view
          <div className="animate-fadeInUp">
            <FullScreenResults />
          </div>
        )}

        {/* Forms Section - Only show in side-by-side mode */}
        {!showFullResults && result && (
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
          <div className="mt-8 relative overflow-hidden bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-md rounded-3xl border border-zinc-700/50 p-8 text-center shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="inline-block p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 mb-6">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Join Our Community</h3>
              <p className="text-zinc-400 mb-8 text-lg">Sign up to rate analyses, share insights, and connect with fellow fact-checkers</p>
              <div className="flex justify-center space-x-4">
                <a
                  href="/auth/register"
                  className="group bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 hover:from-green-700 hover:via-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-green-500/25"
                >
                  <div className="flex items-center space-x-2">
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                    <span>Create Account</span>
                  </div>
                </a>
                <a
                  href="/auth/login"
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                >
                  <div className="flex items-center space-x-2">
                    <span>Sign In</span>
                    <ArrowLeft className="h-5 w-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}
      
      {/* Detailed Analysis Modal */}
      <DetailedAnalysisModal />
    </div>
  );
};

export default AnalysisPage;
