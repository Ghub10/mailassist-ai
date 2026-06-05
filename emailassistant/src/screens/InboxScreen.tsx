import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cog6ToothIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useInbox } from '../context/InboxContext';
import { useAuth } from '../context/AuthContext';
import { useEmails } from '../hooks/useEmails';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { EmailListItem } from '../components/EmailListItem';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import type { EmailStatus, EmailTag } from '../types/email';

const STATUS_OPTIONS: { value: EmailStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'needs_reply', label: 'Needs Reply' },
  { value: 'replied', label: 'Replied' },
  { value: 'ignored', label: 'Ignored' },
];

const TAG_OPTIONS: { value: EmailTag | 'all'; label: string }[] = [
  { value: 'all', label: 'All Tags' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high_priority', label: 'High Priority' },
  { value: 'client', label: 'Client' },
  { value: 'billing', label: 'Billing' },
  { value: 'low_priority', label: 'Low Priority' },
  { value: 'other', label: 'Other' },
];

export function InboxScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emails, isLoading, error, statusFilter, tagFilter, setStatusFilter, setTagFilter } = useInbox();
  const { fetchEmails } = useEmails();
  const isOnline = useOnlineStatus();

  // Fetch emails on mount
  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Filter and sort emails — urgency 3 first, then 2, then 1/null
  const filteredEmails = emails
    .filter((email) => {
      if (statusFilter !== 'all' && email.status !== statusFilter) return false;
      if (tagFilter !== 'all' && email.tag !== tagFilter) return false;
      return true;
    })
    .sort((a, b) => (b.urgency ?? 0) - (a.urgency ?? 0));

  const hasFilters = statusFilter !== 'all' || tagFilter !== 'all';

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/70 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-zinc-900">✉️ MailAssist AI</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchEmails()}
              disabled={!isOnline || isLoading}
              className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Refresh inbox"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-4">
        {/* Welcome message */}
        {user && (
          <p className="text-sm text-zinc-500 mb-4">
            Signed in as <span className="font-medium text-zinc-700">{user.email}</span>
          </p>
        )}

        {/* Filter row */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EmailStatus | 'all')}
            className="flex-shrink-0 text-sm border border-zinc-200 rounded-lg px-3 py-2 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[40px]"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={tagFilter ?? 'all'}
            onChange={(e) => setTagFilter(e.target.value === 'all' ? 'all' : e.target.value as EmailTag)}
            className="flex-shrink-0 text-sm border border-zinc-200 rounded-lg px-3 py-2 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[40px]"
            aria-label="Filter by tag"
          >
            {TAG_OPTIONS.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value ?? 'all')}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" role="alert">
            <p className="font-semibold mb-1">Could not load emails</p>
            <p>{error}</p>
            <button
              onClick={() => fetchEmails()}
              className="mt-2 text-red-600 underline font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && <LoadingSkeleton rows={5} />}

        {/* Email list */}
        {!isLoading && !error && (
          <>
            {filteredEmails.length === 0 ? (
              hasFilters ? (
                <EmptyState
                  icon="🔍"
                  title="No emails match this filter"
                  subtitle="Try a different filter or clear all filters to see your inbox."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setStatusFilter('all');
                    setTagFilter('all');
                  }}
                />
              ) : (
                <EmptyState
                  icon="🎉"
                  title="You're all caught up!"
                  subtitle="No emails need a reply right now."
                  actionLabel="Refresh Inbox"
                  onAction={() => fetchEmails()}
                />
              )
            ) : (
              <div className="space-y-3">
                {filteredEmails.map((email) => (
                  <EmailListItem
                    key={email.id}
                    email={email}
                    onClick={() => navigate(`/email/${email.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
