import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { ModelTrainer } from '@/lib/model-trainer';
import { FeedbackAnalyzer } from '@/lib/feedback-analyzer';

const modelTrainer = new ModelTrainer();
const feedbackAnalyzer = new FeedbackAnalyzer();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication (optional - could be admin only)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get comprehensive model training insights
    const [accuracyMetrics, learningInsights, feedbackStats, feedbackPatterns] = await Promise.all([
      modelTrainer.calculateAccuracyMetrics(),
      modelTrainer.getLearningInsights(),
      feedbackAnalyzer.getFeedbackStats(),
      feedbackAnalyzer.analyzeFeedbackPatterns()
    ]);

    const response = {
      model_performance: {
        accuracy: accuracyMetrics.accuracy,
        total_evaluations: accuracyMetrics.totalAnalyses,
        correct_predictions: accuracyMetrics.correctPredictions,
        overconfident_cases: accuracyMetrics.overconfidentCases,
        underconfident_cases: accuracyMetrics.underconfidentCases
      },
      feedback_analysis: {
        average_rating: feedbackStats.averageRating,
        total_feedback: feedbackStats.totalFeedback,
        trend: feedbackStats.recentTrend,
        common_issues: feedbackPatterns.commonMistakes,
        improvement_suggestions: feedbackPatterns.suggestionPrompts
      },
      learning_insights: learningInsights,
      training_status: {
        feedback_enhanced_analyses: feedbackPatterns.suggestionPrompts.length > 0,
        confidence_calibration_active: accuracyMetrics.totalAnalyses >= 10,
        ready_for_improvement: feedbackStats.totalFeedback >= 20
      },
      recommendations: generateRecommendations(accuracyMetrics, feedbackStats, learningInsights)
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Model training insights error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function generateRecommendations(
  accuracyMetrics: any,
  feedbackStats: any,
  learningInsights: any
): string[] {
  const recommendations: string[] = [];

  if (feedbackStats.totalFeedback < 20) {
    recommendations.push('Collect more user feedback to enable advanced training features');
  }

  if (accuracyMetrics.accuracy < 70 && accuracyMetrics.totalAnalyses >= 10) {
    recommendations.push('Model accuracy is below optimal - consider prompt refinements');
  }

  if (feedbackStats.recentTrend === 'declining') {
    recommendations.push('Recent feedback trend is negative - investigate common issues');
  }

  if (accuracyMetrics.overconfidentCases > accuracyMetrics.totalAnalyses * 0.15) {
    recommendations.push('Reduce overconfidence by implementing stricter confidence thresholds');
  }

  if (learningInsights.keyWeaknesses.length === 0 && accuracyMetrics.accuracy > 80) {
    recommendations.push('Model performing well - maintain current training approach');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring feedback to identify improvement opportunities');
  }

  return recommendations;
}
