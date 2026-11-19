import type { Email } from '../types/email';
import { Badge } from './Badge';
import { Avatar } from './Avatar';

interface EmailListItemProps {
  email: Email;
  onClick: () => void;
}

const STATUS_INFO: Record<string, { text: string; dot: string; color: string }> = {
  needs_reply: { text: 'Needs reply', dot: 'bg-blue-500', color: 'text-blue-600' },
  replied: { text: 'Replied', dot: 'bg-green-500', color: 'text-green-600' },
  ignored: { text: 'Ignored', dot: 'bg-zinc-300', color: 'text-zinc-400' },
};

// A colored stripe on the left edge makes urgent mail easy to spot.
function stripeClass(email: Email): string {
  if (email.tag === 'urgent' || email.urgency === 3) return 'border-l-red-500';
  if (email.tag === 'high_priority' || email.urgency === 2) return 'border-l-orange-400';
  return 'border-l-transparent';
}

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

// One clean line of preview text: no line breaks, and no "Hi Name," greeting up front.
function previewText(body: string): string {
  return body
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(hi|hello|hey|dear)\b[^,]{0,30},\s*/i, '')
    .slice(0, 320); // the 2-line limit below adds the "…"
}

export function EmailListItem({ email, onClick }: EmailListItemProps) {
  const status = STATUS_INFO[email.status] ?? STATUS_INFO.needs_reply;
  const isDone = email.status !== 'needs_reply';

  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left bg-white border border-zinc-200 border-l-4 rounded-xl p-4 shadow-sm',
        'hover:shadow-md hover:border-violet-200 hover:-translate-y-0.5',
        'active:scale-[0.98] active:bg-violet-50 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
        stripeClass(email),
        isDone ? 'opacity-75 hover:opacity-100' : '',
      ].join(' ')}
      aria-label={`Email from ${email.from}: ${email.subject}. ${status.text}.`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={email.from} />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold text-zinc-900 truncate text-sm">{email.from}</span>
            <span className="text-xs text-zinc-400 flex-shrink-0">{formatRelativeTime(email.receivedAt)}</span>
          </div>
          <p className="text-sm font-medium text-zinc-800 truncate mt-0.5">{email.subject}</p>
          <p className="text-sm text-zinc-500 line-clamp-2 mt-1 leading-snug">
            {previewText(email.bodyText)}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5">
            {email.tag && <Badge value={email.tag} />}
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${status.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
              {status.text}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
