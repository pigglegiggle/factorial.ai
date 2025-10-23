'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import { Shield, Users, History, LogOut, Menu, X, SearchCheck, Home, Zap, Newspaper, Brain } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-[#111114]/95 border-b border-zinc-800/50 shadow-2xl sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center h-18 pt-2">
          {/* Logo and brand */}
          <div className="flex items-center flex-shrink-0 z-10">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <span className="font-black text-2xl flex items-center space-x-1">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Factorial</span>
                <span className="text-blue-400">.ai</span>
              </span>
            </Link>
          </div>

          {/* Desktop navigation - Absolutely centered */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-2 bg-zinc-900/80 backdrop-blur-md rounded-2xl p-2 border border-zinc-700/50 shadow-2xl">
              <Link 
                href="/" 
                className="text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center min-w-[100px] group border border-transparent hover:border-blue-500/20"
              >
                <Home className='h-4 w-4 me-2 group-hover:text-blue-400 transition-colors' />
                <span className="group-hover:text-blue-400 transition-colors">Home</span>
              </Link>
              <Link 
                href="/analyze" 
                className="text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center min-w-[100px] group border border-transparent hover:border-green-500/20"
              >
                <Zap className='h-4 w-4 me-2 group-hover:text-green-400 transition-colors' />
                <span className="group-hover:text-green-400 transition-colors">Analyze</span>
              </Link>
              <Link 
                href="/forum" 
                className="text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center min-w-[100px] group border border-transparent hover:border-purple-500/20"
              >
                <Users className="h-4 w-4 me-2 group-hover:text-purple-400 transition-colors" />
                <span className="group-hover:text-purple-400 transition-colors">Forum</span>
              </Link>
              <Link 
                href="/news" 
                className="text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center min-w-[100px] group border border-transparent hover:border-cyan-500/20"
              >
                <Newspaper className="h-4 w-4 me-2 group-hover:text-cyan-400 transition-colors" />
                <span className="group-hover:text-cyan-400 transition-colors">News</span>
              </Link>
              {user && (
                <>
                  <Link 
                    href="/history" 
                    className="text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-red-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center min-w-[100px] group border border-transparent hover:border-orange-500/20"
                  >
                    <History className="h-4 w-4 me-2 group-hover:text-orange-400 transition-colors" />
                    <span className="group-hover:text-orange-400 transition-colors">History</span>
                  </Link>
                  <Link 
                    href="/model-dashboard" 
                    className="text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center min-w-[100px] group border border-transparent hover:border-pink-500/20"
                  >
                    <Brain className="h-4 w-4 me-2 group-hover:text-pink-400 transition-colors" />
                    <span className="group-hover:text-pink-400 transition-colors">AI Insights</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* User menu - Right */}
          <div className="hidden md:flex items-center flex-shrink-0 z-10">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="px-4 py-2 bg-zinc-800/60 rounded-xl border border-zinc-700/50 backdrop-blur-sm">
                  <span className="text-sm text-zinc-400">Welcome, <span className="text-white font-semibold">{user.username}</span></span>
                </div>
                <button
                  onClick={handleLogout}
                  className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center space-x-2 text-white shadow-lg hover:shadow-red-500/25 border border-red-500/20"
                >
                  <LogOut className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/auth/login" 
                  className="text-zinc-300 hover:text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-zinc-800/60 border border-transparent hover:border-zinc-600"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/register" 
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 text-white shadow-lg hover:shadow-blue-500/25 border border-blue-500/20 hover:scale-105"
                >
                  <span className="group-hover:text-blue-100 transition-colors">Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-zinc-300 hover:text-white hover:bg-zinc-800/60 p-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-zinc-700/50 backdrop-blur-sm hover:border-zinc-600"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-zinc-800/50 bg-zinc-900/95 backdrop-blur-md shadow-2xl">
            <div className="px-4 pt-4 pb-6 space-y-2">
              <Link 
                href="/" 
                className="text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 flex items-center space-x-3 group border border-transparent hover:border-blue-500/20"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="h-5 w-5 group-hover:text-blue-400 transition-colors" />
                <span className="group-hover:text-blue-400 transition-colors">Home</span>
              </Link>
              <Link 
                href="/analyze" 
                className="text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 flex items-center space-x-3 group border border-transparent hover:border-green-500/20"
                onClick={() => setIsMenuOpen(false)}
              >
                <Zap className="h-5 w-5 group-hover:text-green-400 transition-colors" />
                <span className="group-hover:text-green-400 transition-colors">Analyze</span>
              </Link>
              <Link 
                href="/forum" 
                className="text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 flex items-center space-x-3 group border border-transparent hover:border-purple-500/20"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="h-5 w-5 group-hover:text-purple-400 transition-colors" />
                <span className="group-hover:text-purple-400 transition-colors">Forum</span>
              </Link>
              <Link 
                href="/news" 
                className="text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 flex items-center space-x-3 group border border-transparent hover:border-cyan-500/20"
                onClick={() => setIsMenuOpen(false)}
              >
                <Newspaper className="h-5 w-5 group-hover:text-cyan-400 transition-colors" />
                <span className="group-hover:text-cyan-400 transition-colors">News</span>
              </Link>
              {user && (
                <>
                  <Link 
                    href="/history" 
                    className="text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-red-500/20 block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 flex items-center space-x-3 group border border-transparent hover:border-orange-500/20"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <History className="h-5 w-5 group-hover:text-orange-400 transition-colors" />
                    <span className="group-hover:text-orange-400 transition-colors">History</span>
                  </Link>
                  <Link 
                    href="/model-dashboard" 
                    className="text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 flex items-center space-x-3 group border border-transparent hover:border-pink-500/20"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Brain className="h-5 w-5 group-hover:text-pink-400 transition-colors" />
                    <span className="group-hover:text-pink-400 transition-colors">AI Insights</span>
                  </Link>
                </>
              )}
              
              {/* Mobile Auth Section */}
              <div className="border-t border-zinc-700/50 pt-4 mt-4">
                {user ? (
                  <>
                    <div className="px-4 py-3 text-sm text-zinc-400 bg-zinc-800/60 rounded-xl border border-zinc-700/50 mb-3">
                      Welcome, <span className="text-white font-semibold">{user.username}</span>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="group text-red-300 hover:text-white hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-700/20 block w-full text-left px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 flex items-center space-x-3 border border-transparent hover:border-red-500/20"
                    >
                      <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/auth/login" 
                      className="text-zinc-300 hover:text-white hover:bg-zinc-800/60 block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 border border-transparent hover:border-zinc-600 mb-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link 
                      href="/auth/register" 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25 border border-blue-500/20"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
