import React, { useEffect } from 'react';
import { supabase } from './supabaseClient';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import ThemeToggle from './components/ThemeToggle';
import LandingPage from './pages/LandingPage';
import { BentoGrid } from './features/dashboard/BentoGrid';
import { SearchPage } from './pages/HomePages';
import { CommunityPage } from './pages/CommunityPage';
import { SymptomDetailPage } from './pages/DetailPages';
import { FavoritesPage, RoutinesPage, ProfilePage } from './pages/UserPages';
import { JournalPage } from './pages/JournalPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import UpgradePage from './pages/UpgradePage';
import { SharedResultPage } from './pages/SharedResultPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { useRoutineNotifications } from './hooks/useRoutineNotifications';
import ProtectedRoute from './components/ProtectedRoute';
import { NotificationManager } from './components/NotificationManager';

import { ThemeProvider } from './context/ThemeContext';

import { XPToast } from './components/XPToast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalErrorProvider } from './context/GlobalErrorContext';
import { ConfettiManager } from './components/ConfettiManager';


import { Analytics } from "@vercel/analytics/react"

const App: React.FC = () => {
  // Initialize notification checker
  useRoutineNotifications();
  // Check for auth redirects
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // If user just signed in (e.g. from email link), redirect to home if on landing
      if (event === 'SIGNED_IN' && session) {
        const currentPath = window.location.pathname;
        // Solo redirigir si estamos explícitamente en la landing o login, 
        // y NO en una página compartida o legal.
        const isLanding = currentPath === '/' || currentPath === '/login' || currentPath === '';
        const isPublic = currentPath.includes('/share/') ||
          currentPath.includes('/privacy') ||
          currentPath.includes('/terms');

        if (isLanding && !isPublic) {
          window.location.replace('/home');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  return (
    <ThemeProvider>
      <GlobalErrorProvider>
        <ErrorBoundary>
          <ConfettiManager />
          <XPToast />
          <Analytics />
          <BrowserRouter>
            <div className="min-h-screen ghl-full-screen bg-background-light dark:bg-background-dark text-text-main dark:text-gray-100 transition-colors duration-200 font-sans">
              <NotificationManager />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />

                {/* Protected Routes - User must be logged in */}
                <Route path="/home" element={<ProtectedRoute><BentoGrid /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
                <Route path="/symptom-detail" element={<ProtectedRoute><SymptomDetailPage /></ProtectedRoute>} />
                <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />

                <Route path="/routines" element={<ProtectedRoute><RoutinesPage /></ProtectedRoute>} />
                <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/upgrade" element={<ProtectedRoute><UpgradePage /></ProtectedRoute>} />

                {/* Public Pages */}
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/share/:id" element={<SharedResultPage />} />
              </Routes>
              <Navigation />
            </div>
          </BrowserRouter>
        </ErrorBoundary>
      </GlobalErrorProvider>
    </ThemeProvider>
  );
};

export default App;