import type { Email } from '../types/email';
import { Badge } from './Badge';

interface EmailListItemProps {
  email: Email;
  onClick: () => void;
}

const statusDot: Record<string, string> = {
  needs_reply: 'bg-blue-400',
  replied: 'bg-green-500',
  ignored: 'bg-zinc-300',
};

const urgencyDot: Record<number, string> = {
  3: 'bg-red-500',
  2: 'bg-amber-400',
};

const urgencyLabel: Record<number, string> = {
  3: 'High urgency',
  2: 'Medium urgency',
};

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

export function EmailListItem({ email, onClick }: EmailListItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-violet-200 hover:-translate-y-0.5 active:scale-[0.98] active:bg-violet-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      aria-label={`Email from ${email.from}: ${email.subject}`}
    >
      <div className="flex items-start gap-3">
        {/* Status + urgency dots */}
        <div className="mt-1.5 flex-shrink-0 flex flex-col gap-1 items-center">
          <div
            className={`w-2.5 h-2.5 rounded-full ${statusDot[email.status] || 'bg-zinc-300'}`}
            aria-label={email.status}
          />
          {email.urgency && email.urgency >= 2 && (
            <div
              className={`w-2.5 h-2.5 rounded-full ${urgencyDot[email.urgency]}`}
              aria-label={urgencyLabel[email.urgency]}
              title={urgencyLabel[email.urgency]}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="font-semibold text-zinc-900 truncate text-sm">{email.from}</span>
            <span className="text-xs text-zinc-400 flex-shrink-0">{formatRelativeTime(email.receivedAt)}</span>
          </div>
          <p className="text-sm text-zinc-600 truncate mb-1">{email.subject}</p>
          <p className="text-xs text-zinc-400 truncate mb-2">
            {email.bodyText.slice(0, 100)}
          </p>
          {email.tag && (
            <Badge value={email.tag} />
          )}
        </div>
      </div>
    </button>
  );
}
