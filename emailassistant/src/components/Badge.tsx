import type { EmailTag, EmailStatus } from '../types/email';
import { tagClasses } from '../utils/tagStyles';

type BadgeType = EmailTag | EmailStatus;

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
        tagClasses(value),
        className,
      ].join(' ')}
    >
      {tagLabels[value] || value}
    </span>
  );
}
