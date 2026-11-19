import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InboxProvider } from './context/InboxContext';
import { LoginScreen } from './screens/LoginScreen';
import { InboxScreen } from './screens/InboxScreen';
import { EmailDetailScreen } from './screens/EmailDetailScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { OfflineBanner } from './components/OfflineBanner';
import { useOnlineStatus } from './hooks/useOnlineStatus';

// Wraps each screen in a consistent fade+slide transition
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Shows loading spinner while auth state is being restored from LocalStorage
function AppLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <div className="text-4xl mb-4">✉️</div>
        <p className="text-zinc-500 text-sm">Loading…</p>
      </div>
    </div>
  );
}

// Redirects to login if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AppLoading />;
  if (!user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

// Redirects to inbox if already authenticated (for login screen)
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AppLoading />;
  if (user) return <Navigate to="/inbox" replace />;

  return <>{children}</>;
}

// Shown on every screen while the no-sign-in sample inbox is open
function DemoBanner() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user?.isDemo) return null;

  return (
    <div className="bg-violet-600 px-4 py-2 text-center text-sm text-white" role="status">
      You&apos;re viewing a <strong>sample inbox</strong>. The emails are made up and nothing is sent.{' '}
      <button
        type="button"
        onClick={() => {
          logout();
          navigate('/', { replace: true });
        }}
        className="font-semibold underline underline-offset-2 hover:text-violet-100"
      >
        Exit and connect your own
      </button>
    </div>
  );
}

function AppRoutes() {
  const isOnline = useOnlineStatus();
  const location = useLocation();

  return (
    <>
      {!isOnline && <OfflineBanner />}
      <DemoBanner />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Login and OAuth callback routes */}
          <Route path="/" element={<PublicOnlyRoute><PageTransition><LoginScreen /></PageTransition></PublicOnlyRoute>} />
          <Route path="/auth/google/callback" element={<PageTransition><LoginScreen /></PageTransition>} />
          <Route path="/auth/microsoft/callback" element={<PageTransition><LoginScreen /></PageTransition>} />

          {/* Protected app routes */}
          <Route path="/inbox" element={<ProtectedRoute><PageTransition><InboxScreen /></PageTransition></ProtectedRoute>} />
          <Route path="/email/:id" element={<ProtectedRoute><PageTransition><EmailDetailScreen /></PageTransition></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><PageTransition><SettingsScreen /></PageTransition></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InboxProvider>
          <AppRoutes />
        </InboxProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
