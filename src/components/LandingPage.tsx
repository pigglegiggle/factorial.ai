'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { 
  Shield, 
  Zap, 
  TrendingUp, 
  Search,
  Users,
  Globe,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Star,
  Target,
  Brain
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/analyze');
  };

  return (
    <div className="min-h-screen bg-[#111114] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-4 mb-8">
              <Shield className="h-16 w-16 text-blue-400" />
              <h1 className="text-5xl md:text-7xl font-bold">
                <span className="gradient-text">Factorial</span><span className="text-blue-400">.ai</span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-zinc-300 max-w-4xl mx-auto mb-8 leading-relaxed">
              Combat misinformation with advanced AI-powered fact-checking. 
              Get instant credibility analysis backed by real-time source verification.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
              <button
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center space-x-3 shadow-lg hover:shadow-xl"
              >
                <Search className="h-6 w-6" />
                <span>Start Fact-Checking</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors border border-zinc-700">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-6 sm:space-y-0 sm:space-x-12 text-zinc-400">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">95%</div>
                <div className="text-sm">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">10k+</div>
                <div className="text-sm">Articles Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">2s</div>
                <div className="text-sm">Average Analysis Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose Factorial.ai?
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Our AI combines multiple verification methods to deliver the most accurate fact-checking results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 p-8 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                <Brain className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Self-Learning AI</h3>
              <p className="text-zinc-400 leading-relaxed">
                Our AI model continuously improves through user feedback and real-world data, 
                becoming more accurate with every analysis.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 p-8 hover:border-green-500/50 transition-colors">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Real-Time Source Verification</h3>
              <p className="text-zinc-400 leading-relaxed">
                Cross-references claims with credible sources in real-time using advanced 
                Google Search grounding technology.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 p-8 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Confidence Scoring</h3>
              <p className="text-zinc-400 leading-relaxed">
                Get detailed confidence scores with explanations, helping you make 
                informed decisions about information credibility.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 p-8 hover:border-yellow-500/50 transition-colors">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Lightning Fast</h3>
              <p className="text-zinc-400 leading-relaxed">
                Get comprehensive fact-checking results in seconds, not minutes. 
                Perfect for real-time verification needs.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 p-8 hover:border-red-500/50 transition-colors">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Community Driven</h3>
              <p className="text-zinc-400 leading-relaxed">
                Join a community of fact-checkers sharing insights and improving 
                accuracy through collaborative verification.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 p-8 hover:border-cyan-500/50 transition-colors">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Multi-Format Analysis</h3>
              <p className="text-zinc-400 leading-relaxed">
                Analyze text content directly or provide URLs - our AI handles 
                multiple input formats with the same level of accuracy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Our AI follows a sophisticated multi-step process to ensure accurate fact-checking
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-400">1</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Content Analysis</h3>
              <p className="text-zinc-400 text-sm">
                AI reads and understands your provided content or URL
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-400">2</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Source Verification</h3>
              <p className="text-zinc-400 text-sm">
                Cross-references claims with credible sources online
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-400">3</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Assessment</h3>
              <p className="text-zinc-400 text-sm">
                Generates detailed analysis with confidence scoring
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-yellow-400">4</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Results Delivery</h3>
              <p className="text-zinc-400 text-sm">
                Provides clear verdict with detailed explanations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Fight Misinformation?
          </h2>
          <p className="text-xl text-zinc-300 mb-8">
            Join thousands of users who trust Factorial.ai for accurate fact-checking
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-xl font-semibold text-xl transition-colors flex items-center space-x-3 mx-auto shadow-lg hover:shadow-xl"
          >
            <Search className="h-6 w-6" />
            <span>Start Your First Analysis</span>
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
