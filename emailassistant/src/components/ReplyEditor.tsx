import { ArrowPathIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import type { Draft, DraftConfidence } from '../types/draft';
import { DraftSkeleton } from './LoadingSkeleton';
import { Button } from './Button';

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

interface ReplyEditorProps {
  draft: Draft | null;
  isOnline: boolean;
  isSending: boolean;
  onEdit: (text: string) => void;
  onRegenerate: () => void;
  onApprove: () => void;
  onDiscard: () => void;
}

export function ReplyEditor({
  draft,
  isOnline,
  isSending,
  onEdit,
  onRegenerate,
  onApprove,
  onDiscard,
}: ReplyEditorProps) {
  // Show skeleton while AI is generating
  if (draft?.isLoading) {
    return (
      <div className="space-y-4">
        <DraftSkeleton />
      </div>
    );
  }

  // Show error state
  if (draft?.error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <span aria-hidden="true">❌</span>
          <div>
            <p className="font-semibold mb-1">AI unavailable</p>
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

  return (
    <div className="space-y-4">
      {/* Editable reply textarea */}
      <textarea
        value={draft.content}
        onChange={(e) => onEdit(e.target.value)}
        rows={10}
        className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent leading-relaxed"
        placeholder="Your reply will appear here…"
        aria-label="Email reply draft"
      />

      {/* Confidence indicator */}
      {draft.confidence && <ConfidenceStrip confidence={draft.confidence} />}

      {/* Regenerate link */}
      <button
        onClick={onRegenerate}
        disabled={!isOnline}
        className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ArrowPathIcon className="w-4 h-4" />
        Regenerate Draft
      </button>

      {/* Action buttons */}
      <div className="space-y-3 pt-2">
        <Button
          variant="primary"
          fullWidth
          onClick={onApprove}
          disabled={!isOnline || !draft.content.trim()}
          isLoading={isSending}
        >
          <PaperAirplaneIcon className="w-4 h-4" />
          Approve & Send
        </Button>
        <Button variant="ghost" fullWidth onClick={onDiscard}>
          <TrashIcon className="w-4 h-4" />
          Discard Draft
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
