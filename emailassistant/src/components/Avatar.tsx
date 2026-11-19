// A round avatar with the sender's initials. The color is picked from the name,
// so the same sender always gets the same color.

const PALETTE = [
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
];

function initialsOf(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

interface AvatarProps {
  name: string;
  className?: string;
}

export function Avatar({ name, className = 'w-10 h-10 text-sm' }: AvatarProps) {
  return (
    <div
      className={`flex-shrink-0 rounded-full flex items-center justify-center font-semibold select-none ${colorFor(name)} ${className}`}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </div>
  );
}
