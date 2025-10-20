import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Lightbulb } from 'lucide-react';

interface ModelInsights {
  model_performance: {
    accuracy: number;
    total_evaluations: number;
    correct_predictions: number;
    overconfident_cases: number;
    underconfident_cases: number;
  };
  feedback_analysis: {
    average_rating: number;
    total_feedback: number;
    trend: string;
    common_issues: string[];
    improvement_suggestions: string[];
  };
  learning_insights: {
    modelPerformance: string;
    keyWeaknesses: string[];
    recommendedActions: string[];
    confidenceCalibration: string;
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
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/30 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center space-x-3">
              <Brain className="h-10 w-10 text-purple-400" />
              <span>AI Model Training Dashboard</span>
            </h1>
            <p className="text-xl text-zinc-400">
              Monitor and improve AI model performance through user feedback analysis
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            <span className="ml-4 text-zinc-300 text-lg">Loading model insights...</span>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={fetchModelInsights}
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : insights ? (
          <div className="space-y-8">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6">
                <h3 className="font-semibold text-zinc-300 mb-2 text-sm uppercase tracking-wider">Model Accuracy</h3>
                <div className="flex items-center space-x-3">
                  <BarChart3 className={`h-6 w-6 ${insights.model_performance.accuracy >= 80 ? 'text-green-400' : insights.model_performance.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'}`} />
                  <p className={`text-3xl font-bold ${insights.model_performance.accuracy >= 80 ? 'text-green-400' : insights.model_performance.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {insights.model_performance.accuracy.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6">
                <h3 className="font-semibold text-zinc-300 mb-2 text-sm uppercase tracking-wider">Total Evaluations</h3>
                <p className="text-3xl font-bold text-white">{insights.model_performance.total_evaluations}</p>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6">
                <h3 className="font-semibold text-zinc-300 mb-2 text-sm uppercase tracking-wider">Avg User Rating</h3>
                <div className="flex items-center space-x-2">
                  <p className="text-3xl font-bold text-blue-400">{insights.feedback_analysis.average_rating.toFixed(1)}</p>
                  <span className="text-zinc-500">/5.0</span>
                </div>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6">
                <h3 className="font-semibold text-zinc-300 mb-2 text-sm uppercase tracking-wider">Feedback Trend</h3>
                <div className="flex items-center space-x-2">
                  <TrendingUp className={`h-5 w-5 ${insights.feedback_analysis.trend === 'improving' ? 'text-green-400' : insights.feedback_analysis.trend === 'declining' ? 'text-red-400' : 'text-yellow-400'}`} />
                  <p className={`text-lg font-semibold capitalize ${insights.feedback_analysis.trend === 'improving' ? 'text-green-400' : insights.feedback_analysis.trend === 'declining' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {insights.feedback_analysis.trend}
                  </p>
                </div>
              </div>
            </div>

            {/* Training Status */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span>Training Status</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${insights.training_status.feedback_enhanced_analyses ? 'bg-green-500/10 border-green-500/20' : 'bg-gray-500/10 border-gray-500/20'}`}>
                  <h3 className="font-medium text-white mb-1">Feedback Enhancement</h3>
                  <p className={`text-sm ${insights.training_status.feedback_enhanced_analyses ? 'text-green-400' : 'text-gray-400'}`}>
                    {insights.training_status.feedback_enhanced_analyses ? 'Active' : 'Insufficient Data'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border ${insights.training_status.confidence_calibration_active ? 'bg-blue-500/10 border-blue-500/20' : 'bg-gray-500/10 border-gray-500/20'}`}>
                  <h3 className="font-medium text-white mb-1">Confidence Calibration</h3>
                  <p className={`text-sm ${insights.training_status.confidence_calibration_active ? 'text-blue-400' : 'text-gray-400'}`}>
                    {insights.training_status.confidence_calibration_active ? 'Active' : 'Need More Feedback'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border ${insights.training_status.ready_for_improvement ? 'bg-purple-500/10 border-purple-500/20' : 'bg-gray-500/10 border-gray-500/20'}`}>
                  <h3 className="font-medium text-white mb-1">Ready for Improvement</h3>
                  <p className={`text-sm ${insights.training_status.ready_for_improvement ? 'text-purple-400' : 'text-gray-400'}`}>
                    {insights.training_status.ready_for_improvement ? 'Yes' : 'Collecting More Data'}
                  </p>
                </div>
              </div>
            </div>

            {/* Learning Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Key Weaknesses */}
              {insights.learning_insights.keyWeaknesses.length > 0 && (
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <span>Key Weaknesses</span>
                  </h2>
                  <ul className="space-y-2">
                    {insights.learning_insights.keyWeaknesses.map((weakness, index) => (
                      <li key={index} className="text-zinc-300 flex items-start space-x-2">
                        <span className="text-yellow-400 mt-1.5">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-blue-400" />
                  <span>Recommendations</span>
                </h2>
                <ul className="space-y-2">
                  {insights.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-zinc-300 flex items-start space-x-2">
                      <span className="text-blue-400 mt-1.5">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Improvement Suggestions */}
            {insights.feedback_analysis.improvement_suggestions.length > 0 && (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6">
                <h2 className="text-lg font-bold text-white mb-4">Active Improvements from User Feedback</h2>
                <div className="space-y-3">
                  {insights.feedback_analysis.improvement_suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                      <p className="text-purple-300 text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
