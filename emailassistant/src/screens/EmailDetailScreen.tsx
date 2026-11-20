import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChevronDownIcon, TrashIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useInbox } from '../context/InboxContext';
import { useAuth } from '../context/AuthContext';
import { useAIDraft } from '../hooks/useAIDraft';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useToast } from '../hooks/useToast';
import { ReplyEditor, GenerateReplyButton } from '../components/ReplyEditor';
import { tagClasses } from '../utils/tagStyles';
import { Avatar } from '../components/Avatar';
import { ToastContainer } from '../components/Toast';
import { sendGmailReply, trashGmailEmail } from '../services/gmailService';
import { sendOutlookReply, trashOutlookEmail } from '../services/outlookService';
import { getValidGoogleToken } from '../services/authService';
import { refreshMicrosoftToken } from '../services/msalService';
import { isTokenExpired, saveReplyToHistory } from '../utils/tokenStorage';
import type { EmailTag } from '../types/email';
import type { Tone } from '../types/user';

const TAG_OPTIONS: { value: Exclude<EmailTag, null>; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high_priority', label: 'High Priority' },
  { value: 'client', label: 'Client' },
  { value: 'billing', label: 'Billing' },
  { value: 'low_priority', label: 'Low Priority' },
  { value: 'other', label: 'Other' },
];

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Renders the original email HTML inside a sandboxed iframe. Scripts are
// disabled (no allow-scripts), so email JS can never run. allow-same-origin is
// only present so we can measure the content height for auto-sizing.
function EmailHtmlBody({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(240);

  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html,body{margin:0;padding:12px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.5;color:#27272a;word-break:break-word;}
  img{max-width:100%!important;height:auto!important;}
  table{max-width:100%!important;}
  a{color:#7c3aed;}
</style></head><body>${html}</body></html>`;

  function handleLoad() {
    const doc = iframeRef.current?.contentDocument;
    if (doc?.body) {
      // Clamp to keep very long marketing emails from taking over the page;
      // content scrolls internally beyond the cap.
      const measured = doc.body.scrollHeight + 24;
      setHeight(Math.min(measured, Math.round(window.innerHeight * 0.7)));
    }
  }

  return (
    <iframe
      ref={iframeRef}
      title="Email content"
      srcDoc={srcDoc}
      sandbox="allow-same-origin"
      onLoad={handleLoad}
      className="w-full border-0 bg-white rounded-lg"
      style={{ height }}
    />
  );
}

export function EmailDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { emails, updateEmailStatus, updateEmailTag, setDraft, removeEmail } = useInbox();
  const { user, updateToken } = useAuth();
  const isOnline = useOnlineStatus();
  const { toasts, showToast, dismissToast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // The tone for this reply. It starts from the tone saved in Settings, and
  // switching it here doesn't change that saved choice.
  const [replyTone, setReplyTone] = useState<Tone>(user?.tone ?? 'friendly');

  const email = emails.find((e) => e.id === id);
  const { draft, generate, regenerate, updateContent, clearDraft, findSimilarReply } = useAIDraft(id || '');

  const similarReply = email ? findSimilarReply(email.subject) : null;

  if (!email) {
    // Show a transitional screen while a trash/delete action is in progress
    // so the page doesn't flash "Email not found" between removeEmail and navigation.
    if (isDeleting) {
      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <p className="text-zinc-500">Moving to Trash…</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-zinc-500 mb-4">Email not found.</p>
          <button onClick={() => navigate('/inbox')} className="text-violet-600 underline font-medium">
            Back to Inbox
          </button>
        </div>
      </div>
    );
  }

  async function handleGenerateReply() {
    setShowReplyEditor(true);
    await generate(email!.bodyText, replyTone);
  }

  async function handleToneChange(tone: Tone) {
    setReplyTone(tone);
    await regenerate(email!.bodyText, tone);
  }

  async function handleSend() {
    if (!user || !draft?.content.trim()) return;

    setIsSending(true);
    try {
      if (user.isDemo) {
        // Sample mode: pretend to send. Nothing leaves the browser.
        await new Promise((resolve) => setTimeout(resolve, 600));
      } else {
        let token = user.accessToken;

        // Refresh token if needed before sending
        if (isTokenExpired(user)) {
          if (user.provider === 'google') {
            token = await getValidGoogleToken(user);
          } else {
            const refreshed = await refreshMicrosoftToken(user);
            token = refreshed.accessToken;
            updateToken(refreshed.accessToken, refreshed.tokenExpiry);
          }
        }

        if (user.provider === 'google') {
          await sendGmailReply(token, email!.threadId, email!.fromEmail, email!.subject, draft!.content);
        } else {
          await sendOutlookReply(token, email!.id, draft!.content);
        }

        saveReplyToHistory({
          subject: email!.subject,
          bodySnippet: email!.bodyText.slice(0, 200),
          replyText: draft!.content,
          sentAt: new Date().toISOString(),
        });
      }
      updateEmailStatus(email!.id, 'replied');
      clearDraft();
      showToast(user.isDemo ? 'Sample mode: reply marked as sent (nothing was emailed)' : 'Reply sent!', 'success');

      // Navigate back to inbox after a short delay so user sees the toast
      setTimeout(() => navigate('/inbox'), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send. Please try again.';
      showToast(message, 'error');
    } finally {
      setIsSending(false);
    }
  }

  function handleDiscard() {
    clearDraft();
    setShowReplyEditor(false);
  }

  function handleIgnore() {
    updateEmailStatus(email!.id, 'ignored');
    navigate('/inbox');
  }

  async function handleTrash() {
    if (!user) return;
    setIsDeleting(true);
    try {
      if (user.isDemo) {
        // Sample mode: remove from the on-screen list only.
        removeEmail(email!.id);
        showToast('Sample mode: removed from this demo inbox', 'success');
        setTimeout(() => navigate('/inbox'), 100);
        return;
      }
      let token = user.accessToken;
      if (isTokenExpired(user)) {
        if (user.provider === 'google') {
          token = await getValidGoogleToken(user);
        } else {
          const refreshed = await refreshMicrosoftToken(user);
          token = refreshed.accessToken;
          updateToken(refreshed.accessToken, refreshed.tokenExpiry);
        }
      }
      if (user.provider === 'google') {
        await trashGmailEmail(token, email!.id);
      } else {
        await trashOutlookEmail(token, email!.id);
      }
      removeEmail(email!.id);
      showToast('Moved to Trash', 'success');
      setTimeout(() => navigate('/inbox'), 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to trash email. Please try again.';
      showToast(message, 'error');
      setIsDeleting(false);
    }
  }

  function handleUsePreviousReply() {
    if (!similarReply) return;
    setDraft({ emailId: email!.id, content: similarReply.replyText, isLoading: false, error: null, confidence: null });
    setShowReplyEditor(true);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200/70 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/inbox')}
            className="p-2 -ml-2 rounded-lg text-zinc-500 hover:bg-zinc-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Back to inbox"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-zinc-900 truncate flex-1">
            {showReplyEditor ? 'Reply Draft' : 'Email'}
          </h2>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 pb-24 space-y-4">
        {/* Email header */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xl font-semibold tracking-tight text-zinc-900 leading-snug">{email.subject}</h3>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-3">
            <Avatar name={email.from} className="w-11 h-11 text-sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900 truncate">{email.from}</p>
              <p className="text-xs text-zinc-500 truncate">{email.fromEmail}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{formatDate(email.receivedAt)}</p>
            </div>

            {/* One tag control: a colored pill that is also the dropdown */}
            {/* On phones, start a new line so the pill sits under the sender */}
            <div className="basis-full sm:hidden" aria-hidden="true" />
            <div className="relative ml-14 sm:ml-0">
              <select
                id="tag-select"
                value={email.tag ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  updateEmailTag(email.id, (val === '' ? null : val) as EmailTag);
                }}
                className={[
                  'appearance-none rounded-full pl-3.5 pr-8 py-1.5 min-h-[36px] text-xs font-semibold cursor-pointer',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
                  email.tag ? tagClasses(email.tag) : 'bg-zinc-100 text-zinc-500',
                ].join(' ')}
                aria-label="Email tag"
              >
                <option value="">No tag</option>
                {TAG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDownIcon
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-60"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Email body */}
        {!showReplyEditor && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            {email.bodyHtml ? (
              <EmailHtmlBody html={email.bodyHtml} />
            ) : (
              <div className="text-[15px] text-zinc-700 whitespace-pre-wrap leading-7">
                {email.bodyText || (
                  <span className="italic text-zinc-400">No readable content — cannot generate a reply from this email.</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reply editor (shown after Generate is tapped) */}
        {showReplyEditor && (
          <ReplyEditor
            draft={draft}
            isOnline={isOnline}
            isSending={isSending}
            toName={email.from}
            toEmail={email.fromEmail}
            subject={email.subject}
            tone={replyTone}
            onToneChange={handleToneChange}
            onEdit={updateContent}
            onRegenerate={() => regenerate(email.bodyText, replyTone)}
            onApprove={handleSend}
            onDiscard={handleDiscard}
          />
        )}

        {/* Actions (shown before reply editor) */}
        {!showReplyEditor && (
          <div className="space-y-3">
            {/* Similar reply banner */}
            {similarReply && email.bodyText && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                  Similar question answered before
                </p>
                <p className="text-sm text-violet-900 truncate">
                  "{similarReply.subject.length > 50
                    ? similarReply.subject.slice(0, 50) + '…'
                    : similarReply.subject}"
                </p>
                <button
                  onClick={handleUsePreviousReply}
                  className="text-sm font-semibold text-violet-600 hover:text-violet-700 underline min-h-[36px]"
                >
                  Use Previous Reply
                </button>
              </div>
            )}

            {email.bodyText ? (
              <GenerateReplyButton onClick={handleGenerateReply} isOnline={isOnline} />
            ) : (
              <div className="text-sm text-zinc-500 bg-amber-50 border border-amber-200 rounded-xl p-4">
                No readable content — cannot generate a reply from this email.
              </div>
            )}
            {/* Secondary actions, side by side and quieter than the main button */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleIgnore}
                className="flex items-center justify-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 py-3 font-medium min-h-[44px] bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                <EyeSlashIcon className="w-4 h-4" />
                Mark as Ignored
              </button>
              <button
                onClick={handleTrash}
                disabled={isDeleting || !isOnline}
                className="flex items-center justify-center gap-2 text-sm text-zinc-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-40 py-3 font-medium min-h-[44px] bg-white border border-zinc-200 rounded-xl transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                {isDeleting ? 'Moving…' : 'Move to Trash'}
              </button>
            </div>
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
