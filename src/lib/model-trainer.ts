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
      
      // TEMPORARY DEBUG: Log historical data being used
      console.log('📈 HISTORICAL PERFORMANCE DATA:');
      console.log(`- Total analyses with feedback: ${metrics.totalAnalyses}`);
      console.log(`- Accuracy: ${metrics.accuracy.toFixed(1)}%`);
      console.log(`- Overconfident cases: ${metrics.overconfidentCases}`);
      console.log(`- Underconfident cases: ${metrics.underconfidentCases}`);
      
      let adjustedConfidence = result.confidence;
      let adjustmentReason = 'No adjustment needed';

      // If model has been overconfident recently, reduce confidence for high predictions
      if (metrics.overconfidentCases > metrics.totalAnalyses * 0.15) { // More than 15% overconfident
        if (result.confidence > 85) {
          adjustedConfidence = Math.max(75, result.confidence - 10);
          adjustmentReason = 'Reduced due to recent overconfidence pattern';
          console.log('⬇️ REDUCING CONFIDENCE due to overconfidence pattern');
        }
      }

      // If model has been underconfident on correct predictions, boost confidence
      if (metrics.underconfidentCases > metrics.totalAnalyses * 0.20) { // More than 20% underconfident
        if (result.confidence >= 60 && result.confidence < 80) {
          adjustedConfidence = Math.min(85, result.confidence + 8);
          adjustmentReason = 'Increased due to historical underconfidence on correct predictions';
          console.log('⬆️ BOOSTING CONFIDENCE due to underconfidence pattern');
        }
      }

      // If accuracy is very low, be more conservative
      if (metrics.accuracy < 60 && metrics.totalAnalyses > 20) {
        adjustedConfidence = Math.max(50, adjustedConfidence - 15);
        adjustmentReason = 'Conservative adjustment due to low recent accuracy';
        console.log('🚨 CONSERVATIVE ADJUSTMENT due to low accuracy');
      }

      // Check for similar content patterns
      const similarContentAdjustment = await this.adjustBasedOnSimilarContent(
        inputContent, 
        result.is_fake,
        adjustedConfidence
      );
      
      if (similarContentAdjustment !== adjustedConfidence) {
        console.log('🔍 SIMILAR CONTENT ADJUSTMENT applied');
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

      console.log(`🔍 SIMILAR CONTENT ANALYSIS (${isFake ? 'FAKE' : 'REAL'} classification):`);
      console.log(`- Found ${similarFeedback.length} similar analyses with feedback`);

      if (similarFeedback.length < 5) {
        console.log('- Not enough similar content data for adjustment');
        return currentConfidence;
      }

      // Calculate average accuracy for similar classifications
      const correctCount = similarFeedback.filter(f => f.rating >= 4).length;
      const similarAccuracy = correctCount / similarFeedback.length;

      console.log(`- Similar content accuracy: ${(similarAccuracy * 100).toFixed(1)}%`);

      // Adjust based on similar content performance
      if (similarAccuracy < 0.6) {
        // Poor performance on similar content - be more conservative
        console.log('- 📉 Poor performance on similar content - reducing confidence');
        return Math.max(50, currentConfidence - 10);
      } else if (similarAccuracy > 0.8) {
        // Good performance on similar content - can be more confident
        console.log('- 📈 Good performance on similar content - slight confidence boost');
        return Math.min(95, currentConfidence + 5);
      }

      console.log('- ✅ Similar content performance normal - no adjustment');
      return currentConfidence;
    } catch (error) {
      console.error('Error in similar content analysis:', error);
      return currentConfidence;
    }
  }

  /**
   * Log successful analysis for content pattern learning
   */
  async logAnalysisForLearning(
    inputContent: string,
    result: GeminiAnalysisResult,
    userId: number
  ): Promise<void> {
    try {
      // This will be used when feedback comes in to improve future analyses
      // The data is already stored in the database via check-news.ts
      // But we can add additional learning metadata here if needed
      
      console.log(`Analysis logged for learning: ${result.is_fake ? 'FAKE' : 'REAL'} with ${result.confidence}% confidence`);
      
      // Could add additional learning pattern detection here
      // For example, storing key phrases that led to the decision
      const keyPhrases = this.extractKeyPhrases(inputContent);
      
      // This could be expanded to store learning patterns in a separate table
      // For now, the main learning happens through the feedback system
      
    } catch (error) {
      console.error('Error logging analysis for learning:', error);
      // Don't throw as this is supplementary functionality
    }
  }

  /**
   * Extract key phrases that might be relevant for learning
   */
  private extractKeyPhrases(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const keyWords = [
      'breaking', 'exclusive', 'shocking', 'you won\'t believe',
      'doctors hate', 'one simple trick', 'leaked', 'insider',
      'according to sources', 'study shows', 'experts say',
      'fact check', 'verified', 'confirmed'
    ];
    
    return keyWords.filter(word => lowerContent.includes(word));
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
