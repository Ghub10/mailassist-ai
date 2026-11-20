import { ArrowPathIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import type { Draft, DraftConfidence } from '../types/draft';
import type { Tone } from '../types/user';
import { DraftSkeleton } from './LoadingSkeleton';
import { Button } from './Button';

const TONES: { value: Tone; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'concise', label: 'Concise' },
];

function ConfidenceStrip({ confidence }: { confidence: DraftConfidence }) {
  if (confidence.isScoring) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="inline-block w-3 h-3 border-2 border-zinc-300 border-t-zinc-500 rounded-full animate-spin" />
        Evaluating reply…
      </div>
    );
  }

  const { score, feedback } = confidence;
  const isStrong = score >= 7;
  const isWeak = score <= 3;

  const pillClass = isStrong
    ? 'bg-green-100 text-green-700'
    : isWeak
    ? 'bg-red-100 text-red-700'
    : 'bg-amber-100 text-amber-700';

  const label = isStrong ? 'Strong reply' : isWeak ? 'May miss the point' : 'Review suggested';

  return (
    <div className="space-y-1">
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${pillClass}`}>
        {label}
      </span>
      {!isStrong && feedback && (
        <p className={`text-xs ${isWeak ? 'text-red-600' : 'text-amber-700'}`}>{feedback}</p>
      )}
    </div>
  );
}

// Friendly / Formal / Concise. Picking one writes a fresh draft in that tone.
function ToneSwitcher({
  value,
  onChange,
  disabled,
}: {
  value: Tone;
  onChange: (tone: Tone) => void;
  disabled: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Reply tone" className="inline-flex rounded-full bg-zinc-100 p-1">
      {TONES.map((tone) => {
        const active = value === tone.value;
        return (
          <button
            key={tone.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => !active && onChange(tone.value)}
            className={[
              'px-3.5 py-1.5 min-h-[36px] rounded-full text-sm font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
              active ? 'bg-white text-violet-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-800',
              disabled && !active ? 'cursor-wait opacity-60' : '',
            ].join(' ')}
          >
            {tone.label}
          </button>
        );
      })}
    </div>
  );
}

interface ReplyEditorProps {
  draft: Draft | null;
  isOnline: boolean;
  isSending: boolean;
  /** Who the reply goes to, shown like the To/Subject lines of a real email. */
  toName: string;
  toEmail: string;
  subject: string;
  tone: Tone;
  onToneChange: (tone: Tone) => void;
  onEdit: (text: string) => void;
  onRegenerate: () => void;
  onApprove: () => void;
  onDiscard: () => void;
}

export function ReplyEditor({
  draft,
  isOnline,
  isSending,
  toName,
  toEmail,
  subject,
  tone,
  onToneChange,
  onEdit,
  onRegenerate,
  onApprove,
  onDiscard,
}: ReplyEditorProps) {
  // Show error state
  if (draft?.error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <span aria-hidden="true">⚠️</span>
          <div>
            <p className="font-semibold mb-1">We couldn&apos;t write a reply</p>
            <p>{draft.error}</p>
          </div>
        </div>
        <Button variant="secondary" fullWidth onClick={onRegenerate} disabled={!isOnline}>
          <ArrowPathIcon className="w-4 h-4" />
          Try Again
        </Button>
        <Button variant="ghost" fullWidth onClick={onDiscard}>
          <TrashIcon className="w-4 h-4" />
          Discard
        </Button>
      </div>
    );
  }

  if (!draft) return null;

  const isWriting = draft.isLoading;
  const reSubject = /^re:/i.test(subject) ? subject : `Re: ${subject}`;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Top: tone choice + To / Subject, like a real email */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <ToneSwitcher value={tone} onChange={onToneChange} disabled={isWriting || !isOnline} />
          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
            <SparklesIcon className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
            {isWriting ? 'AI is writing…' : 'AI draft. Edit anything.'}
          </span>
        </div>
        <dl className="text-sm space-y-1">
          <div className="flex gap-3">
            <dt className="w-14 flex-shrink-0 text-zinc-400">To</dt>
            <dd className="min-w-0 truncate">
              <span className="font-medium text-zinc-800">{toName}</span>{' '}
              <span className="text-zinc-400">{toEmail}</span>
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-14 flex-shrink-0 text-zinc-400">Subject</dt>
            <dd className="min-w-0 truncate text-zinc-800">{reSubject}</dd>
          </div>
        </dl>
      </div>

      {/* Middle: the reply. It types out live while the AI writes, then becomes editable. */}
      <div className="min-h-[240px]">
        {isWriting ? (
          draft.content ? (
            <p className="p-4 text-[15px] leading-relaxed text-zinc-800 whitespace-pre-wrap" aria-live="polite">
              {draft.content}
              <span
                className="inline-block w-0.5 h-4 bg-violet-500 align-middle ml-0.5 animate-pulse"
                aria-hidden="true"
              />
            </p>
          ) : (
            <div className="p-4">
              <DraftSkeleton />
            </div>
          )
        ) : (
          <textarea
            value={draft.content}
            onChange={(e) => onEdit(e.target.value)}
            rows={10}
            className="block w-full p-4 text-[15px] leading-relaxed text-zinc-800 placeholder-zinc-400 resize-none bg-transparent focus:outline-none focus:bg-violet-50/30"
            placeholder="Your reply will appear here…"
            aria-label="Email reply draft"
          />
        )}
      </div>

      {draft.confidence && !isWriting && (
        <div className="px-4 pb-3">
          <ConfidenceStrip confidence={draft.confidence} />
        </div>
      )}

      {/* Bottom: discard / regenerate on the left, send on the right */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-zinc-50 border-t border-zinc-100">
        <div className="flex items-center justify-center gap-1 sm:justify-start">
          <button
            type="button"
            onClick={onDiscard}
            disabled={isSending}
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl text-sm font-medium text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
          >
            <TrashIcon className="w-4 h-4" />
            Discard
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={!isOnline || isWriting || isSending}
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl text-sm font-medium text-violet-600 hover:bg-violet-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Regenerate
          </button>
        </div>
        <Button
          variant="primary"
          className="w-full sm:w-auto"
          onClick={onApprove}
          disabled={!isOnline || isWriting || !draft.content.trim()}
          isLoading={isSending}
        >
          <PaperAirplaneIcon className="w-4 h-4" />
          Approve & Send
        </Button>
      </div>
    </div>
  );
}

interface GenerateReplyButtonProps {
  onClick: () => void;
  isOnline: boolean;
}

export function GenerateReplyButton({ onClick, isOnline }: GenerateReplyButtonProps) {
  return (
    <Button variant="primary" fullWidth onClick={onClick} disabled={!isOnline}>
      <SparklesIcon className="w-5 h-5" />
      Generate AI Reply
    </Button>
  );
}
