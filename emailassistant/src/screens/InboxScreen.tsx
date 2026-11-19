import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cog6ToothIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useInbox } from '../context/InboxContext';
import { useEmails } from '../hooks/useEmails';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { EmailListItem } from '../components/EmailListItem';
import { BrandMark } from '../components/BrandMark';
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

  // Counts shown on the status chips and in the heading
  const statusCounts: Record<EmailStatus | 'all', number> = {
    all: emails.length,
    needs_reply: emails.filter((e) => e.status === 'needs_reply').length,
    replied: emails.filter((e) => e.status === 'replied').length,
    ignored: emails.filter((e) => e.status === 'ignored').length,
  };
  const needsReply = statusCounts.needs_reply;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/70 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1><BrandMark /></h1>
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

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Heading */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Inbox</h2>
          {!isLoading && !error && (
            <p className="text-sm text-zinc-500 mt-0.5">
              {needsReply === 0
                ? "You're all caught up"
                : `${needsReply} ${needsReply === 1 ? 'email needs' : 'emails need'} a reply`}
            </p>
          )}
        </div>

        {/* Filter row: status chips with counts, plus a tag dropdown */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const active = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(opt.value)}
                  className={[
                    'flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 sm:px-3.5 py-1.5 text-sm font-medium min-h-[36px] transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
                    active
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-violet-300 hover:text-violet-700',
                  ].join(' ')}
                >
                  {opt.label}
                  <span className={`text-xs ${active ? 'text-violet-200' : 'text-zinc-400'}`}>
                    {statusCounts[opt.value]}
                  </span>
                </button>
              );
            })}
          </div>

          <select
            value={tagFilter ?? 'all'}
            onChange={(e) => setTagFilter(e.target.value === 'all' ? 'all' : e.target.value as EmailTag)}
            className="flex-shrink-0 ml-auto text-sm border border-zinc-200 rounded-full px-3.5 py-1.5 bg-white text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[36px]"
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
