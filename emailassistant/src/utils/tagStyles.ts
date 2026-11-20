// Color classes for email tags and statuses. Shared by the Badge and by
// controls (like the tag dropdown) that should match the badge colors.

export const tagStyles: Record<string, string> = {
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

export function tagClasses(value: string): string {
  return tagStyles[value] || 'bg-zinc-100 text-zinc-600';
}
