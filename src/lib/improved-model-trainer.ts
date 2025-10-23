import { sql } from './database';
import crypto from 'crypto';

// Updated interface to match new gemini structure
interface AnalysisResult {
  is_fake: boolean;
  confidence: number;
  content_type: 'factual_claim' | 'opinion' | 'mixed' | 'satirical' | 'unclear';
  credibility_assessment: 'highly_credible' | 'likely_credible' | 'uncertain' | 'likely_false' | 'highly_false' | 'opinion_based' | 'satirical';
  explanation: string;
  summary: string;
  categories: string[];
  feedback_enhanced?: boolean;
  confidence_adjusted?: boolean;
  original_confidence?: number;
  adjustment_reason?: string;
}

interface ModelPerformance {
  totalAnalyses: number;
  correctPredictions: number;
  accuracy: number;
  overconfidentCases: number;
  underconfidentCases: number;
  confidenceCalibration: Record<string, number>;
  contentTypePerformance: Record<string, { accuracy: number; count: number }>;
}

interface ContentPattern {
  patternHash: string;
  keywords: string[];
  classification: 'fake' | 'real' | 'opinion' | 'satirical';
  confidenceLevel: number;
  evidenceCount: number;
  accuracyRate: number;
}

export class ImprovedModelTrainer {
  
  /**
   * Analyze user comment to understand if they agree with AI assessment
   */
  private async analyzeUserFeedback(
    comment: string, 
    aiClassification: 'fake' | 'real',
    aiConfidence: number
  ): Promise<{
    userAgreesWithAI: boolean;
    confidenceInDisagreement: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    keyPhrases: string[];
  }> {
    const lowerComment = comment.toLowerCase();
    
    // Keywords that indicate agreement with "fake" classification
    const agreeWithFakeKeywords = [
      'fake', 'false', 'misinformation', 'lie', 'not true', 'wrong',
      'bullshit', 'hoax', 'fabricated', 'made up', 'untrue'
    ];
    
    // Keywords that indicate disagreement with "fake" classification (claiming it's real)
    const disagreeWithFakeKeywords = [
      'true', 'real', 'actually happened', 'verified', 'confirmed',
      'fact', 'happened', 'authentic', 'genuine', 'legitimate',
      'actually', 'really', 'indeed', 'definitely'
    ];
    
    // High confidence phrases
    const highConfidenceKeywords = [
      'definitely', 'absolutely', 'certainly', 'without doubt',
      'clearly', 'obviously', 'undoubtedly', 'for sure',
      'many sources', 'verified', 'confirmed', 'proven'
    ];
    
    let userAgreesWithAI = true;
    let confidenceInDisagreement = 50;
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    // Extract key phrases
    const keyPhrases: string[] = [];
    [...agreeWithFakeKeywords, ...disagreeWithFakeKeywords, ...highConfidenceKeywords]
      .forEach(phrase => {
        if (lowerComment.includes(phrase)) {
          keyPhrases.push(phrase);
        }
      });
    
    if (aiClassification === 'fake') {
      // If AI said it's fake, check if user agrees
      const hasAgreeKeywords = agreeWithFakeKeywords.some(keyword => 
        lowerComment.includes(keyword)
      );
      const hasDisagreeKeywords = disagreeWithFakeKeywords.some(keyword => 
        lowerComment.includes(keyword)
      );
      
      if (hasDisagreeKeywords && !hasAgreeKeywords) {
        userAgreesWithAI = false;
        sentiment = 'negative';
      } else if (hasAgreeKeywords) {
        userAgreesWithAI = true;
        sentiment = 'positive';
      }
    } else {
      // If AI said it's real, check if user agrees
      const hasAgreeKeywords = disagreeWithFakeKeywords.some(keyword => 
        lowerComment.includes(keyword)
      );
      const hasDisagreeKeywords = agreeWithFakeKeywords.some(keyword => 
        lowerComment.includes(keyword)
      );
      
      if (hasDisagreeKeywords && !hasAgreeKeywords) {
        userAgreesWithAI = false;
        sentiment = 'negative';
      } else if (hasAgreeKeywords) {
        userAgreesWithAI = true;
        sentiment = 'positive';
      }
    }
    
    // Calculate confidence in disagreement
    if (!userAgreesWithAI) {
      confidenceInDisagreement = 60; // Base disagreement confidence
      
      // Increase if they use high confidence words
      if (highConfidenceKeywords.some(keyword => lowerComment.includes(keyword))) {
        confidenceInDisagreement = Math.min(90, confidenceInDisagreement + 25);
      }
      
      // Increase based on comment length and detail
      if (comment.length > 50) {
        confidenceInDisagreement = Math.min(95, confidenceInDisagreement + 10);
      }
    }
    
    return {
      userAgreesWithAI,
      confidenceInDisagreement,
      sentiment,
      keyPhrases
    };
  }

  /**
   * Analyze forum feedback to understand community sentiment
   */
  private async analyzeForumFeedback(
    comment: string,
    rating: number,
    feedbackType: 'analysis_quality' | 'post_helpfulness' | 'community_value',
    aiClassification: 'fake' | 'real',
    aiConfidence: number
  ): Promise<{
    userAgreesWithAI: boolean;
    confidenceInDisagreement: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    keyPhrases: string[];
    feedbackWeight: number;
  }> {
    const lowerComment = comment.toLowerCase();
    
    // Analyze based on rating first
    let userAgreesWithAI = true;
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let confidenceInDisagreement = 50;
    
    // Rating-based analysis
    if (feedbackType === 'analysis_quality') {
      if (rating <= 2) {
        userAgreesWithAI = false;
        sentiment = 'negative';
        confidenceInDisagreement = 70 + (rating === 1 ? 20 : 10);
      } else if (rating >= 4) {
        userAgreesWithAI = true;
        sentiment = 'positive';
      } else {
        sentiment = 'neutral';
      }
    }
    
    // Comment-based analysis for additional context
    if (comment && comment.trim().length > 0) {
      const analysis = await this.analyzeUserFeedback(comment, aiClassification, aiConfidence);
      
      // Override rating-based analysis if comment provides clear direction
      if (analysis.keyPhrases.length > 0) {
        userAgreesWithAI = analysis.userAgreesWithAI;
        confidenceInDisagreement = Math.max(confidenceInDisagreement, analysis.confidenceInDisagreement);
        sentiment = analysis.sentiment;
      }
    }
    
    // Calculate feedback weight based on type and confidence
    let feedbackWeight = 0.05; // Base weight for forum feedback
    if (feedbackType === 'analysis_quality') {
      feedbackWeight = 0.15; // Higher weight for analysis quality feedback
    } else if (feedbackType === 'community_value') {
      feedbackWeight = 0.08;
    }
    
    // Adjust weight based on disagreement confidence
    if (!userAgreesWithAI) {
      feedbackWeight *= (confidenceInDisagreement / 100);
    }
    
    return {
      userAgreesWithAI,
      confidenceInDisagreement,
      sentiment,
      keyPhrases: comment ? this.extractKeywords(comment) : [],
      feedbackWeight
    };
  }

  /**
   * Store semantic feedback analysis in database
   */
  private async storeFeedbackAnalysis(
    newsCheckId: number,
    userId: number,
    comment: string,
    aiClassification: 'fake' | 'real',
    aiConfidence: number
  ): Promise<void> {
    try {
      const analysis = await this.analyzeUserFeedback(comment, aiClassification, aiConfidence);
      
      // Calculate adjustment weight based on disagreement strength
      let adjustmentWeight = 0.0;
      if (!analysis.userAgreesWithAI) {
        adjustmentWeight = Math.min(0.15, analysis.confidenceInDisagreement / 1000);
      }
      
      await sql`
        INSERT INTO feedback_analysis (
          news_check_id, user_id, user_agrees_with_ai, confidence_in_disagreement,
          comment_sentiment, key_phrases, ai_classification, ai_confidence,
          should_adjust_confidence, adjustment_weight
        ) VALUES (
          ${newsCheckId}, ${userId}, ${analysis.userAgreesWithAI}, 
          ${analysis.confidenceInDisagreement}, ${analysis.sentiment},
          ${analysis.keyPhrases}, ${aiClassification}, ${aiConfidence},
          ${!analysis.userAgreesWithAI}, ${adjustmentWeight}
        )
      `;
      
      console.log(`📝 Stored feedback analysis: User ${analysis.userAgreesWithAI ? 'agrees' : 'disagrees'} with AI (${analysis.confidenceInDisagreement}% confidence)`);
      
    } catch (error) {
      console.error('Error storing feedback analysis:', error);
    }
  }

  /**
   * Store forum feedback analysis in database
   */
  private async storeForumFeedbackAnalysis(
    forumPostId: number,
    userId: number,
    rating: number,
    comment: string,
    feedbackType: string,
    aiClassification: 'fake' | 'real',
    aiConfidence: number
  ): Promise<void> {
    try {
      const analysis = await this.analyzeForumFeedback(
        comment || '', 
        rating, 
        feedbackType as any, 
        aiClassification, 
        aiConfidence
      );
      
      // Store analysis in feedback_analysis table (with forum support after migration)
      await sql`
        INSERT INTO feedback_analysis (
          forum_post_id, user_id, user_agrees_with_ai, confidence_in_disagreement,
          comment_sentiment, key_phrases, ai_classification, ai_confidence,
          should_adjust_confidence, adjustment_weight, feedback_type
        ) VALUES (
          ${forumPostId}, ${userId}, ${analysis.userAgreesWithAI}, 
          ${analysis.confidenceInDisagreement}, ${analysis.sentiment},
          ${analysis.keyPhrases}, ${aiClassification}, ${aiConfidence},
          ${!analysis.userAgreesWithAI}, ${analysis.feedbackWeight}, ${feedbackType}
        )
      `;
      
      console.log(`📝 Stored forum feedback analysis: User ${analysis.userAgreesWithAI ? 'agrees' : 'disagrees'} with AI (${feedbackType}, rating: ${rating})`);
      
    } catch (error) {
      console.error('Error storing forum feedback analysis:', error);
    }
  }

  /**
   * Get current model performance from database
   */
  private async getCurrentModelPerformance(): Promise<ModelPerformance> {
    try {
      const [performance] = await sql`
        SELECT * FROM model_performance 
        WHERE active = true 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      
      if (!performance) {
        // Create initial performance record
        await sql`
          INSERT INTO model_performance (
            total_analyses, correct_predictions, accuracy_percentage,
            overconfident_cases, underconfident_cases, confidence_calibration,
            content_type_performance, active
          ) VALUES (0, 0, 100.00, 0, 0, '{}', '{}', true)
        `;
        
        return {
          totalAnalyses: 0,
          correctPredictions: 0,
          accuracy: 100,
          overconfidentCases: 0,
          underconfidentCases: 0,
          confidenceCalibration: {},
          contentTypePerformance: {}
        };
      }
      
      return {
        totalAnalyses: performance.total_analyses,
        correctPredictions: performance.correct_predictions,
        accuracy: parseFloat(performance.accuracy_percentage),
        overconfidentCases: performance.overconfident_cases,
        underconfidentCases: performance.underconfident_cases,
        confidenceCalibration: performance.confidence_calibration || {},
        contentTypePerformance: performance.content_type_performance || {}
      };
      
    } catch (error) {
      console.error('Error getting model performance:', error);
      return {
        totalAnalyses: 0,
        correctPredictions: 0,
        accuracy: 75, // Conservative default
        overconfidentCases: 0,
        underconfidentCases: 0,
        confidenceCalibration: {},
        contentTypePerformance: {}
      };
    }
  }

  /**
   * Update model performance based on semantic feedback analysis
   */
  private async updateModelPerformance(): Promise<void> {
    try {
      // Get feedback analysis summary (including forum feedback)
      const feedbackSummary = await sql`
        SELECT 
          COUNT(*) as total_feedback,
          COUNT(CASE WHEN user_agrees_with_ai = true THEN 1 END) as agreements,
          COUNT(CASE WHEN user_agrees_with_ai = false THEN 1 END) as disagreements,
          COUNT(CASE WHEN forum_post_id IS NOT NULL THEN 1 END) as forum_feedback_count,
          COUNT(CASE WHEN news_check_id IS NOT NULL THEN 1 END) as news_feedback_count,
          AVG(CASE WHEN user_agrees_with_ai = false THEN confidence_in_disagreement ELSE 0 END) as avg_disagreement_confidence
        FROM feedback_analysis
        WHERE created_at > NOW() - INTERVAL '30 days'
      `;
      
      const summary = feedbackSummary[0];
      const agreementRate = summary.total_feedback > 0 
        ? (summary.agreements / summary.total_feedback) * 100 
        : 100;
      
      // Update model performance
      await sql`
        UPDATE model_performance 
        SET 
          total_analyses = ${summary.total_feedback},
          correct_predictions = ${summary.agreements},
          accuracy_percentage = ${agreementRate},
          updated_at = CURRENT_TIMESTAMP
        WHERE active = true
      `;
      
      console.log(`📊 Updated model performance: ${agreementRate.toFixed(1)}% accuracy over ${summary.total_feedback} feedback entries`);
      
    } catch (error) {
      console.error('Error updating model performance:', error);
    }
  }

  /**
   * Generate content pattern hash for similar content detection
   */
  private generateContentHash(content: string): string {
    // Normalize content for pattern matching
    const normalized = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);
  }

  /**
   * Store or update content pattern
   */
  private async updateContentPattern(
    content: string,
    classification: 'fake' | 'real',
    confidence: number,
    userAgreed: boolean
  ): Promise<void> {
    try {
      const patternHash = this.generateContentHash(content);
      const keywords = this.extractKeywords(content);
      
      // Check if pattern exists
      const [existingPattern] = await sql`
        SELECT * FROM content_patterns WHERE pattern_hash = ${patternHash}
      `;
      
      if (existingPattern) {
        // Update existing pattern
        const newEvidenceCount = existingPattern.evidence_count + 1;
        const newCorrectCount = existingPattern.accuracy_rate * existingPattern.evidence_count / 100 + (userAgreed ? 1 : 0);
        const newAccuracyRate = (newCorrectCount / newEvidenceCount) * 100;
        
        await sql`
          UPDATE content_patterns 
          SET 
            evidence_count = ${newEvidenceCount},
            accuracy_rate = ${newAccuracyRate},
            last_seen = CURRENT_TIMESTAMP,
            confidence_level = ${confidence}
          WHERE pattern_hash = ${patternHash}
        `;
      } else {
        // Create new pattern
        await sql`
          INSERT INTO content_patterns (
            pattern_hash, content_keywords, classification, confidence_level,
            evidence_count, accuracy_rate
          ) VALUES (
            ${patternHash}, ${keywords}, ${classification}, ${confidence},
            1, ${userAgreed ? 100 : 0}
          )
        `;
      }
      
    } catch (error) {
      console.error('Error updating content pattern:', error);
    }
  }

  /**
   * Extract keywords for pattern matching
   */
  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase().match(/\w+/g) || [];
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    
    return words
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 10); // Top 10 keywords
  }

  /**
   * Process forum feedback for a specific post
   */
  async processForumFeedback(
    forumPostId: number,
    userId: number,
    rating: number,
    comment: string,
    feedbackType: string,
    aiClassification: 'fake' | 'real',
    aiConfidence: number
  ): Promise<void> {
    try {
      console.log('🤖 Processing forum feedback for model improvement...');
      
      await this.storeForumFeedbackAnalysis(
        forumPostId,
        userId,
        rating,
        comment,
        feedbackType,
        aiClassification,
        aiConfidence
      );
      
      // Update model performance with new forum feedback
      await this.updateModelPerformance();
      
      console.log(`✅ Forum feedback processed: ${feedbackType} rating ${rating}/5`);
      
    } catch (error) {
      console.error('Error processing forum feedback:', error);
    }
  }

  /**
   * Main enhancement function with improved feedback interpretation
   */
  async enhanceAnalysis(
    inputContent: string,
    result: AnalysisResult,
    newsCheckId?: number,
    userId?: number,
    userFeedback?: { rating: number; comment: string }
  ): Promise<AnalysisResult> {
    try {
      console.log('🤖 Enhanced Model Trainer - Analyzing with improved feedback...');
      
      // Store semantic feedback analysis if provided
      if (userFeedback && newsCheckId && userId) {
        await this.storeFeedbackAnalysis(
          newsCheckId,
          userId,
          userFeedback.comment,
          result.is_fake ? 'fake' : 'real',
          result.confidence
        );
      }
      
      // Get current model performance
      const performance = await this.getCurrentModelPerformance();
      console.log(`📊 Current model accuracy: ${performance.accuracy.toFixed(1)}%`);
      
      // Get semantic feedback for confidence adjustment (including forum feedback)
      const recentFeedback = await sql`
        SELECT 
          user_agrees_with_ai,
          confidence_in_disagreement,
          adjustment_weight,
          ai_classification,
          ai_confidence,
          feedback_type,
          forum_post_id
        FROM feedback_analysis
        WHERE created_at > NOW() - INTERVAL '7 days'
          AND should_adjust_confidence = true
        ORDER BY created_at DESC
        LIMIT 50
      `;
      
      let adjustedConfidence = result.confidence;
      let adjustmentReason = 'No adjustment needed';
      let confidenceAdjusted = false;
      
      // Apply semantic feedback adjustments
      if (recentFeedback.length > 0) {
        const relevantFeedback = recentFeedback.filter(fb => 
          fb.ai_classification === (result.is_fake ? 'fake' : 'real')
        );
        
        if (relevantFeedback.length > 2) {
          const avgDisagreementWeight = relevantFeedback.reduce((sum, fb) => 
            sum + fb.adjustment_weight, 0
          ) / relevantFeedback.length;
          
          const confidenceReduction = avgDisagreementWeight * 100;
          
          if (confidenceReduction > 2) {
            adjustedConfidence = Math.max(45, result.confidence - confidenceReduction);
            adjustmentReason = `Reduced by ${confidenceReduction.toFixed(1)}% based on user disagreement patterns`;
            confidenceAdjusted = true;
            
            console.log(`⬇️ Confidence adjusted: ${result.confidence}% → ${adjustedConfidence.toFixed(1)}%`);
          }
        }
      }
      
      // Update performance metrics
      await this.updateModelPerformance();
      
      // Store content pattern
      if (userFeedback) {
        const userAnalysis = await this.analyzeUserFeedback(
          userFeedback.comment,
          result.is_fake ? 'fake' : 'real',
          result.confidence
        );
        
        await this.updateContentPattern(
          inputContent,
          result.is_fake ? 'fake' : 'real',
          result.confidence,
          userAnalysis.userAgreesWithAI
        );
      }
      
      return {
        ...result,
        confidence: Math.round(adjustedConfidence),
        confidence_adjusted: confidenceAdjusted,
        original_confidence: confidenceAdjusted ? result.confidence : undefined,
        adjustment_reason: confidenceAdjusted ? adjustmentReason : undefined,
        feedback_enhanced: recentFeedback.length > 0
      };
      
    } catch (error) {
      console.error('Error in enhanced analysis:', error);
      return result; // Return original result if enhancement fails
    }
  }

  /**
   * Reset model performance (for recovery from bad training)
   */
  async resetModelPerformance(): Promise<void> {
    try {
      await sql`
        UPDATE model_performance 
        SET 
          total_analyses = 0,
          correct_predictions = 0,
          accuracy_percentage = 85.00,
          overconfident_cases = 0,
          underconfident_cases = 0,
          confidence_calibration = '{}',
          content_type_performance = '{}',
          updated_at = CURRENT_TIMESTAMP
        WHERE active = true
      `;
      
      console.log('🔄 Model performance reset to baseline');
      
    } catch (error) {
      console.error('Error resetting model performance:', error);
    }
  }

  /**
   * Get feedback specific to a piece of content
   */
  async getContentSpecificFeedback(inputText: string): Promise<{
    hasFeedback: boolean;
    agreementRate: number;
    totalFeedback: number;
    keyIssues: string[];
    userComments: string[];
  }> {
    try {
      // Get feedback for similar content by basic text matching
      const feedbackStats = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN fa.user_agrees_with_ai = true THEN 1 END) as agreements,
          COUNT(CASE WHEN fa.user_agrees_with_ai = false THEN 1 END) as disagreements,
          AVG(fa.confidence_in_disagreement) as avg_disagreement_conf
        FROM feedback_analysis fa
        WHERE fa.news_check_id IS NOT NULL
          AND fa.created_at > NOW() - INTERVAL '30 days'
      `;
      
      const stats = feedbackStats[0];
      const agreementRate = stats.total > 0 ? (stats.agreements / stats.total) * 100 : 0;
      
      const keyIssues: string[] = [];
      if (stats.total > 0) {
        if (agreementRate < 30) {
          keyIssues.push('Many users disagree with similar assessments');
        } else if (agreementRate > 80) {
          keyIssues.push('High user agreement with similar assessments');
        } else {
          keyIssues.push('Mixed user feedback on similar content');
        }
      }

      // Get key phrases from recent feedback (simplified)
      const keyPhrases = await sql`
        SELECT fa.key_phrases
        FROM feedback_analysis fa
        WHERE fa.key_phrases IS NOT NULL 
          AND array_length(fa.key_phrases, 1) > 0
          AND fa.created_at > NOW() - INTERVAL '7 days'
        ORDER BY fa.created_at DESC
        LIMIT 5
      `;
      
      return {
        hasFeedback: stats.total > 0,
        agreementRate: Math.round(agreementRate),
        totalFeedback: stats.total,
        keyIssues,
        userComments: keyPhrases.flatMap(row => row.key_phrases || []).filter(phrase => phrase && phrase.trim() !== '').slice(0, 10)
      };
      
    } catch (error) {
      console.error('Error getting content-specific feedback:', error);
      return {
        hasFeedback: false,
        agreementRate: 0,
        totalFeedback: 0,
        keyIssues: [],
        userComments: []
      };
    }
  }

  /**
   * Get learning insights based on semantic analysis
   */
  async getLearningInsights(): Promise<{
    modelPerformance: string;
    agreementRate: number;
    totalFeedback: number;
    keyIssues: string[];
    recommendedActions: string[];
  }> {
    try {
      const performance = await this.getCurrentModelPerformance();
      
      const feedbackStats = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN user_agrees_with_ai = true THEN 1 END) as agreements,
          COUNT(CASE WHEN user_agrees_with_ai = false THEN 1 END) as disagreements,
          COUNT(CASE WHEN forum_post_id IS NOT NULL THEN 1 END) as forum_feedback,
          COUNT(CASE WHEN news_check_id IS NOT NULL THEN 1 END) as news_feedback,
          AVG(confidence_in_disagreement) as avg_disagreement_conf
        FROM feedback_analysis
        WHERE created_at > NOW() - INTERVAL '7 days'
      `;
      
      const stats = feedbackStats[0];
      const agreementRate = stats.total > 0 ? (stats.agreements / stats.total) * 100 : 100;
      
      let modelPerformance = 'Unknown';
      if (agreementRate >= 85) modelPerformance = 'Excellent';
      else if (agreementRate >= 75) modelPerformance = 'Good';
      else if (agreementRate >= 65) modelPerformance = 'Fair';
      else modelPerformance = 'Needs Improvement';
      
      const keyIssues: string[] = [];
      const recommendedActions: string[] = [];
      
      if (agreementRate < 70) {
        keyIssues.push('High user disagreement rate');
        recommendedActions.push('Review recent disagreements for pattern analysis');
      }
      
      if (stats.avg_disagreement_conf > 80) {
        keyIssues.push('Users are very confident in their disagreements');
        recommendedActions.push('Consider additional source verification steps');
      }
      
      return {
        modelPerformance,
        agreementRate: Math.round(agreementRate),
        totalFeedback: stats.total,
        keyIssues,
        recommendedActions
      };
      
    } catch (error) {
      console.error('Error getting learning insights:', error);
      return {
        modelPerformance: 'Error',
        agreementRate: 0,
        totalFeedback: 0,
        keyIssues: ['Unable to analyze performance'],
        recommendedActions: ['Check system logs']
      };
    }
  }
}

export const improvedModelTrainer = new ImprovedModelTrainer();
