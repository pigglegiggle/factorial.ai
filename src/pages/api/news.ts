import { NextApiRequest, NextApiResponse } from 'next';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, category, sortBy = 'publishedAt', pageSize = '20', page = '1' } = req.query;

    // Validate required parameters
    if (!q && !category) {
      return res.status(400).json({ error: 'Query (q) or category parameter is required' });
    }

    // Check if API key exists
    if (!process.env.NEWS_API_KEY) {
      console.error('NEWS_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'News API configuration missing' });
    }

    // Build NewsAPI URL
    let newsApiUrl = 'https://newsapi.org/v2/everything';
    const params = new URLSearchParams();
    
    if (q) {
      params.append('q', q as string);
    }
    
    if (category) {
      params.append('category', category as string);
    }
    
    params.append('sortBy', sortBy as string);
    params.append('pageSize', pageSize as string);
    params.append('page', page as string);
    params.append('language', 'en');
    
    const fullUrl = `${newsApiUrl}?${params.toString()}`;
    
    console.log('📰 Fetching news from:', fullUrl.replace(process.env.NEWS_API_KEY!, '[API_KEY_HIDDEN]'));

    // Make request to NewsAPI
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.NEWS_API_KEY!,
        'User-Agent': 'FakeNewsDetector/1.0',
      },
    });

    if (!response.ok) {
      console.error('NewsAPI Error:', response.status, response.statusText);
      
      if (response.status === 426) {
        return res.status(500).json({ 
          error: 'News service temporarily unavailable',
          details: 'API upgrade required'
        });
      }
      
      if (response.status === 401) {
        return res.status(500).json({ 
          error: 'News service authentication failed',
          details: 'Invalid API credentials'
        });
      }
      
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Too many requests',
          details: 'News API rate limit exceeded'
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to fetch news',
        details: `NewsAPI returned status ${response.status}`
      });
    }

    const data: NewsAPIResponse = await response.json();
    
    // Filter out articles with missing data
    const filteredArticles = data.articles.filter(article => 
      article.title && 
      article.title !== '[Removed]' &&
      article.description && 
      article.description !== '[Removed]' &&
      article.url
    );

    console.log(`✅ Successfully fetched ${filteredArticles.length} news articles`);

    return res.status(200).json({
      status: 'success',
      totalResults: data.totalResults,
      articles: filteredArticles,
      query: q || category,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string)
    });

  } catch (error) {
    console.error('Error in news API:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
