import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { improvedModelTrainer } from '@/lib/improved-model-trainer';
import { FeedbackAnalyzer } from '@/lib/feedback-analyzer';

const modelTrainer = improvedModelTrainer;
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
    const learningInsights = await modelTrainer.getLearningInsights();

    const response = {
      model_performance: {
        performance_status: learningInsights.modelPerformance,
        agreement_rate: learningInsights.agreementRate,
        total_feedback: learningInsights.totalFeedback,
        accuracy: learningInsights.agreementRate, // Using agreement rate as accuracy proxy
        total_evaluations: learningInsights.totalFeedback,
        correct_predictions: Math.round((learningInsights.agreementRate / 100) * learningInsights.totalFeedback),
        overconfident_cases: learningInsights.keyIssues.filter(issue => issue.includes('disagreement')).length,
        underconfident_cases: 0 // Will implement if needed
      },
      feedback_analysis: {
        key_issues: learningInsights.keyIssues,
        recommended_actions: learningInsights.recommendedActions,
        total_feedback: learningInsights.totalFeedback,
        performance_level: learningInsights.modelPerformance,
        agreement_rate: learningInsights.agreementRate
      },
      learning_insights: learningInsights,
      training_status: {
        feedback_enhanced_analyses: learningInsights.totalFeedback > 0,
        confidence_calibration_active: learningInsights.totalFeedback >= 10,
        ready_for_improvement: learningInsights.totalFeedback >= 20
      },
      recommendations: generateRecommendations(learningInsights)
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Model training insights error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function generateRecommendations(learningInsights: any): string[] {
  const recommendations: string[] = [];

  if (learningInsights.totalFeedback < 20) {
    recommendations.push('Collect more user feedback to enable advanced training features');
  }

  if (learningInsights.agreementRate < 70 && learningInsights.totalFeedback >= 10) {
    recommendations.push('User agreement is below optimal - review analysis approach');
  }

  if (learningInsights.keyIssues.length > 0) {
    recommendations.push('Address identified issues: ' + learningInsights.keyIssues.join(', '));
  }

  if (learningInsights.recommendedActions.length > 0) {
    recommendations.push(...learningInsights.recommendedActions);
  }

  if (learningInsights.modelPerformance === 'Excellent' && learningInsights.agreementRate > 85) {
    recommendations.push('Model performing excellently - maintain current approach');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring feedback to identify improvement opportunities');
  }

  return recommendations;
}
