import { sql } from './database';

interface FeedbackPattern {
  commonIssues: string[];
  averageRating: number;
  totalFeedback: number;
  improvementSuggestions: string[];
}

interface FeedbackAnalysis {
  lowRatedPatterns: string[];
  highRatedPatterns: string[];
  commonMistakes: string[];
  suggestionPrompts: string[];
}

export class FeedbackAnalyzer {
  
  /**
   * Analyze feedback patterns to identify what makes analyses good vs bad
   */
  async analyzeFeedbackPatterns(): Promise<FeedbackAnalysis> {
    try {
      // Get feedback data with analysis results
      const feedbackData = await sql`
        SELECT 
          nf.rating,
          nf.comment,
          nc.result_json,
          nc.input_text,
          nc.input_url,
          nc.confidence,
          nc.is_fake
        FROM news_feedback nf
        JOIN news_checks nc ON nf.news_check_id = nc.id
        WHERE nf.rating IS NOT NULL
        ORDER BY nf.created_at DESC
        LIMIT 500
      `;

      if (feedbackData.length === 0) {
        return {
          lowRatedPatterns: [],
          highRatedPatterns: [],
          commonMistakes: [],
          suggestionPrompts: []
        };
      }

      // Separate high vs low rated feedback
      const lowRated = feedbackData.filter(f => f.rating <= 2);
      const highRated = feedbackData.filter(f => f.rating >= 4);
      
      // Analyze patterns in low-rated analyses
      const lowRatedPatterns = this.extractPatterns(lowRated);
      const highRatedPatterns = this.extractPatterns(highRated);
      
      // Extract common mistake patterns
      const commonMistakes = this.extractCommonMistakes(lowRated);
      
      // Generate improvement suggestions for prompts
      const suggestionPrompts = this.generatePromptImprovements(lowRatedPatterns, commonMistakes);

      return {
        lowRatedPatterns,
        highRatedPatterns,
        commonMistakes,
        suggestionPrompts
      };
    } catch (error) {
      console.error('Error analyzing feedback patterns:', error);
      return {
        lowRatedPatterns: [],
        highRatedPatterns: [],
        commonMistakes: [],
        suggestionPrompts: []
      };
    }
  }

  private extractPatterns(feedbackItems: any[]): string[] {
    const patterns: string[] = [];
    
    feedbackItems.forEach(item => {
      // Check confidence patterns
      if (item.confidence < 60) {
        patterns.push('low_confidence_issues');
      }
      if (item.confidence > 95) {
        patterns.push('overconfident_predictions');
      }
      
      // Check comment patterns for common issues
      const comment = (item.comment || '').toLowerCase();
      if (comment.includes('wrong') || comment.includes('incorrect')) {
        patterns.push('incorrect_classification');
      }
      if (comment.includes('explanation') && (comment.includes('bad') || comment.includes('poor'))) {
        patterns.push('poor_explanation_quality');
      }
      if (comment.includes('source') || comment.includes('credible')) {
        patterns.push('source_verification_issues');
      }
      if (comment.includes('bias') || comment.includes('political')) {
        patterns.push('political_bias_detection');
      }
    });

    // Return unique patterns
    return [...new Set(patterns)];
  }

  private extractCommonMistakes(lowRatedItems: any[]): string[] {
    const mistakes: string[] = [];
    
    lowRatedItems.forEach(item => {
      const result = item.result_json;
      const comment = (item.comment || '').toLowerCase();
      
      // Analyze specific mistake types
      if (result?.confidence > 90 && comment.includes('wrong')) {
        mistakes.push('overconfident_wrong_predictions');
      }
      
      if (result?.explanation && result.explanation.length < 100) {
        mistakes.push('insufficient_explanation_depth');
      }
      
      if (comment.includes('satire') || comment.includes('joke')) {
        mistakes.push('satire_misclassification');
      }
      
      if (comment.includes('context') || comment.includes('missing')) {
        mistakes.push('context_analysis_failure');
      }
    });

    return [...new Set(mistakes)];
  }

  private generatePromptImprovements(lowPatterns: string[], mistakes: string[]): string[] {
    const improvements: string[] = [];
    
    if (lowPatterns.includes('incorrect_classification')) {
      improvements.push('Be extra careful about classification accuracy. Double-check your reasoning before deciding if content is fake or real.');
    }
    
    if (lowPatterns.includes('poor_explanation_quality')) {
      improvements.push('Provide detailed, specific explanations. Include evidence, sources, and clear reasoning for your classification.');
    }
    
    if (lowPatterns.includes('source_verification_issues')) {
      improvements.push('Pay special attention to source credibility. Consider the reputation and track record of news sources.');
    }
    
    if (lowPatterns.includes('political_bias_detection')) {
      improvements.push('Watch for political bias and partisan language. Focus on factual accuracy rather than political alignment.');
    }
    
    if (mistakes.includes('overconfident_wrong_predictions')) {
      improvements.push('Be more conservative with confidence scores. Reserve 95%+ confidence only for extremely clear cases.');
    }
    
    if (mistakes.includes('satire_misclassification')) {
      improvements.push('Carefully distinguish between satire/parody content and actual misinformation. Look for satirical markers and context.');
    }
    
    if (mistakes.includes('context_analysis_failure')) {
      improvements.push('Consider broader context including timing, related events, and potential motivations behind the content.');
    }

    if (mistakes.includes('insufficient_explanation_depth')) {
      improvements.push('Provide more comprehensive explanations. Users want to understand the reasoning behind classifications.');
    }

    return improvements;
  }

  /**
   * Get specific improvement recommendations based on recent patterns
   */
  async getSpecificImprovements(): Promise<{
    priority_focus_areas: string[];
    confidence_guidance: string;
    content_type_focus: string[];
    explanation_improvements: string[];
  }> {
    try {
      const feedbackData = await sql`
        SELECT 
          nf.rating,
          nf.comment,
          nc.result_json,
          nc.confidence,
          nc.is_fake,
          nc.input_text,
          nc.input_url
        FROM news_feedback nf
        JOIN news_checks nc ON nf.news_check_id = nc.id
        WHERE nf.rating IS NOT NULL
          AND nf.created_at >= NOW() - INTERVAL '30 days'
        ORDER BY nf.created_at DESC
        LIMIT 100
      `;

      const lowRated = feedbackData.filter(f => f.rating <= 2);
      const highRated = feedbackData.filter(f => f.rating >= 4);

      // Analyze what types of content are causing issues
      const contentTypeFocus: string[] = [];
      const explanationImprovements: string[] = [];
      
      lowRated.forEach(item => {
        const comment = (item.comment || '').toLowerCase();
        const result = item.result_json;
        
        // Content type analysis
        if (item.input_url && comment.includes('wrong')) {
          contentTypeFocus.push('URL-based analysis needs improvement');
        }
        if (comment.includes('political') || comment.includes('bias')) {
          contentTypeFocus.push('Political content classification');
        }
        if (comment.includes('health') || comment.includes('medical')) {
          contentTypeFocus.push('Health/medical misinformation detection');
        }
        
        // Explanation quality
        if (comment.includes('explanation') || comment.includes('reason')) {
          explanationImprovements.push('More detailed reasoning needed');
        }
        if (comment.includes('source') || comment.includes('evidence')) {
          explanationImprovements.push('Better source verification explanations');
        }
      });

      // Priority focus areas based on frequency
      const priorityAreas: string[] = [];
      if (lowRated.length > feedbackData.length * 0.3) {
        priorityAreas.push('Overall accuracy needs immediate attention');
      }
      if (lowRated.filter(f => f.confidence > 80).length > 3) {
        priorityAreas.push('Overconfidence in incorrect predictions');
      }

      // Confidence guidance
      let confidenceGuidance = 'Maintain current confidence levels';
      const avgLowRatedConfidence = lowRated.reduce((sum, f) => sum + f.confidence, 0) / (lowRated.length || 1);
      const avgHighRatedConfidence = highRated.reduce((sum, f) => sum + f.confidence, 0) / (highRated.length || 1);
      
      if (avgLowRatedConfidence > avgHighRatedConfidence + 10) {
        confidenceGuidance = 'Be more conservative with confidence - lower confidence on uncertain cases';
      } else if (avgHighRatedConfidence > avgLowRatedConfidence + 15) {
        confidenceGuidance = 'Can be more confident when analysis is well-supported';
      }

      return {
        priority_focus_areas: [...new Set(priorityAreas)],
        confidence_guidance: confidenceGuidance,
        content_type_focus: [...new Set(contentTypeFocus)],
        explanation_improvements: [...new Set(explanationImprovements)]
      };

    } catch (error) {
      console.error('Error getting specific improvements:', error);
      return {
        priority_focus_areas: [],
        confidence_guidance: 'Unable to analyze - continue monitoring feedback',
        content_type_focus: [],
        explanation_improvements: []
      };
    }
  }

  /**
   * Get recent feedback statistics to inform analysis quality
   */
  async getFeedbackStats(): Promise<{
    averageRating: number;
    totalFeedback: number;
    recentTrend: 'improving' | 'declining' | 'stable';
  }> {
    try {
      const recentFeedback = await sql`
        SELECT rating, created_at
        FROM news_feedback
        WHERE created_at >= NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
      `;

      if (recentFeedback.length === 0) {
        return { averageRating: 0, totalFeedback: 0, recentTrend: 'stable' };
      }

      const averageRating = recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length;
      
      // Compare recent vs older feedback to determine trend
      const halfPoint = Math.floor(recentFeedback.length / 2);
      const recentHalf = recentFeedback.slice(0, halfPoint);
      const olderHalf = recentFeedback.slice(halfPoint);
      
      const recentAvg = recentHalf.reduce((sum, f) => sum + f.rating, 0) / recentHalf.length;
      const olderAvg = olderHalf.reduce((sum, f) => sum + f.rating, 0) / olderHalf.length;
      
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (recentAvg > olderAvg + 0.2) trend = 'improving';
      else if (recentAvg < olderAvg - 0.2) trend = 'declining';

      return {
        averageRating: Math.round(averageRating * 100) / 100,
        totalFeedback: recentFeedback.length,
        recentTrend: trend
      };
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      return { averageRating: 0, totalFeedback: 0, recentTrend: 'stable' };
    }
  }
}
