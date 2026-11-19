import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { ToneSelector } from '../components/ToneSelector';
import { Button } from '../components/Button';
import { saveDisplayName, loadDisplayName } from '../utils/tokenStorage';
import type { Tone } from '../types/user';

export function SettingsScreen() {
  const navigate = useNavigate();
  const { user, logout, disconnect, updateTone } = useAuth();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [displayName, setDisplayName] = useState<string>(() => loadDisplayName() || user?.name || '');
  const [nameSaved, setNameSaved] = useState(false);

  function handleToneChange(tone: Tone) {
    updateTone(tone);
  }

  function handleDisplayNameSave() {
    saveDisplayName(displayName.trim() || user?.name || '');
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  function handleSignOut() {
    logout();
    navigate('/', { replace: true });
  }

  function handleDisconnect() {
    disconnect();
    navigate('/', { replace: true });
  }

  const providerLabel = user?.provider === 'google' ? 'Google' : 'Microsoft';
  const providerColor = user?.provider === 'google' ? 'text-blue-600' : 'text-blue-500';

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/70 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/inbox')}
            className="p-2 -ml-2 rounded-lg text-zinc-500 hover:bg-zinc-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Back to inbox"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-zinc-900">Settings</h2>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6 pb-12">

        {/* Connected account section */}
        <section>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
            Connected Account
          </h3>
          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-900 text-sm">{user?.email}</p>
                <p className={`text-xs mt-0.5 font-medium ${providerColor}`}>
                  {user?.isDemo ? 'Sample inbox (not a real account)' : `Connected via ${providerLabel}`}
                </p>
              </div>
              <div className="text-2xl" aria-hidden="true">
                {user?.provider === 'google' ? '🔵' : '🟦'}
              </div>
            </div>
            <button
              onClick={() => setShowDisconnectConfirm(true)}
              className="text-sm text-red-500 hover:text-red-600 font-medium min-h-[44px] py-2"
            >
              Disconnect Account
            </button>
          </div>
        </section>

        {/* Display name section */}
        <section>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
            Your Name
          </h3>
          <p className="text-xs text-zinc-400 mb-3">
            Used to sign off AI-generated replies. Defaults to your account name.
          </p>
          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setNameSaved(false); }}
              placeholder={user?.name || 'Your name'}
              className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[44px]"
              aria-label="Display name for AI replies"
            />
            <button
              onClick={handleDisplayNameSave}
              className="text-sm font-medium text-violet-600 hover:text-violet-700 min-h-[44px] py-1"
            >
              {nameSaved ? '✓ Saved' : 'Save Name'}
            </button>
          </div>
        </section>

        {/* Tone settings section */}
        <section>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
            Reply Tone
          </h3>
          <p className="text-xs text-zinc-400 mb-3">
            Choose how the AI sounds when drafting replies. Changes apply to future drafts.
          </p>
          {user && (
            <ToneSelector value={user.tone} onChange={handleToneChange} />
          )}
        </section>

        {/* About section */}
        <section>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
            About
          </h3>
          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600">MailAssist AI</span>
              <span className="text-zinc-400">v1.0.0</span>
            </div>
            <a href="#" className="block text-sm text-violet-600 hover:text-violet-700 underline">
              Privacy Policy
            </a>
          </div>
        </section>

        {/* Sign out button */}
        <Button
          variant="destructive"
          fullWidth
          onClick={() => setShowSignOutConfirm(true)}
        >
          Sign Out
        </Button>
      </main>

      {/* Sign-out confirmation dialog */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div
            key="signout-backdrop"
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-title"
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <h3 id="signout-title" className="text-lg font-bold text-zinc-900">Sign out?</h3>
              <p className="text-sm text-zinc-600">
                You will be returned to the login screen. Your tags, statuses, and tone setting will be saved for when you sign back in.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="destructive" fullWidth onClick={handleSignOut}>
                  Yes, Sign Out
                </Button>
                <Button variant="secondary" fullWidth onClick={() => setShowSignOutConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disconnect confirmation dialog — full data wipe */}
      <AnimatePresence>
        {showDisconnectConfirm && (
          <motion.div
            key="disconnect-backdrop"
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="disconnect-title"
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <h3 id="disconnect-title" className="text-lg font-bold text-zinc-900">Disconnect account?</h3>
              <p className="text-sm text-zinc-600">
                This will sign you out and <strong>permanently delete</strong> all your saved tags, statuses, tone setting, and reply history from this device. This cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="destructive" fullWidth onClick={handleDisconnect}>
                  Yes, Disconnect & Clear All
                </Button>
                <Button variant="secondary" fullWidth onClick={() => setShowDisconnectConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
