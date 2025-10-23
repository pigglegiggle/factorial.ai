import React from 'react';
import Link from 'next/link';
import { Shield, Zap, Users, Newspaper, History, ArrowRight, CheckCircle, Brain, Globe, Target, TrendingUp, Star, MessageSquare } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#111114] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="text-center space-y-12">
            {/* Logo and Brand */}
            <div className="space-y-8">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative p-8 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full border-2 border-blue-500/30 backdrop-blur-sm">
                    <Shield className="h-20 w-20 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h1 className="text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-fade-in">
                  Factorial.ai
                </h1>
                <div className="max-w-4xl mx-auto space-y-4">
                  <p className="text-3xl font-bold text-zinc-200">
                    The Future of Fact-Checking
                  </p>
                  <p className="text-xl text-zinc-400 leading-relaxed">
                    Advanced AI-powered news analysis with community-driven learning, real-time verification, and intelligent insights
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <Link 
                href="/" 
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-blue-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative flex items-center space-x-4">
                  <Zap className="h-6 w-6" />
                  <span>Start Analyzing</span>
                  <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              
              <Link 
                href="/forum" 
                className="group bg-zinc-800/60 hover:bg-zinc-700/60 border-2 border-zinc-600 hover:border-zinc-500 text-white px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-110 backdrop-blur-sm"
              >
                <div className="flex items-center space-x-4">
                  <Users className="h-6 w-6" />
                  <span>Join Community</span>
                </div>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-400">10K+</div>
                <div className="text-sm text-zinc-400">News Analyzed</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-400">95%</div>
                <div className="text-sm text-zinc-400">Accuracy Rate</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-purple-400">500+</div>
                <div className="text-sm text-zinc-400">Active Users</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-orange-400">24/7</div>
                <div className="text-sm text-zinc-400">Real-time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 mb-8">
              <Target className="h-8 w-8 text-blue-400" />
            </div>
            <h2 className="text-5xl font-black text-white mb-6">
              Everything You Need
            </h2>
            <p className="text-2xl text-zinc-400 max-w-3xl mx-auto">
              Comprehensive tools for modern fact-checking and news analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Analysis */}
            <Link href="/" className="group">
              <div className="relative overflow-hidden bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm rounded-3xl border border-zinc-700/50 p-10 shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:scale-105 group-hover:border-blue-500/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl w-fit mb-8 group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                    <Brain className="h-12 w-12 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                    Smart AI Analysis
                  </h3>
                  <p className="text-zinc-400 leading-relaxed text-lg mb-6">
                    Advanced semantic understanding with continuous learning from community feedback
                  </p>
                  <div className="flex items-center text-blue-400 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Try Now</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Community Insights */}
            <Link href="/forum" className="group">
              <div className="relative overflow-hidden bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm rounded-3xl border border-zinc-700/50 p-10 shadow-2xl hover:shadow-green-500/10 transition-all duration-500 hover:scale-105 group-hover:border-green-500/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-3xl w-fit mb-8 group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-300">
                    <MessageSquare className="h-12 w-12 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-green-400 transition-colors">
                    Community Insights
                  </h3>
                  <p className="text-zinc-400 leading-relaxed text-lg mb-6">
                    Collaborate with experts, share findings, and build collective intelligence
                  </p>
                  <div className="flex items-center text-green-400 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Join Discussion</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Real-time News */}
            <Link href="/news" className="group">
              <div className="relative overflow-hidden bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm rounded-3xl border border-zinc-700/50 p-10 shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:scale-105 group-hover:border-purple-500/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-3xl w-fit mb-8 group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300">
                    <TrendingUp className="h-12 w-12 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors">
                    Breaking News
                  </h3>
                  <p className="text-zinc-400 leading-relaxed text-lg mb-6">
                    Live updates from thousands of verified sources with instant fact-checking
                  </p>
                  <div className="flex items-center text-purple-400 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Explore News</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Personal Dashboard */}
            <Link href="/history" className="group">
              <div className="relative overflow-hidden bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm rounded-3xl border border-zinc-700/50 p-10 shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:scale-105 group-hover:border-orange-500/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="p-6 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-3xl w-fit mb-8 group-hover:from-orange-500/30 group-hover:to-orange-600/30 transition-all duration-300">
                    <History className="h-12 w-12 text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-orange-400 transition-colors">
                    Your Journey
                  </h3>
                  <p className="text-zinc-400 leading-relaxed text-lg mb-6">
                    Track your fact-checking history and review all your analyzed news articles
                  </p>
                  <div className="flex items-center text-orange-400 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>View History</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>
            </Link>

            {/* AI Dashboard */}
            <Link href="/model-dashboard" className="group">
              <div className="relative overflow-hidden bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm rounded-3xl border border-zinc-700/50 p-10 shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 hover:scale-105 group-hover:border-pink-500/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-transparent rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="p-6 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-3xl w-fit mb-8 group-hover:from-pink-500/30 group-hover:to-pink-600/30 transition-all duration-300">
                    <Star className="h-12 w-12 text-pink-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-pink-400 transition-colors">
                    AI Insights
                  </h3>
                  <p className="text-zinc-400 leading-relaxed text-lg mb-6">
                    Deep analytics on model performance and learning patterns
                  </p>
                  <div className="flex items-center text-pink-400 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>View Analytics</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>
            </Link>

            {/* News Search */}
            <Link href="/news" className="group">
              <div className="relative overflow-hidden bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm rounded-3xl border border-zinc-700/50 p-10 shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500 hover:scale-105 group-hover:border-cyan-500/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="p-6 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-3xl w-fit mb-8 group-hover:from-cyan-500/30 group-hover:to-cyan-600/30 transition-all duration-300">
                    <Globe className="h-12 w-12 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">
                    Global Search
                  </h3>
                  <p className="text-zinc-400 leading-relaxed text-lg mb-6">
                    Search through millions of articles from trusted sources worldwide
                  </p>
                  <div className="flex items-center text-cyan-400 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Start Searching</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="relative py-32 bg-gradient-to-b from-transparent via-zinc-900/10 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl border border-green-500/30 mb-8">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-5xl font-black text-white mb-6">
              Why Factorial.ai?
            </h2>
            <p className="text-2xl text-zinc-400 max-w-3xl mx-auto">
              Leading the revolution in AI-powered fact-checking technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <div className="text-center space-y-6 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative p-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30 w-fit mx-auto">
                  <Brain className="h-16 w-16 text-blue-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white">Advanced AI</h3>
              <p className="text-zinc-400 leading-relaxed text-lg">
                Cutting-edge machine learning algorithms that understand context, nuance, and continuously improve through community feedback
              </p>
            </div>

            <div className="text-center space-y-6 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative p-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full border border-green-500/30 w-fit mx-auto">
                  <Shield className="h-16 w-16 text-green-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white">Trusted Results</h3>
              <p className="text-zinc-400 leading-relaxed text-lg">
                Transparent confidence scores, detailed explanations, and source verification for every analysis
              </p>
            </div>

            <div className="text-center space-y-6 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative p-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30 w-fit mx-auto">
                  <Globe className="h-16 w-16 text-purple-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white">Global Reach</h3>
              <p className="text-zinc-400 leading-relaxed text-lg">
                Access to worldwide news sources, multiple languages, and comprehensive fact-checking databases
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="relative py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="space-y-8">
            <h2 className="text-5xl font-black text-white">
              Ready to Fight Misinformation?
            </h2>
            <p className="text-2xl text-zinc-400 leading-relaxed">
              Join thousands of users who trust Factorial.ai for accurate, reliable fact-checking
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <Link 
                href="/" 
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-16 py-6 rounded-2xl font-bold text-2xl transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-purple-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center space-x-4">
                  <Zap className="h-8 w-8" />
                  <span>Start Now - It's Free</span>
                </div>
              </Link>
              
              <Link 
                href="/forum" 
                className="group text-white px-16 py-6 rounded-2xl font-bold text-2xl transition-all duration-300 hover:scale-110 border-2 border-zinc-600 hover:border-zinc-500 backdrop-blur-sm"
              >
                <div className="flex items-center space-x-4">
                  <Users className="h-8 w-8" />
                  <span>Learn More</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
