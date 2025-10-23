import { GoogleGenerativeAI } from '@google/generative-ai';
import { improvedModelTrainer } from './improved-model-trainer';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const modelTrainer = improvedModelTrainer;

export interface GeminiAnalysisResult {
  is_fake: boolean;
  confidence: number;
  content_type: 'factual_claim' | 'opinion' | 'mixed' | 'satirical' | 'unclear';
  credibility_assessment: 'highly_credible' | 'likely_credible' | 'uncertain' | 'likely_false' | 'highly_false' | 'opinion_based' | 'satirical';
  explanation: string;
  summary: string;
  detailed_analysis: {
    step1_content_analysis: string;
    step2_source_verification: string;
    step3_fact_checking: string;
    step4_credibility_assessment: string;
    step5_final_verdict: string;
  };
  categories: string[];
}

// Fixed categories for consistent classification
export const FIXED_CATEGORIES = [
  'Politics',
  'Health & Medicine', 
  'Science & Technology',
  'Climate & Environment',
  'Business & Economy',
  'Sports',
  'Entertainment',
  'Education',
  'Social Issues',
  'International Affairs',
  'Breaking News',
  'Opinion & Commentary',
  'Satirical Content',
  'Conspiracy Theory',
  'Misinformation',
  'Other'
] as const;

const CONTENT_TYPES = [
  'factual_claim',
  'opinion', 
  'mixed',
  'satirical',
  'unclear'
] as const;

// Helper function to map credibility score to assessment
function mapCredibilityScore(score: number, contentType?: string): string {
  if (contentType === 'opinion') return 'opinion_based';
  if (contentType === 'satirical') return 'satirical';
  if (score >= 80) return 'highly_credible';
  if (score >= 65) return 'likely_credible';
  if (score >= 35) return 'uncertain';
  if (score >= 20) return 'likely_false';
  return 'highly_false';
}

// Helper function to generate contextually appropriate analysis badges
function generateAnalysisBadges(learningInsights: any, rawAnalysis: any) {
  const badges = [];
  const isAuthentic = !rawAnalysis.is_fake;
  const confidence = rawAnalysis.confidence || 50;
  
  // For AUTHENTIC content (GREEN) - show positive badges when users agree
  if (isAuthentic) {
    if (learningInsights.agreementRate >= 75 && learningInsights.totalFeedback > 3) {
      badges.push({
        type: 'info' as const,
        text: 'Community Verified',
        description: `${learningInsights.agreementRate}% of users agree this content is authentic based on ${learningInsights.totalFeedback} feedback entries`
      });
    } else if (learningInsights.agreementRate < 50 && learningInsights.totalFeedback > 5) {
      badges.push({
        type: 'caution' as const,
        text: 'Disputed Classification',
        description: `Only ${learningInsights.agreementRate}% user agreement - content authenticity disputed by community`
      });
    }
  } 
  // For FAKE content (RED) - show warnings when users disagree with fake label
  else {
    if (learningInsights.agreementRate < 50 && learningInsights.totalFeedback > 5) {
      badges.push({
        type: 'warning' as const,
        text: 'Classification Disputed',
        description: `${100 - learningInsights.agreementRate}% of users disagree with fake news classification - may need review`
      });
    } else if (learningInsights.agreementRate >= 75 && learningInsights.totalFeedback > 3) {
      badges.push({
        type: 'info' as const,
        text: 'Community Confirmed',
        description: `${learningInsights.agreementRate}% of users agree this is misinformation based on ${learningInsights.totalFeedback} feedback entries`
      });
    }
  }
  
  // Show performance badges based on overall system health
  if (learningInsights.modelPerformance === 'Excellent') {
    badges.push({
      type: 'info' as const,
      text: 'High Accuracy System',
      description: 'Analysis powered by high-performing AI with excellent track record'
    });
  } else if (learningInsights.modelPerformance === 'Good') {
    badges.push({
      type: 'info' as const,
      text: 'Reliable System',
      description: 'AI system performing well with good community agreement'
    });
  } else if (learningInsights.modelPerformance === 'Fair') {
    badges.push({
      type: 'info' as const,
      text: 'Learning System',
      description: 'AI system actively learning and improving from community feedback'
    });
  } else if (learningInsights.modelPerformance === 'Needs Improvement') {
    badges.push({
      type: 'caution' as const,
      text: 'System Learning',
      description: 'AI system is learning from feedback to improve accuracy'
    });
  }
  
  // Show confidence badges when meaningful
  if (confidence <= 30) {
    badges.push({
      type: 'warning' as const,
      text: 'Low Confidence',
      description: `Analysis confidence: ${confidence}% - Limited evidence available for definitive assessment`
    });
  } else if (confidence >= 85) {
    badges.push({
      type: 'info' as const,
      text: 'High Confidence',
      description: `Analysis confidence: ${confidence}% - Strong indicators support this assessment`
    });
  }
  
  // Show meaningful content-type badges
  const contentType = rawAnalysis.contentType;
  if (contentType === 'mixed') {
    badges.push({
      type: 'caution' as const,
      text: 'Mixed Content Type',
      description: 'Contains both factual claims and opinions - individual statements may vary in credibility'
    });
  } else if (contentType === 'satirical') {
    badges.push({
      type: 'info' as const,
      text: 'Satirical Content',
      description: 'Content identified as satire or humor - not intended as factual information'
    });
  }
  
  // Always ensure at least one badge shows for user engagement
  if (badges.length === 0) {
    badges.push({
      type: 'info' as const,
      text: 'AI Analysis Complete',
      description: 'Content analyzed using multiple verification methods and sources'
    });
  }
  
  return badges;
}

export async function analyzeNewsWithGemini(input: string, isUrl: boolean = false): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Get both global and content-specific insights
    console.log('🔄 Cross-referencing with learning data...');
    const [learningInsights, contentFeedback] = await Promise.all([
      modelTrainer.getLearningInsights(),
      modelTrainer.getContentSpecificFeedback(input)
    ]);
    
    console.log('📊 Learning insights:', {
      modelPerformance: learningInsights.modelPerformance,
      agreementRate: learningInsights.agreementRate + '%',
      totalFeedback: learningInsights.totalFeedback,
      keyIssues: learningInsights.keyIssues.length
    });
    
    console.log('📝 Content-specific feedback:', {
      hasFeedback: contentFeedback.hasFeedback,
      agreementRate: contentFeedback.agreementRate + '%',
      totalComments: contentFeedback.totalFeedback
    });

    const prompt = `
You are an advanced AI content analyzer with comprehensive web search capabilities and access to community feedback data. Analyze the following ${isUrl ? 'news article URL' : 'content'} thoroughly.

${isUrl ? 'URL:' : 'Content:'} ${input}

SEARCH & VERIFICATION INSTRUCTIONS:
- For factual claims: Search for authoritative sources, news outlets, official statements, scientific studies
- For opinions/comparisons (e.g., "Ronaldo vs Messi"): Find statistics, player data, expert opinions, polls, achievements, sports websites
- For current events: Look for recent news reports, official announcements, verified social media
- For controversial topics: Search multiple perspectives and credible sources from different viewpoints
- For sports comparisons: Search for career statistics, trophies won, expert analyses, fan polls, sports journalism
- Always attempt to find at least 2-3 relevant sources when available

LEARNING CONTEXT:
- Model performance: ${learningInsights.modelPerformance}
- User agreement rate: ${learningInsights.agreementRate}% (based on ${learningInsights.totalFeedback} feedback entries)
- Key issues: ${learningInsights.keyIssues.join(', ') || 'None identified'}
- Recommended actions: ${learningInsights.recommendedActions.join(', ') || 'Continue current approach'}

ENHANCED CONTENT TYPE GUIDELINES:
- Factual claims: Specific statements verifiable with evidence (use authoritative sources)
- Opinions: Subjective statements, preferences, comparisons (search for supporting data, expert views, statistics)
- Mixed content: Contains both verifiable facts and subjective opinions
- Satirical content: Humor, parody, obviously exaggerated content
- Unclear content: Ambiguous or insufficient information to categorize

SEARCH STRATEGIES BY CONTENT TYPE:
- Sports comparisons ("Ronaldo vs Messi"): Search for career stats, goals, assists, trophies, Ballon d'Or wins, expert rankings, polls
- Political opinions: Search for voting records, policy positions, expert analysis, polling data
- Product comparisons: Search for reviews, specifications, expert tests, consumer reports
- Entertainment preferences: Search for ratings, box office, critic reviews, audience scores

OPINION ANALYSIS SPECIAL INSTRUCTIONS:
For opinion-based content, focus on:
1. Finding statistical support or counter-evidence
2. Identifying expert consensus or disagreement
3. Noting the subjective nature while providing factual context
4. Acknowledging legitimate differences of opinion
5. Using community discussion insights to understand different perspectives

${learningInsights.keyIssues.length > 0 ? 
  `CONFIDENCE CALIBRATION: Based on recent feedback patterns, consider being more careful with confidence scores. Issues: ${learningInsights.keyIssues.join(', ')}` : 
  'CONFIDENCE CALIBRATION: Current confidence patterns are well-calibrated based on user feedback.'
}

    Return your analysis in this EXACT JSON format:
    {
      "contentType": "${CONTENT_TYPES.join('" | "')}", 
      "headline": "Brief descriptive headline",
      "summary": "2-3 sentence summary",
      "credibilityScore": number between 0-100 (adjusted based on feedback patterns),
      "confidence": number between 0-100 (calibrated using historical feedback data),
      "reasoning": "Detailed explanation incorporating feedback insights",
      "sources": ["source1", "source2"] or ["No verifiable sources found"],
      "redFlags": ["flag1", "flag2"] or [],
      "categories": [select 2-3 most relevant from: ${FIXED_CATEGORIES.map(cat => `"${cat}"`).join(', ')}],
      "verificationStatus": "Verified" | "Partially Verified" | "Unverified" | "Disputed" | "Opinion/Subjective",
      "lastUpdated": "${new Date().toISOString()}"
    }

    Key considerations based on feedback data:
    - Model performance: ${learningInsights.modelPerformance}
    - User agreement rate: ${learningInsights.agreementRate}%
    - Apply careful assessment based on feedback patterns

    Analysis Guidelines:
    - For OPINIONS (like "X is the best"): content_type="opinion", credibility_assessment="opinion_based", is_fake=false
    - For FACTS: Verify against reliable sources, assess accuracy
    - For MIXED: Separate factual claims from opinions in analysis
    - For SATIRICAL: Recognize humor/satire, credibility_assessment="satirical"
    - Be nuanced - not everything is binary true/false

    Select categories from the fixed list only. Choose the most relevant 1-3 categories.
    Return only valid JSON.
    `;

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
      const rawAnalysis: any = JSON.parse(jsonStr);
      
      // Create the proper analysis structure with feedback enhancement
      const analysis = {
        // Map new structure to old structure for backward compatibility
        is_fake: rawAnalysis.credibilityScore < 50,
        confidence: Math.max(0, Math.min(100, rawAnalysis.confidence || 50)),
        content_type: rawAnalysis.contentType || 'unclear',
        credibility_assessment: mapCredibilityScore(rawAnalysis.credibilityScore || 50, rawAnalysis.contentType),
        explanation: rawAnalysis.reasoning || 'No explanation provided',
        summary: rawAnalysis.summary || 'No summary available',
        detailed_analysis: {
          step1_content_analysis: `Content Type: ${rawAnalysis.contentType || 'unclear'}. ${rawAnalysis.summary || ''}`,
          step2_source_verification: rawAnalysis.sources ? `Sources identified: ${rawAnalysis.sources.join(', ')}` : 'No verifiable sources found',
          step3_fact_checking: `Credibility Score: ${rawAnalysis.credibilityScore || 50}/100. ${rawAnalysis.reasoning || ''}`,
          step4_credibility_assessment: `Model performance: ${learningInsights.modelPerformance}. User agreement: ${learningInsights.agreementRate}%`,
          step5_final_verdict: `Final Assessment: ${rawAnalysis.verificationStatus || 'Unverified'} with enhanced confidence analysis`
        },
        categories: rawAnalysis.categories || ['Other'],
        
        // Feedback enhancement fields - use content-specific feedback
        feedback_enhanced: contentFeedback.hasFeedback,
        confidence_adjusted: contentFeedback.hasFeedback && contentFeedback.keyIssues.length > 0,
        original_confidence: rawAnalysis.confidence,
        adjustment_reason: contentFeedback.hasFeedback && contentFeedback.keyIssues.length > 0 ? `Adjusted due to: ${contentFeedback.keyIssues.join(', ')}` : 'No adjustment needed',
        analysis_badges: generateAnalysisBadges(learningInsights, rawAnalysis),
        learning_insights: contentFeedback.hasFeedback ? {
          modelPerformance: learningInsights.modelPerformance,
          agreementRate: contentFeedback.agreementRate,
          totalFeedback: contentFeedback.totalFeedback,
          keyIssues: contentFeedback.keyIssues,
          recommendedActions: []
        } : undefined
      };

      // Apply confidence adjustment if there are content-specific issues
      if (contentFeedback.hasFeedback && contentFeedback.agreementRate < 50) {
        const adjustment = -15; // Be more conservative when users disagree with this specific content
        analysis.confidence = Math.max(10, Math.min(90, analysis.confidence + adjustment));
      } else if (contentFeedback.hasFeedback && contentFeedback.agreementRate > 80) {
        const adjustment = 5; // Slight boost when users strongly agree with this content
        analysis.confidence = Math.max(10, Math.min(95, analysis.confidence + adjustment));
      }

      return analysis;
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      console.error('Raw response:', text);
      
      // Fallback response if JSON parsing fails
      return {
        is_fake: false,
        confidence: 50,
        content_type: 'unclear',
        credibility_assessment: 'uncertain',
        explanation: 'Unable to properly analyze the content. The AI model response was not in the expected format. Please try again or check the input.',
        summary: 'Analysis failed due to technical error.',
        detailed_analysis: {
          step1_content_analysis: 'Could not analyze content structure',
          step2_source_verification: 'Source verification unavailable',
          step3_fact_checking: 'Fact-checking could not be performed',
          step4_credibility_assessment: 'Credibility assessment failed',
          step5_final_verdict: 'Unable to provide verdict due to technical error'
        },
        categories: ['Other']
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
