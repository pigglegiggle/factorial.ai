# Factorial.ai — AI-Powered Fake News Detector

Factorial.ai is an AI-powered web app that detects misinformation in real time using Google’s Gemini API. It combines automated news verification with a community-driven feedback system, empowering users to discuss, validate, and learn from shared content.


[🌐 Live Demo](https://factorial-ai.sinpw.site)


## 🖼️ App Preview
![Factorial.ai Screenshot](public/screenshot.png)

## 🚀 Features

- **AI-Powered News Detection**: Uses Google Gemini API for intelligent news analysis
- **Latest News Feed**: Real-time updates on trending news and fact checks
- **AI Analysis Progress**: Live tracking of analysis status with progress indicators
- **AI Training Dashboard**: Monitor and improve model performance with training insights
- **User Authentication**: Secure JWT-based authentication system
- **Community Feedback**: Users can rate and comment on analysis results
- **Forum System**: Share results and discuss with the community
- **History Tracking**: Complete history of all news checks with statistics
- **Tag System**: Categorize news by topics and themes
- **Export Functionality**: Export history and feedback as CSV
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Neon Postgres (Serverless)
- **AI**: Google Gemini API
- **News Data**: NewsAPI for real-time news updates
- **Authentication**: JWT tokens with bcrypt password hashing
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ and npm
- Neon Postgres account (free tier available)
- Google Gemini API key
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/pigglegiggle/factorial.ai.git
cd factorial.ai
npm install
```

### 2. Database Setup

1. Create a Neon Postgres database at [neon.tech](https://neon.tech)
2. Run the database schema:

```bash
# Copy the SQL from database/schema.sql and run it in your Neon SQL editor
# Or use a PostgreSQL client to execute the schema
```

The schema includes:
- Users table with authentication
- News checks with AI analysis results
- Feedback system for community input
- Forum posts and comments
- Tags and tagging system
- Voting system for forum posts

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@your-neon-host/dbname?sslmode=require"

# Google Gemini API
GEMINI_API_KEY="your_gemini_api_key_here"

# NewsAPI
NEWS_API_KEY="your_news_api_here"

# JWT Secret (generate a strong random string)
JWT_SECRET="your_jwt_secret_here"

# Environment
NODE_ENV="development"
```

### 4. Get API Keys

#### Google Gemini API Key:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file

#### News API Key:
1. Go to [News API](https://newsapi.org/)
2. Create new account
3. Copy api key to your `.env.local` file

#### Neon Database URL:
1. Go to your Neon dashboard
2. Copy the connection string from your database
3. Add it to your `.env.local` file

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 Usage Guide

### 1. User Registration & Authentication
- Create an account or sign in at `/auth/register` or `/auth/login`
- JWT-based authentication with token storage
- Profile management via `/api/auth/profile`

### 2. News Analysis
- Enter news text or paste a URL
- AI analyzes content for authenticity
- Receive detailed explanation and confidence score
- Content is automatically tagged by category

### 3. Community Features
- Rate analysis accuracy (1-5 stars)
- Leave comments on results
- Share interesting findings to the forum
- Vote on forum posts (upvote/downvote)
- Filter forum by tags

### 4. History & Analytics
- View all your past news checks
- See personal statistics (fake vs real ratio)
- Export history as CSV
- Track analysis trends over time

### 5. AI Training Dashboard
- Monitor model performance metrics
- Review training progress and accuracy
- Access detailed training logs
- Fine-tune model parameters
- Track improvements over time

### 6. Latest News Feed
- View real-time updates of trending news
- Track ongoing fact-checking progress
- Filter news by categories and sources
- See live AI analysis status indicators
- Get instant notifications for completed analyses

##   API Testing with Postman

### Authentication
```
POST https://factorial-ai.sinpw.site/api/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```
Response includes JWT token for API calls.

### News Analysis
```
POST https://factorial-ai.sinpw.site/api/check-news
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "input_text": "Your news text here"
}
```

### Forum & Feedback
- Create feedback: POST `/api/feedback`
- List forum posts: GET `/api/forum`
- Add comment: POST `/api/forum/{id}/comments`
- Vote: POST `/api/forum/{id}/vote`

Full API documentation and Postman collection available on request.

## 🚀 Deployment

The application is deployed at [https://factorial-ai.sinpw.site](https://factorial-ai.sinpw.site)

### Deploy Your Own Instance

1. **Prepare for deployment**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel

   # Set environment variables in Vercel dashboard
   ```

3. **Set Environment Variables**:
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add all environment variables from `.env.local`

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `JWT_SECRET`
- `NODE_ENV=production`

## 🧪 Testing
### Manual Testing Guide
1. Create a test account
2. Verify login works

### Test News Analysis
1. Log in to your account
2. Try different types of content:
   - Fake Statements
   - Fact Statements
   - Opinions
   - Factual Claims
   - Social media posts
   - URLs from news websites
   - Real news articles

### Test Community Features
1. Submit feedback on analysis results
2. Create forum posts
3. Vote on posts
4. Check your history page

---

Built with ❤️ using Next.js, Gemini AI, and Neon Postgres.
