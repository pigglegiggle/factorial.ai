import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Lightbulb, MessageSquare, Users, Target, Activity, RotateCcw, X } from 'lucide-react';

interface ModelInsights {
  model_performance: {
    performance_status: string;
    agreement_rate: number;
    total_feedback: number;
    accuracy: number;
    total_evaluations: number;
    correct_predictions: number;
    overconfident_cases: number;
    underconfident_cases: number;
  };
  feedback_analysis: {
    key_issues: string[];
    recommended_actions: string[];
    total_feedback: number;
    performance_level: string;
    agreement_rate: number;
  };
  learning_insights: {
    modelPerformance: string;
    agreementRate: number;
    totalFeedback: number;
    keyIssues: string[];
    recommendedActions: string[];
  };
  training_status: {
    feedback_enhanced_analyses: boolean;
    confidence_calibration_active: boolean;
    ready_for_improvement: boolean;
  };
  recommendations: string[];
}

export default function ModelDashboard() {
  const { user, token } = useAuth();
  const [insights, setInsights] = useState<ModelInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');

  useEffect(() => {
    if (!user || !token) return;
    
    fetchModelInsights();
  }, [user, token]);

  const fetchModelInsights = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/model-insights', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      } else {
        setError('Failed to fetch model insights');
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetModel = async () => {
    if (resetConfirmation !== 'RESET MODEL') {
      return;
    }

    try {
      setIsResetting(true);
      const response = await fetch('/api/model-insights/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setShowResetModal(false);
        setResetConfirmation('');
        // Refresh insights after reset
        await fetchModelInsights();
      } else {
        setError('Failed to reset model performance');
      }
    } catch (error) {
      console.error('Error resetting model:', error);
      setError('Network error during reset');
    } finally {
      setIsResetting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#111114] text-white">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-white mb-4">Model Training Dashboard</h1>
            <p className="text-zinc-400">Please log in to view model training insights.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111114] text-white">
      {/* Modern Header */}
      <div className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/20 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl border border-purple-500/20">
                <Brain className="h-12 w-12 text-purple-400" />
              </div>
              <div className="text-left">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  AI Training Dashboard
                </h1>
                <p className="text-lg text-zinc-400 mt-2">
                  Semantic feedback analysis & model performance monitoring
                </p>
              </div>
            </div>
            
            {/* Admin Actions */}
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg border-2 border-red-500/30"
              >
                <RotateCcw className="h-5 w-5" />
                <span>Reset Model</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-2 border-purple-500/20 border-t-purple-400 mx-auto"></div>
              <p className="text-zinc-400 text-lg">Analyzing model performance...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-zinc-900/50 border border-red-500/20 rounded-2xl p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 text-lg mb-6">{error}</p>
            <button 
              onClick={fetchModelInsights}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        ) : insights ? (
          <div className="space-y-12">
            {/* Performance Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* User Agreement Rate */}
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-6 shadow-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-zinc-300 text-sm uppercase tracking-wider">User Agreement</h3>
                </div>
                <div className="space-y-2">
                  <p className={`text-3xl font-bold ${
                    insights.learning_insights.agreementRate >= 85 ? 'text-green-400' : 
                    insights.learning_insights.agreementRate >= 70 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {insights.learning_insights.agreementRate}%
                  </p>
                  <p className="text-xs text-zinc-500">
                    {insights.learning_insights.modelPerformance}
                  </p>
                </div>
              </div>

              {/* Total Feedback */}
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-6 shadow-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-zinc-300 text-sm uppercase tracking-wider">Total Feedback</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-white">{insights.learning_insights.totalFeedback}</p>
                  <p className="text-xs text-zinc-500">Semantic analyses</p>
                </div>
              </div>

              {/* Model Status */}
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-6 shadow-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Target className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-zinc-300 text-sm uppercase tracking-wider">Performance</h3>
                </div>
                <div className="space-y-2">
                  <p className={`text-xl font-bold ${
                    insights.learning_insights.modelPerformance === 'Excellent' ? 'text-green-400' :
                    insights.learning_insights.modelPerformance === 'Good' ? 'text-blue-400' :
                    insights.learning_insights.modelPerformance === 'Fair' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {insights.learning_insights.modelPerformance}
                  </p>
                  <p className="text-xs text-zinc-500">Current rating</p>
                </div>
              </div>

              {/* Training Activity */}
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-6 shadow-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Activity className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-zinc-300 text-sm uppercase tracking-wider">Training Status</h3>
                </div>
                <div className="space-y-2">
                  <p className={`text-lg font-bold ${
                    insights.training_status.ready_for_improvement ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {insights.training_status.ready_for_improvement ? 'Active' : 'Learning'}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {insights.training_status.ready_for_improvement ? 'Ready for updates' : 'Collecting data'}
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Training Status Section */}
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                <CheckCircle className="h-7 w-7 text-green-400" />
                <span>Semantic Feedback Training</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-xl border-2 transition-all ${
                  insights.training_status.feedback_enhanced_analyses 
                    ? 'bg-green-500/10 border-green-500/30 shadow-green-500/10' 
                    : 'bg-zinc-700/30 border-zinc-600/30'
                }`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <MessageSquare className={`h-6 w-6 ${
                      insights.training_status.feedback_enhanced_analyses ? 'text-green-400' : 'text-zinc-500'
                    }`} />
                    <h3 className="font-semibold text-white">Comment Analysis</h3>
                  </div>
                  <p className={`text-sm font-medium ${
                    insights.training_status.feedback_enhanced_analyses ? 'text-green-400' : 'text-zinc-400'
                  }`}>
                    {insights.training_status.feedback_enhanced_analyses ? 'Active & Learning' : 'Needs More Data'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Understanding user disagreement patterns
                  </p>
                </div>

                <div className={`p-6 rounded-xl border-2 transition-all ${
                  insights.training_status.confidence_calibration_active 
                    ? 'bg-blue-500/10 border-blue-500/30 shadow-blue-500/10' 
                    : 'bg-zinc-700/30 border-zinc-600/30'
                }`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <Target className={`h-6 w-6 ${
                      insights.training_status.confidence_calibration_active ? 'text-blue-400' : 'text-zinc-500'
                    }`} />
                    <h3 className="font-semibold text-white">Confidence Tuning</h3>
                  </div>
                  <p className={`text-sm font-medium ${
                    insights.training_status.confidence_calibration_active ? 'text-blue-400' : 'text-zinc-400'
                  }`}>
                    {insights.training_status.confidence_calibration_active ? 'Auto-Adjusting' : 'Insufficient Feedback'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Dynamic confidence adjustment
                  </p>
                </div>

                <div className={`p-6 rounded-xl border-2 transition-all ${
                  insights.training_status.ready_for_improvement 
                    ? 'bg-purple-500/10 border-purple-500/30 shadow-purple-500/10' 
                    : 'bg-zinc-700/30 border-zinc-600/30'
                }`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <Brain className={`h-6 w-6 ${
                      insights.training_status.ready_for_improvement ? 'text-purple-400' : 'text-zinc-500'
                    }`} />
                    <h3 className="font-semibold text-white">Model Updates</h3>
                  </div>
                  <p className={`text-sm font-medium ${
                    insights.training_status.ready_for_improvement ? 'text-purple-400' : 'text-zinc-400'
                  }`}>
                    {insights.training_status.ready_for_improvement ? 'Ready for Enhancement' : 'Accumulating Data'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Continuous improvement cycle
                  </p>
                </div>
              </div>
            </div>

            {/* Analysis Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Key Issues */}
              {insights.learning_insights.keyIssues.length > 0 && (
                <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-8 shadow-xl">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-400" />
                    <span>Areas for Improvement</span>
                  </h2>
                  <div className="space-y-4">
                    {insights.learning_insights.keyIssues.map((issue, index) => (
                      <div key={index} className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-zinc-300 leading-relaxed">{issue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-8 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-3">
                  <Lightbulb className="h-6 w-6 text-blue-400" />
                  <span>Smart Recommendations</span>
                </h2>
                <div className="space-y-4">
                  {insights.recommendations.map((recommendation, index) => (
                    <div key={index} className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-zinc-300 leading-relaxed">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Actions */}
            {insights.learning_insights.recommendedActions.length > 0 && (
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-8 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-3">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                  <span>Active Improvements</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.learning_insights.recommendedActions.map((action, index) => (
                    <div key={index} className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                        <p className="text-green-300 font-medium leading-relaxed">{action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Dangerous Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-red-500/20">
            <div className="text-center space-y-6">
              {/* Warning Icon */}
              <div className="p-4 bg-red-500/20 rounded-full w-fit mx-auto border-2 border-red-500/40">
                <AlertTriangle className="h-12 w-12 text-red-400" />
              </div>
              
              {/* Title and Warning */}
              <div>
                <h2 className="text-2xl font-bold text-red-400 mb-3">⚠️ DANGEROUS ACTION</h2>
                <p className="text-zinc-300 leading-relaxed mb-4">
                  This will <strong className="text-red-400">permanently reset</strong> all model performance data, including:
                </p>
                <ul className="text-sm text-zinc-400 text-left space-y-2 bg-zinc-800/50 p-4 rounded-xl border border-red-500/20">
                  <li>• All user feedback analysis</li>
                  <li>• Performance accuracy metrics</li>
                  <li>• Confidence calibration data</li>
                  <li>• Content pattern recognition</li>
                  <li>• Training insights & recommendations</li>
                </ul>
              </div>

              {/* Confirmation Input */}
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  Type <strong className="text-red-400 font-mono">RESET MODEL</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  placeholder="Type 'RESET MODEL' here..."
                  className="w-full p-3 bg-zinc-800/50 border-2 border-red-500/30 rounded-xl text-white placeholder-zinc-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-colors font-mono text-center"
                  disabled={isResetting}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetConfirmation('');
                  }}
                  disabled={isResetting}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetModel}
                  disabled={resetConfirmation !== 'RESET MODEL' || isResetting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2"
                >
                  {isResetting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-5 w-5" />
                      <span>Reset Model</span>
                    </>
                  )}
                </button>
              </div>

              {/* Additional Warning */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-xs text-red-300 leading-relaxed">
                  <strong>⚠️ This action cannot be undone!</strong> The AI will revert to baseline performance and will need to relearn from new user feedback.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
