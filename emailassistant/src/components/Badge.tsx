import type { EmailTag, EmailStatus } from '../types/email';

type BadgeType = EmailTag | EmailStatus;

const tagStyles: Record<string, string> = {
  urgent: 'bg-red-100 text-red-600',
  high_priority: 'bg-orange-100 text-orange-700',
  client: 'bg-violet-100 text-violet-700',
  billing: 'bg-amber-100 text-amber-700',
  low_priority: 'bg-zinc-100 text-zinc-500',
  other: 'bg-zinc-100 text-zinc-600',
  needs_reply: 'bg-blue-100 text-blue-700',
  replied: 'bg-green-100 text-green-700',
  ignored: 'bg-zinc-100 text-zinc-400',
};

const tagLabels: Record<string, string> = {
  urgent: 'Urgent',
  high_priority: 'High Priority',
  client: 'Client',
  billing: 'Billing',
  low_priority: 'Low Priority',
  other: 'Other',
  needs_reply: 'Needs Reply',
  replied: 'Replied',
  ignored: 'Ignored',
};

interface BadgeProps {
  value: BadgeType;
  className?: string;
}

export function Badge({ value, className = '' }: BadgeProps) {
  if (!value) return null;

  return (
    <span
      className={[
        'inline-block rounded-full py-0.5 px-3 text-xs font-semibold',
        tagStyles[value] || 'bg-zinc-100 text-zinc-600',
        className,
      ].join(' ')}
    >
      {tagLabels[value] || value}
    </span>
  );
}
