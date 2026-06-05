import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { initiateGoogleLogin, handleGoogleCallback } from '../services/authService';
import { initiateMicrosoftLogin, handleMicrosoftCallback } from '../services/msalService';
import { Button } from '../components/Button';

export function LoginScreen() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/inbox', { replace: true });
  }, [user, navigate]);

  // Handle OAuth callbacks on mount
  useEffect(() => {
    async function processCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const path = window.location.pathname;

      // Google callback
      if (code && path.includes('/auth/google/callback')) {
        setIsLoadingGoogle(true);
        try {
          const user = await handleGoogleCallback(code);
          login(user);
          navigate('/inbox', { replace: true });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
          setIsLoadingGoogle(false);
        }
        return;
      }

      // Microsoft callback — MSAL handles the token extraction
      if (path.includes('/auth/microsoft/callback')) {
        setIsMicrosoftLoading(true);
        try {
          const user = await handleMicrosoftCallback();
          if (user) {
            login(user);
            navigate('/inbox', { replace: true });
          } else {
            setIsMicrosoftLoading(false);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
          setIsMicrosoftLoading(false);
        }
      }
    }

    processCallback();
  }, [login, navigate]);

  async function handleGoogleSignIn() {
    setError(null);
    setIsLoadingGoogle(true);
    try {
      await initiateGoogleLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Google sign-in');
      setIsLoadingGoogle(false);
    }
  }

  async function handleMicrosoftSignIn() {
    setError(null);
    setIsMicrosoftLoading(true);
    try {
      await initiateMicrosoftLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Microsoft sign-in');
      setIsMicrosoftLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#F7F7F9]">

      {/* App branding */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Overline label */}
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-5">
          AI Email Assistant
        </p>

        {/* iOS-style gradient icon badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-lg mb-6"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 60%, #4C1D95 100%)' }}>
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <polyline points="2,4 12,13 22,4" />
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight mb-2"
          style={{ background: 'linear-gradient(90deg, #6D28D9 0%, #7C3AED 50%, #9333EA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          MailAssist AI
        </h1>
        <p className="text-sm font-medium text-zinc-400 max-w-[220px] mx-auto leading-relaxed tracking-wide">
          Smarter replies. Zero effort.
        </p>
      </motion.div>

      {/* Sign-in card */}
      <motion.div
        className="w-full max-w-sm bg-white rounded-2xl border border-zinc-100 shadow-xl shadow-zinc-200/60 p-8 space-y-4"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      >
        <p className="text-sm font-semibold text-zinc-700 text-center">Connect your inbox</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <Button
          variant="primary"
          fullWidth
          isLoading={isLoadingGoogle}
          onClick={handleGoogleSignIn}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            className="w-5 h-5"
          />
          Sign in with Google
        </Button>

        <Button
          variant="secondary"
          fullWidth
          isLoading={isMicrosoftLoading}
          onClick={handleMicrosoftSignIn}
        >
          <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
          </svg>
          Sign in with Microsoft
        </Button>

        <p className="text-center text-xs text-zinc-400 pt-1">
          By signing in you grant read and send access to your inbox.{' '}
          <a href="#" className="underline hover:text-zinc-600 transition-colors">Privacy Policy</a>
        </p>
      </motion.div>
    </div>
  );
}
