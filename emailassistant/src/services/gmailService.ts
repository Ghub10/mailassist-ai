import type { Email } from '../types/email';
import { extractPlainText, sanitizePlainText } from '../utils/emailParser';

const BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

// Fetches the list of inbox messages and their content
export async function fetchGmailEmails(accessToken: string): Promise<Email[]> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Step 1: Get list of message IDs
  const listRes = await fetch(
    `${BASE_URL}/messages?maxResults=15&labelIds=INBOX&q=${encodeURIComponent('is:unread OR is:read')}`,
    { headers }
  );

  if (!listRes.ok) {
    const err = await listRes.json();
    if (listRes.status === 429) {
      throw new Error('Gmail rate limit reached. Please wait a minute and try again.');
    }
    throw new Error(err.error?.message || 'Failed to fetch emails from Gmail');
  }

  const listData = await listRes.json();
  const messages: { id: string }[] = listData.messages || [];

  if (messages.length === 0) return [];

  // Step 2: Fetch full content in sequential chunks to avoid bursting the
  // per-user rate limit (never more than CHUNK requests in flight at once)
  const CHUNK = 5;
  const results: Email[] = [];

  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK);
    const settled = await Promise.allSettled(
      chunk.map((msg) => fetchGmailMessage(accessToken, msg.id))
    );
    results.push(
      ...settled
        .filter((r): r is PromiseFulfilledResult<Email> => r.status === 'fulfilled')
        .map((r) => r.value)
    );
  }

  return results;
}

async function fetchGmailMessage(accessToken: string, messageId: string): Promise<Email> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const res = await fetch(`${BASE_URL}/messages/${messageId}?format=full`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch message ${messageId}`);

  const msg = await res.json();
  const headers2: Array<{ name: string; value: string }> = msg.payload?.headers || [];

  const getHeader = (name: string) =>
    headers2.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const fromRaw = getHeader('From');
  const fromMatch = fromRaw.match(/^(.*?)\s*<(.+)>$/) || [];
  const fromName = fromMatch[1]?.trim().replace(/^"|"$/g, '') || fromRaw;
  const fromEmail = fromMatch[2] || fromRaw;

  const { html, text } = extractBodyFromPayload(msg.payload);

  return {
    id: msg.id,
    threadId: msg.threadId,
    from: fromName,
    fromEmail,
    subject: getHeader('Subject') || '(No subject)',
    bodyText: text,
    bodyHtml: html,
    receivedAt: new Date(parseInt(msg.internalDate)).toISOString(),
    status: 'needs_reply',
    tag: null,
    urgency: null,
  };
}

interface ExtractedBody {
  html: string | null; // original HTML for rich display
  text: string; // clean plain text for AI + fallback display
}

// Recursively extracts both the original HTML and a clean plain-text version
// from a Gmail message payload. HTML is preferred for display; text is always
// derived for the AI prompt and as a fallback when no HTML part exists.
function extractBodyFromPayload(payload: {
  mimeType?: string;
  body?: { data?: string };
  parts?: unknown[];
}): ExtractedBody {
  if (!payload) return { html: null, text: '' };

  // Direct HTML body
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    const raw = decodeBase64Url(payload.body.data);
    return { html: raw, text: extractPlainText(raw) };
  }

  // Direct text/plain body
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return { html: null, text: sanitizePlainText(decodeBase64Url(payload.body.data)) };
  }

  if (payload.parts) {
    const parts = payload.parts as typeof payload[];

    // Prefer text/html inside multipart for the rich display version
    for (const part of parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const raw = decodeBase64Url(part.body.data);
        return { html: raw, text: extractPlainText(raw) };
      }
    }
    // Fall back to text/plain if there is no HTML part
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return { html: null, text: sanitizePlainText(decodeBase64Url(part.body.data)) };
      }
    }
    // Recurse into nested multipart parts (e.g. multipart/alternative inside multipart/mixed)
    for (const part of parts) {
      if (part.parts) {
        const nested = extractBodyFromPayload(part);
        if (nested.html || nested.text) return nested;
      }
    }
  }

  return { html: null, text: '' };
}

function decodeBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
  } catch {
    return atob(base64);
  }
}

// Sends a reply via Gmail API using RFC 2822 MIME format
export async function sendGmailReply(
  accessToken: string,
  threadId: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // Build a minimal RFC 2822 email message
  const replySubject = subject.startsWith('Re: ') ? subject : `Re: ${subject}`;
  const message = [
    `To: ${to}`,
    `Subject: ${replySubject}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    body,
  ].join('\r\n');

  // Gmail API requires base64url encoding
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const res = await fetch(`${BASE_URL}/messages/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ raw: encodedMessage, threadId }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to send email via Gmail');
  }
}

// Moves a Gmail message to Trash (recoverable for 30 days)
export async function trashGmailEmail(accessToken: string, messageId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/messages/${messageId}/trash`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to move email to trash');
  }
}

// Permanently deletes a Gmail message (cannot be undone)
export async function deleteGmailEmail(accessToken: string, messageId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/messages/${messageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to permanently delete email');
  }
}
