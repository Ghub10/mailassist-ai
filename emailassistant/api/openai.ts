/// <reference types="node" />

export const config = { runtime: 'edge' };

// Proxies chat-completion requests to OpenAI so the API key stays server-side
// and is never shipped in the client bundle.
//
// This endpoint spends real money, so it only answers requests that are:
//   1. from a signed-in user (a valid Google or Microsoft access token),
//   2. within a small per-user rate limit, and
//   3. for a model and size we allow.
// Anything else gets a short error and never reaches OpenAI.

const ALLOWED_MODELS = ['gpt-4o-mini'];
const MAX_MESSAGES = 4;
const MAX_PROMPT_CHARS = 20_000; // all message text together
const MAX_TOKENS_CAP = 1_000; // the longest reply we agree to pay for
const DEFAULT_MAX_TOKENS = 500;
const RATE_LIMIT_MAX = 20; // requests...
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // ...per 10 minutes, per user

function errorResponse(status: number, message: string, code?: string): Response {
  return new Response(JSON.stringify({ error: { message, code } }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

// ── 1. Who is asking? ────────────────────────────────────────────────────────
// Each check returns a stable user id, or null when the token isn't valid.
// Any failure (including a network error) counts as "not signed in".

async function verifyGoogle(token: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const info = (await res.json()) as { aud?: string; sub?: string; email?: string; expires_in?: string };
    // The token must have been issued to THIS app, not to some other Google app.
    const expectedClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.VITE_GOOGLE_CLIENT_ID;
    if (!expectedClientId || info.aud !== expectedClientId) return null;
    if (!(Number(info.expires_in) > 0)) return null;
    const id = info.sub ?? info.email;
    return id ? `google:${id}` : null;
  } catch {
    return null;
  }
}

// Microsoft tokens can't be traced back to our app from the token alone, so this
// only proves "a real, current Microsoft account". Google is checked more strictly.
async function verifyMicrosoft(token: string): Promise<string | null> {
  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me?$select=id', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const me = (await res.json()) as { id?: string };
    return me.id ? `microsoft:${me.id}` : null;
  } catch {
    return null;
  }
}

async function identify(request: Request): Promise<string | null> {
  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const provider = request.headers.get('X-Auth-Provider');
  if (provider === 'google') return verifyGoogle(token);
  if (provider === 'microsoft') return verifyMicrosoft(token);
  return null;
}

// ── 2. How often? ────────────────────────────────────────────────────────────
// Kept in memory, so each server instance counts on its own. That makes this a
// speed bump, not a hard wall; a shared store (Upstash/KV) would make it exact.

const recentRequests = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (recentRequests.get(userId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    recentRequests.set(userId, recent);
    return true;
  }
  recent.push(now);
  recentRequests.set(userId, recent);
  if (recentRequests.size > 5000) {
    for (const [key, times] of recentRequests) {
      if (!times.some((t) => now - t < RATE_LIMIT_WINDOW_MS)) recentRequests.delete(key);
    }
  }
  return false;
}

// ── 3. What exactly? ─────────────────────────────────────────────────────────
// Builds a fresh request from only the fields we accept. Anything else the
// caller sent (tools, other models, huge limits...) is dropped on the floor.

type Checked = { payload: Record<string, unknown> } | { error: string };

function buildPayload(input: unknown): Checked {
  if (typeof input !== 'object' || input === null) return { error: 'Invalid request.' };
  const body = input as Record<string, unknown>;

  const model = body.model ?? ALLOWED_MODELS[0];
  if (typeof model !== 'string' || !ALLOWED_MODELS.includes(model)) {
    return { error: 'That model is not available.' };
  }

  const rawMessages = body.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0 || rawMessages.length > MAX_MESSAGES) {
    return { error: 'Invalid messages.' };
  }
  const messages: { role: 'system' | 'user'; content: string }[] = [];
  let totalChars = 0;
  for (const item of rawMessages) {
    if (typeof item !== 'object' || item === null) return { error: 'Invalid messages.' };
    const { role, content } = item as Record<string, unknown>;
    if ((role !== 'user' && role !== 'system') || typeof content !== 'string' || content.length === 0) {
      return { error: 'Invalid messages.' };
    }
    totalChars += content.length;
    messages.push({ role, content });
  }
  if (totalChars > MAX_PROMPT_CHARS) return { error: 'The request is too long.' };

  const maxTokens = body.max_tokens;
  const temperature = body.temperature;
  const payload: Record<string, unknown> = {
    model,
    messages,
    max_tokens:
      typeof maxTokens === 'number' && Number.isFinite(maxTokens)
        ? Math.min(Math.max(Math.floor(maxTokens), 1), MAX_TOKENS_CAP)
        : DEFAULT_MAX_TOKENS,
    temperature:
      typeof temperature === 'number' && Number.isFinite(temperature)
        ? Math.min(Math.max(temperature, 0), 1)
        : 0.7,
  };
  if (body.stream === true) payload.stream = true;
  const format = body.response_format as { type?: unknown } | undefined;
  if (typeof format === 'object' && format !== null && format.type === 'json_object') {
    payload.response_format = { type: 'json_object' };
  }
  return { payload };
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return errorResponse(500, 'OPENAI_API_KEY is not configured on the server.');
  }

  const userId = await identify(request);
  if (!userId) {
    return errorResponse(401, 'Sign in to use the assistant.', 'sign_in_required');
  }
  if (isRateLimited(userId)) {
    return errorResponse(429, 'Too many requests. Please wait a few minutes.', 'rate_limited');
  }

  let parsed: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_PROMPT_CHARS * 2) return errorResponse(413, 'The request is too large.');
    parsed = JSON.parse(text);
  } catch {
    return errorResponse(400, 'Invalid request.');
  }

  const checked = buildPayload(parsed);
  if ('error' in checked) return errorResponse(400, checked.error);

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(checked.payload),
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
