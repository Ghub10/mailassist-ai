import type { Tone } from '../types/user';
import type { Email } from '../types/email';
import { buildReplyPrompt } from '../utils/prompts';
import { truncateForAI } from '../utils/emailParser';

const RETRY_DELAY_MS = 15_000;

// What people see when the AI can't answer. The technical reason (no credits,
// bad key, rate limit...) goes to the browser console for debugging, never to
// the screen.
const MSG_BUSY = 'The assistant is busy, please try again in a minute.';
const MSG_UNAVAILABLE = "The assistant isn't available right now. Please try again later.";
const MSG_EMPTY = "The assistant didn't come back with a reply. Please try again.";
const MSG_OFFLINE = "Couldn't reach the assistant. Please check your connection and try again.";
const MSG_SIGN_IN = "Your session has expired. Please sign out and sign in again.";

// The server only answers signed-in users, so every AI request carries the
// user's Google or Microsoft access token for the server to check.
export interface AIAuth {
  provider: 'google' | 'microsoft';
  accessToken: string;
}

function authHeaders(auth?: AIAuth): Record<string, string> {
  return auth ? { Authorization: `Bearer ${auth.accessToken}`, 'X-Auth-Provider': auth.provider } : {};
}

// On a genuine 429 rate-limit response, waits 15 s then tries once more.
// A 429 caused by insufficient_quota (no credits / no billing) or by our own
// per-user limit (rate_limited, a 10-minute window) is NOT retried, since
// waiting 15 s can never resolve it. onRetry is called right before a retry so
// the UI can show a waiting message.
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  onRetry?: () => void
): Promise<Response> {
  const first = await fetch(url, init);
  if (first.status !== 429) return first;

  // Peek at the error code without consuming the original response body.
  const err = await first.clone().json().catch(() => ({}));
  if (err?.error?.code === 'insufficient_quota' || err?.error?.code === 'rate_limited') return first;

  onRetry?.();
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  return fetch(url, init);
}

export async function generateDraft(
  emailBody: string,
  tone: Tone,
  signerName: string,
  onChunk?: (accumulated: string) => void,
  auth?: AIAuth
): Promise<string> {
  const truncatedBody = truncateForAI(emailBody, 3000);
  const prompt = buildReplyPrompt(truncatedBody, tone, signerName);

  const init: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(auth),
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
      stream: !!onChunk,
    }),
  };

  const onRetry = onChunk
    ? () => onChunk('The assistant is busy. Trying again in a moment…')
    : undefined;

  let response: Response;
  try {
    response = await fetchWithRetry('/api/openai', init, onRetry);
  } catch (networkError) {
    console.error('[assistant] request failed', networkError);
    throw new Error(MSG_OFFLINE);
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('[assistant] OpenAI request failed', response.status, err);
    // Not signed in, or the sign-in has run out: ask them to sign in again.
    if (response.status === 401) throw new Error(MSG_SIGN_IN);
    // No credits, or too many requests: both read as "busy" to a visitor.
    if (err.error?.code === 'insufficient_quota' || response.status === 429) {
      throw new Error(MSG_BUSY);
    }
    // Bad or missing key, server problem, anything else.
    throw new Error(MSG_UNAVAILABLE);
  }

  // Non-streaming path
  if (!onChunk) {
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error(MSG_EMPTY);
    return content;
  }

  // Streaming path — parse SSE chunks and accumulate
  const reader = response.body?.getReader();
  if (!reader) throw new Error(MSG_UNAVAILABLE);

  const decoder = new TextDecoder();
  let accumulated = '';

  // The network hands us the stream in arbitrary pieces, and a piece can end in
  // the middle of a line. Keep the unfinished tail and finish it with the next
  // piece. (Throwing it away drops words from the reply.)
  let pending = '';

  // Reads one line of the stream. Returns true once the stream says it is done.
  const handleLine = (rawLine: string): boolean => {
    const line = rawLine.trim();
    if (!line.startsWith('data:')) return false;
    const data = line.slice(5).trim();
    if (data === '[DONE]') return true;
    try {
      const delta = JSON.parse(data).choices?.[0]?.delta?.content;
      if (delta) {
        accumulated += delta;
        onChunk(accumulated);
      }
    } catch {
      console.error('[assistant] could not read a streamed line', data.slice(0, 80));
    }
    return false;
  };

  let finished = false;
  while (!finished) {
    const { done, value } = await reader.read();
    if (done) break;

    pending += decoder.decode(value, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() ?? ''; // the last piece may be unfinished: keep it

    for (const line of lines) {
      if (handleLine(line)) {
        finished = true;
        break;
      }
    }
  }

  // The stream can end without a final newline; don't lose the last line.
  if (!finished) {
    pending += decoder.decode();
    if (pending) handleLine(pending);
  }

  if (!accumulated) throw new Error(MSG_EMPTY);
  return accumulated;
}

export async function classifyUrgency(
  emails: Email[],
  auth?: AIAuth
): Promise<Record<string, 1 | 2 | 3>> {
  if (emails.length === 0) return {};

  const items = emails.map((e) => ({
    id: e.id,
    subject: e.subject,
    snippet: e.bodyText.slice(0, 120),
  }));

  const prompt = `You are an email triage assistant. For each email below, assign an urgency score:
3 = High urgency: needs a reply today (deadlines, complaints, urgent requests, time-sensitive questions)
2 = Medium urgency: should reply within a day or two (general questions, follow-ups, client inquiries)
1 = Low urgency: informational, newsletters, receipts, no reply needed

Return ONLY a JSON object in this exact format:
{"classifications": [{"id": "<id>", "urgency": <1|2|3>}, ...]}

Emails:
${JSON.stringify(items)}`;

  try {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(auth),
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
        temperature: 0,
      }),
    });

    if (!response.ok) return {};

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return {};

    const parsed = JSON.parse(content);
    const result: Record<string, 1 | 2 | 3> = {};
    for (const item of parsed.classifications ?? []) {
      if (item.id && item.urgency >= 1 && item.urgency <= 3) {
        result[item.id] = item.urgency as 1 | 2 | 3;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export async function scoreDraft(
  emailBody: string,
  draftText: string,
  auth?: AIAuth
): Promise<{ score: number; feedback: string }> {
  const prompt = `You are evaluating an AI-generated email reply. Rate 1–10 how completely and accurately this draft addresses the sender's question or request. A 10 means the reply is complete, accurate, and on-topic. A 1 means it misses the point entirely.

Return ONLY a JSON object:
{"score": <1-10>, "feedback": "<one concise sentence explaining the rating>"}

Original email:
---
${emailBody.slice(0, 1500)}
---

Draft reply:
---
${draftText.slice(0, 1000)}
---`;

  const response = await fetchWithRetry(
    '/api/openai',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(auth),
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 150,
        temperature: 0,
      }),
    }
  );

  if (!response.ok) throw new Error('Scoring request failed');

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty scoring response');

  const parsed = JSON.parse(content);
  return {
    score: Math.min(10, Math.max(1, Number(parsed.score) || 5)),
    feedback: String(parsed.feedback || ''),
  };
}
