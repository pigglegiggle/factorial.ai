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
}

export async function analyzeNewsWithGemini(input: string, isUrl: boolean = false): Promise<GeminiAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Get feedback-based improvements
    const feedbackAnalysis = await feedbackAnalyzer.analyzeFeedbackPatterns();
    const feedbackStats = await feedbackAnalyzer.getFeedbackStats();
    
    // Build enhanced prompt based on feedback insights
    let enhancedInstructions = '';
    if (feedbackAnalysis.suggestionPrompts.length > 0) {
      enhancedInstructions = `
IMPORTANT - Based on user feedback analysis, please pay special attention to these areas:
${feedbackAnalysis.suggestionPrompts.map(suggestion => `- ${suggestion}`).join('\n')}
`;
    }

    const prompt = `
Analyze the following ${isUrl ? 'news article URL' : 'news text'} for potential misinformation or fake news.

${isUrl ? 'URL:' : 'Text:'} ${input}
${enhancedInstructions}
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

      return {
        ...analysis,
        confidence: confidenceAdjustment.adjustedConfidence,
        feedback_enhanced: feedbackAnalysis.suggestionPrompts.length > 0,
        confidence_adjusted: confidenceAdjustment.originalConfidence !== confidenceAdjustment.adjustedConfidence,
        original_confidence: confidenceAdjustment.originalConfidence,
        adjustment_reason: confidenceAdjustment.adjustmentReason
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
