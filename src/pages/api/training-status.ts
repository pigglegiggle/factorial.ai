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
    // Verify authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get current training status
    const learningInsights = await modelTrainer.getLearningInsights();

    const isTrainingActive = learningInsights.totalFeedback >= 5;
    const hasAccuracyData = learningInsights.totalFeedback >= 10;

    const response = {
      training_active: isTrainingActive,
      accuracy_tracking_active: hasAccuracyData,
      current_status: {
        total_feedback_received: learningInsights.totalFeedback,
        total_analyses_evaluated: learningInsights.totalFeedback,
        current_accuracy: hasAccuracyData ? learningInsights.agreementRate : null,
        model_performance: learningInsights.modelPerformance,
        agreement_rate: learningInsights.agreementRate
      },
      improvements_active: {
        feedback_based_prompts: learningInsights.recommendedActions.length > 0,
        confidence_adjustments: hasAccuracyData,
        pattern_recognition: learningInsights.keyIssues.length > 0
      },
      active_improvements: learningInsights.recommendedActions,
      next_milestone: getNextMilestone(learningInsights.totalFeedback, learningInsights.totalFeedback),
      how_it_works: {
        feedback_integration: "Your ratings and comments help identify common issues and improve analysis accuracy",
        confidence_calibration: "Historical performance data adjusts confidence scores to be more reliable", 
        pattern_learning: "The system learns from mistakes to avoid similar errors in future analyses",
        continuous_improvement: "Each piece of feedback makes the next analysis potentially more accurate"
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Training status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function getNextMilestone(feedbackCount: number, analysisCount: number): string {
  if (feedbackCount < 5) {
    return `Need ${5 - feedbackCount} more feedback entries to activate basic training`;
  }
  if (feedbackCount < 20) {
    return `Need ${20 - feedbackCount} more feedback entries to enable advanced pattern recognition`;
  }
  if (analysisCount < 50) {
    return `Need ${50 - analysisCount} more analyses to enable sophisticated accuracy tracking`;
  }
  if (feedbackCount < 100) {
    return `Need ${100 - feedbackCount} more feedback entries to reach optimal training data threshold`;
  }
  return "Training system is fully optimized! Continue providing feedback to maintain accuracy";
}
