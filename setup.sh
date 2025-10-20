#!/bin/bash

# Fake News Detector - Development Setup Script

echo "🚀 Setting up Fake News Detector with Gemini AI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found!"
    echo "📋 Creating .env.local from example..."
    cp .env.example .env.local
    echo ""
    echo "🔧 Please edit .env.local with your actual values:"
    echo "   1. DATABASE_URL - Your Neon Postgres connection string"
    echo "   2. GEMINI_API_KEY - Your Google Gemini API key"
    echo "   3. JWT_SECRET - A secure random string (32+ characters)"
    echo ""
    echo "📖 See README.md for detailed setup instructions."
    echo ""
    read -p "Press Enter after you've configured .env.local..."
fi

# Check if environment variables are set
if grep -q "your-" .env.local; then
    echo "⚠️  It looks like .env.local still contains example values."
    echo "   Please update it with your actual API keys and database URL."
    echo ""
    read -p "Press Enter when ready to continue..."
fi

# Run build to check for errors
echo "🔨 Running build check..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Setup complete! You can now run:"
    echo "   npm run dev"
    echo ""
    echo "📱 The app will be available at: http://localhost:3000"
    echo ""
    echo "📚 Next steps:"
    echo "   1. Set up your Neon Postgres database (see database/schema.sql)"
    echo "   2. Get your Gemini API key from Google AI Studio"
    echo "   3. Start the development server: npm run dev"
    echo "   4. Create a test account and start checking news!"
    echo ""
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
