import { GoogleGenerativeAI } from '@google/generative-ai';
import { FeedbackAnalyzer } from './feedback-analyzer';
import { ModelTrainer } from './model-trainer';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const feedbackAnalyzer = new FeedbackAnalyzer();
const modelTrainer = new ModelTrainer();

export interface GeminiAnalysisResult {
  is_fake: boolean;
  confidence: number;
  explanation: string;
  tags: string[];
  feedback_enhanced: boolean;
  confidence_adjusted?: boolean;
  original_confidence?: number;
  adjustment_reason?: string;
  training_data_used?: {
    feedback_patterns_applied: number;
    accuracy_based_adjustment: boolean;
    recent_feedback_count: number;
    model_performance: number;
  };
  debug_training_info?: {
    training_active: boolean;
    prompt_enhanced: boolean;
    confidence_guidance_applied: boolean;
    performance_context_added: boolean;
    historical_accuracy: number;
    feedback_trend: string;
    suggestion_prompts: string[];
  };
}

export async function analyzeNewsWithGemini(input: string, isUrl: boolean = false): Promise<GeminiAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Get feedback-based improvements and model training insights
    const feedbackAnalysis = await feedbackAnalyzer.analyzeFeedbackPatterns();
    const feedbackStats = await feedbackAnalyzer.getFeedbackStats();
    const accuracyMetrics = await modelTrainer.calculateAccuracyMetrics();
    
    // TEMPORARY DEBUG: Log training data being used
    console.log('🧠 TRAINING DATA BEING USED:');
    console.log('- Feedback patterns found:', feedbackAnalysis.suggestionPrompts.length);
    console.log('- Historical accuracy:', accuracyMetrics.accuracy + '%');
    console.log('- Total training feedback:', feedbackStats.totalFeedback);
    console.log('- Recent trend:', feedbackStats.recentTrend);
    
    // Build enhanced prompt based on feedback insights and training data
    let enhancedInstructions = '';
    let confidenceGuidance = '';
    
    if (feedbackAnalysis.suggestionPrompts.length > 0) {
      enhancedInstructions = `
IMPORTANT - Based on user feedback analysis, please pay special attention to these areas:
${feedbackAnalysis.suggestionPrompts.map(suggestion => `- ${suggestion}`).join('\n')}
`;
      console.log('✅ APPLYING FEEDBACK-BASED IMPROVEMENTS TO PROMPT');
    } else {
      console.log('ℹ️ No feedback patterns to apply yet');
    }

    // Add confidence calibration guidance based on historical performance
    if (accuracyMetrics.totalAnalyses >= 10) {
      if (accuracyMetrics.overconfidentCases > accuracyMetrics.totalAnalyses * 0.15) {
        confidenceGuidance = `
CONFIDENCE GUIDANCE: Recent analysis shows overconfidence in predictions. Be more conservative with confidence scores above 85%.
`;
        console.log('⚠️ APPLYING OVERCONFIDENCE CORRECTION');
      } else if (accuracyMetrics.underconfidentCases > accuracyMetrics.totalAnalyses * 0.20) {
        confidenceGuidance = `
CONFIDENCE GUIDANCE: Analysis shows you can be more confident in well-supported conclusions. Consider higher confidence for clear cases.
`;
        console.log('📈 APPLYING UNDERCONFIDENCE BOOST');
      }
    } else {
      console.log('📊 Not enough data for confidence calibration yet');
    }

    // Add recent performance context
    let performanceContext = '';
    if (feedbackStats.totalFeedback >= 5) {
      performanceContext = `
PERFORMANCE CONTEXT: Recent user feedback average: ${feedbackStats.averageRating.toFixed(1)}/5.0 (${feedbackStats.recentTrend})
This helps you understand how users are rating recent analyses.
`;
      console.log('📊 ADDING PERFORMANCE CONTEXT TO PROMPT');
    } else {
      console.log('📊 Not enough feedback for performance context yet');
    }

    const prompt = `
Analyze the following ${isUrl ? 'news article URL' : 'news text'} for potential misinformation or fake news.

${isUrl ? 'URL:' : 'Text:'} ${input}
${enhancedInstructions}
${confidenceGuidance}
${performanceContext}
Please provide a structured analysis in the following JSON format only (no additional text):

{
  "is_fake": boolean (true if likely fake/misleading, false if likely real/credible),
  "confidence": number (0-100, where 100 is completely confident),
  "explanation": "Detailed explanation of your analysis, including specific reasons why this might be fake or real. Mention any red flags, source credibility, factual inconsistencies, etc.",
  "tags": ["array", "of", "relevant", "tags"] (choose from: politics, health, technology, science, entertainment, sports, business, covid-19, climate, misinformation, satire, conspiracy, or add new relevant ones)
}

Focus on:
- Source credibility and verification
- Factual accuracy and consistency
- Language patterns typical of misinformation
- Bias and sensationalism
- Cross-referencing with known facts
- Logical consistency of claims

Return only valid JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to extract JSON from the response
    let jsonStr = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n/, '').replace(/\n```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n/, '').replace(/\n```$/, '');
    }

    try {
      const analysis: GeminiAnalysisResult = JSON.parse(jsonStr);
      
      // Validate the response structure
      if (typeof analysis.is_fake !== 'boolean' ||
          typeof analysis.confidence !== 'number' ||
          typeof analysis.explanation !== 'string' ||
          !Array.isArray(analysis.tags)) {
        throw new Error('Invalid response structure from Gemini API');
      }

      // Ensure confidence is in valid range
      analysis.confidence = Math.max(0, Math.min(100, analysis.confidence));

      // Apply confidence adjustment based on historical feedback
      const confidenceAdjustment = await modelTrainer.adjustConfidenceBasedOnHistory(
        { ...analysis, feedback_enhanced: feedbackAnalysis.suggestionPrompts.length > 0 },
        input
      );

      // TEMPORARY DEBUG: Show confidence adjustments
      if (confidenceAdjustment.originalConfidence !== confidenceAdjustment.adjustedConfidence) {
        console.log('🎯 CONFIDENCE ADJUSTED BY TRAINING DATA:');
        console.log(`- Original: ${confidenceAdjustment.originalConfidence}%`);
        console.log(`- Adjusted: ${confidenceAdjustment.adjustedConfidence}%`);
        console.log(`- Reason: ${confidenceAdjustment.adjustmentReason}`);
      } else {
        console.log('✅ Confidence maintained (no adjustment needed)');
      }

      return {
        ...analysis,
        confidence: confidenceAdjustment.adjustedConfidence,
        feedback_enhanced: feedbackAnalysis.suggestionPrompts.length > 0,
        confidence_adjusted: confidenceAdjustment.originalConfidence !== confidenceAdjustment.adjustedConfidence,
        original_confidence: confidenceAdjustment.originalConfidence,
        adjustment_reason: confidenceAdjustment.adjustmentReason,
        training_data_used: {
          feedback_patterns_applied: feedbackAnalysis.suggestionPrompts.length,
          accuracy_based_adjustment: accuracyMetrics.totalAnalyses >= 10,
          recent_feedback_count: feedbackStats.totalFeedback,
          model_performance: accuracyMetrics.accuracy
        },
        // TEMPORARY: Add debug info to response
        debug_training_info: {
          training_active: feedbackStats.totalFeedback >= 5,
          prompt_enhanced: enhancedInstructions.length > 0,
          confidence_guidance_applied: confidenceGuidance.length > 0,
          performance_context_added: performanceContext.length > 0,
          historical_accuracy: accuracyMetrics.accuracy,
          feedback_trend: feedbackStats.recentTrend,
          suggestion_prompts: feedbackAnalysis.suggestionPrompts
        }
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      console.error('Raw response:', text);
      
      // Fallback response if JSON parsing fails
      return {
        is_fake: false,
        confidence: 50,
        explanation: 'Unable to properly analyze the content. The AI model response was not in the expected format. Please try again or check the input.',
        tags: ['analysis-error'],
        feedback_enhanced: false
      };
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to analyze news content. Please try again later.');
  }
}

export async function testGeminiConnection(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent("Say 'Hello' in JSON format: {\"message\": \"Hello\"}");
    const response = await result.response;
    return response.text().includes('Hello');
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
}
