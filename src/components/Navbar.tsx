'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import { CheckCircle, Users, History, LogOut, Menu, X, SearchCheck } from 'lucide-react';
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
    <nav className="bg-[#111114] border-b border-zinc-800 shadow-lg sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center flex-shrink-0 z-10">
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="font-bold text-xl">
                <span className="gradient-text">Factorial</span><span className="text-blue-400">.ai</span>
              </span>
            </Link>
          </div>

          {/* Desktop navigation - Absolutely centered */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-1 bg-zinc-900/50 rounded-lg p-1">
              <Link 
                href="/" 
                className="text-zinc-300 hover:text-white hover:bg-zinc-700 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center min-w-[100px]"
              >
                <SearchCheck className='h-4 w-4 me-2' />
                Check News
              </Link>
              <Link 
                href="/forum" 
                className="text-zinc-300 hover:text-white hover:bg-zinc-700 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 min-w-[100px]"
              >
                <Users className="h-4 w-4 me-2" />
                <span>Forum</span>
              </Link>
              {user && (
                <Link 
                  href="/history" 
                  className="text-zinc-300 hover:text-white hover:bg-zinc-700 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 min-w-[100px]"
                >
                  <History className="h-4 w-4 me-2" />
                  <span>History</span>
                </Link>
              )}
            </div>
          </div>

          {/* User menu - Right */}
          <div className="hidden md:flex items-center flex-shrink-0 z-10">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-zinc-400">Welcome, <span className="text-white font-medium">{user.username}</span></span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 text-white"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  href="/auth/login" 
                  className="text-zinc-300 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/register" 
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 text-white shadow-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-zinc-300 hover:text-white hover:bg-zinc-800 p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                href="/" 
                className="text-zinc-300 hover:text-white hover:bg-zinc-700 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Check News
              </Link>
              <Link 
                href="/forum" 
                className="text-zinc-300 hover:text-white hover:bg-zinc-700 block px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="h-5 w-5" />
                <span>Forum</span>
              </Link>
              {user && (
                <Link 
                  href="/history" 
                  className="text-zinc-300 hover:text-white hover:bg-zinc-700 block px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <History className="h-5 w-5" />
                  <span>History</span>
                </Link>
              )}
              
              {/* Mobile Auth Section */}
              <div className="border-t border-zinc-700 pt-2 mt-2">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-sm text-zinc-400">
                      Welcome, <span className="text-white font-medium">{user.username}</span>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="text-red-300 hover:text-white hover:bg-red-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/auth/login" 
                      className="text-zinc-300 hover:text-white hover:bg-zinc-700 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link 
                      href="/auth/register" 
                      className="bg-blue-600 hover:bg-blue-700 text-white block px-3 py-2 rounded-md text-base font-medium transition-colors mt-1"
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
