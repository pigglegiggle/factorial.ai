import { sql } from './database';
import { GeminiAnalysisResult } from './gemini';

interface AccuracyMetrics {
  totalAnalyses: number;
  correctPredictions: number;
  accuracy: number;
  overconfidentCases: number;
  underconfidentCases: number;
}

interface ConfidenceAdjustment {
  originalConfidence: number;
  adjustedConfidence: number;
  adjustmentReason: string;
}

export class ModelTrainer {
  
  /**
   * Calculate model accuracy based on user feedback ratings
   * High ratings (4-5) = likely correct, Low ratings (1-2) = likely incorrect
   */
  async calculateAccuracyMetrics(): Promise<AccuracyMetrics> {
    try {
      const feedbackData = await sql`
        SELECT 
          nf.rating,
          nc.confidence,
          nc.is_fake,
          nc.result_json
        FROM news_feedback nf
        JOIN news_checks nc ON nf.news_check_id = nc.id
        WHERE nf.rating IS NOT NULL
        ORDER BY nf.created_at DESC
        LIMIT 1000
      `;

      if (feedbackData.length === 0) {
        return {
          totalAnalyses: 0,
          correctPredictions: 0,
          accuracy: 0,
          overconfidentCases: 0,
          underconfidentCases: 0
        };
      }

      let correctPredictions = 0;
      let overconfidentCases = 0;
      let underconfidentCases = 0;

      feedbackData.forEach(item => {
        const isCorrect = item.rating >= 4; // 4-5 stars = correct prediction
        const confidence = item.confidence;

        if (isCorrect) {
          correctPredictions++;
          if (confidence < 70) underconfidentCases++; // Was right but not confident
        } else {
          if (confidence > 80) overconfidentCases++; // Was wrong but very confident
        }
      });

      return {
        totalAnalyses: feedbackData.length,
        correctPredictions,
        accuracy: (correctPredictions / feedbackData.length) * 100,
        overconfidentCases,
        underconfidentCases
      };
    } catch (error) {
      console.error('Error calculating accuracy metrics:', error);
      return {
        totalAnalyses: 0,
        correctPredictions: 0,
        accuracy: 0,
        overconfidentCases: 0,
        underconfidentCases: 0
      };
    }
  }

  /**
   * Adjust confidence based on historical performance patterns
   */
  async adjustConfidenceBasedOnHistory(
    result: GeminiAnalysisResult,
    inputContent: string
  ): Promise<ConfidenceAdjustment> {
    try {
      const metrics = await this.calculateAccuracyMetrics();
      
      let adjustedConfidence = result.confidence;
      let adjustmentReason = 'No adjustment needed';

      // If model has been overconfident recently, reduce confidence for high predictions
      if (metrics.overconfidentCases > metrics.totalAnalyses * 0.15) { // More than 15% overconfident
        if (result.confidence > 85) {
          adjustedConfidence = Math.max(75, result.confidence - 10);
          adjustmentReason = 'Reduced due to recent overconfidence pattern';
        }
      }

      // If model has been underconfident on correct predictions, boost confidence
      if (metrics.underconfidentCases > metrics.totalAnalyses * 0.20) { // More than 20% underconfident
        if (result.confidence >= 60 && result.confidence < 80) {
          adjustedConfidence = Math.min(85, result.confidence + 8);
          adjustmentReason = 'Increased due to historical underconfidence on correct predictions';
        }
      }

      // If accuracy is very low, be more conservative
      if (metrics.accuracy < 60 && metrics.totalAnalyses > 20) {
        adjustedConfidence = Math.max(50, adjustedConfidence - 15);
        adjustmentReason = 'Conservative adjustment due to low recent accuracy';
      }

      // Check for similar content patterns
      const similarContentAdjustment = await this.adjustBasedOnSimilarContent(
        inputContent, 
        result.is_fake,
        adjustedConfidence
      );
      
      if (similarContentAdjustment !== adjustedConfidence) {
        adjustedConfidence = similarContentAdjustment;
        adjustmentReason += ' + Similar content pattern adjustment';
      }

      return {
        originalConfidence: result.confidence,
        adjustedConfidence: Math.round(adjustedConfidence),
        adjustmentReason
      };
    } catch (error) {
      console.error('Error adjusting confidence:', error);
      return {
        originalConfidence: result.confidence,
        adjustedConfidence: result.confidence,
        adjustmentReason: 'Error in adjustment calculation'
      };
    }
  }

  /**
   * Adjust confidence based on similar content performance
   */
  private async adjustBasedOnSimilarContent(
    inputContent: string,
    isFake: boolean,
    currentConfidence: number
  ): Promise<number> {
    try {
      // Get feedback on similar content (same classification)
      const similarFeedback = await sql`
        SELECT 
          nf.rating,
          nc.confidence,
          nc.input_text,
          nc.input_url
        FROM news_feedback nf
        JOIN news_checks nc ON nf.news_check_id = nc.id
        WHERE nc.is_fake = ${isFake}
          AND nf.rating IS NOT NULL
          AND nf.created_at >= NOW() - INTERVAL '60 days'
        ORDER BY nf.created_at DESC
        LIMIT 100
      `;

      if (similarFeedback.length < 5) return currentConfidence;

      // Calculate average accuracy for similar classifications
      const correctCount = similarFeedback.filter(f => f.rating >= 4).length;
      const similarAccuracy = correctCount / similarFeedback.length;

      // Adjust based on similar content performance
      if (similarAccuracy < 0.6) {
        // Poor performance on similar content - be more conservative
        return Math.max(50, currentConfidence - 10);
      } else if (similarAccuracy > 0.8) {
        // Good performance on similar content - can be more confident
        return Math.min(95, currentConfidence + 5);
      }

      return currentConfidence;
    } catch (error) {
      console.error('Error in similar content analysis:', error);
      return currentConfidence;
    }
  }

  /**
   * Get learning insights for continuous improvement
   */
  async getLearningInsights(): Promise<{
    modelPerformance: string;
    keyWeaknesses: string[];
    recommendedActions: string[];
    confidenceCalibration: string;
  }> {
    try {
      const metrics = await this.calculateAccuracyMetrics();
      
      let modelPerformance = 'Insufficient data';
      const keyWeaknesses: string[] = [];
      const recommendedActions: string[] = [];
      let confidenceCalibration = 'Unknown';

      if (metrics.totalAnalyses >= 10) {
        if (metrics.accuracy >= 80) modelPerformance = 'Excellent';
        else if (metrics.accuracy >= 70) modelPerformance = 'Good';
        else if (metrics.accuracy >= 60) modelPerformance = 'Fair';
        else modelPerformance = 'Poor - needs improvement';

        // Identify weaknesses
        if (metrics.overconfidentCases > metrics.totalAnalyses * 0.1) {
          keyWeaknesses.push('Frequent overconfidence on incorrect predictions');
          recommendedActions.push('Implement stricter confidence thresholds');
        }

        if (metrics.underconfidentCases > metrics.totalAnalyses * 0.15) {
          keyWeaknesses.push('Underconfident on correct predictions');
          recommendedActions.push('Boost confidence for well-supported analyses');
        }

        if (metrics.accuracy < 70) {
          keyWeaknesses.push('Low overall accuracy');
          recommendedActions.push('Review and improve analysis prompts');
          recommendedActions.push('Add more context-aware analysis');
        }

        // Confidence calibration assessment
        const overconfidenceRate = metrics.overconfidentCases / metrics.totalAnalyses;
        const underconfidenceRate = metrics.underconfidentCases / metrics.totalAnalyses;
        
        if (overconfidenceRate > 0.15) confidenceCalibration = 'Overconfident';
        else if (underconfidenceRate > 0.20) confidenceCalibration = 'Underconfident';
        else confidenceCalibration = 'Well-calibrated';
      }

      return {
        modelPerformance,
        keyWeaknesses,
        recommendedActions,
        confidenceCalibration
      };
    } catch (error) {
      console.error('Error getting learning insights:', error);
      return {
        modelPerformance: 'Error',
        keyWeaknesses: ['Unable to analyze performance'],
        recommendedActions: ['Check system logs'],
        confidenceCalibration: 'Unknown'
      };
    }
  }
}
