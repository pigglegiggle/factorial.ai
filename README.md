# Fake News Detector with Gemini AI

A comprehensive web application that uses Google's Gemini AI to detect fake news, with community feedback and forum features.

## 🚀 Features

- **AI-Powered News Detection**: Uses Google Gemini API for intelligent news analysis
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
git clone <repository-url>
cd my-app
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
- Create an account or sign in
- Secure JWT-based authentication
- Profile management

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

## 🚀 Deployment

### Deploy to Vercel

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

## 🧪 Testing the Application

### Test User Registration
1. Go to `/auth/register`
2. Create a test account
3. Verify login works

### Test News Analysis
1. Log in to your account
2. Try different types of content:
   - Real news articles
   - Satirical content
   - Social media posts
   - URLs from news websites

### Test Community Features
1. Submit feedback on analysis results
2. Create forum posts
3. Vote on posts
4. Check your history page

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed description
4. Include error logs and environment details

---

Built with ❤️ using Next.js, Gemini AI, and Neon Postgres.
