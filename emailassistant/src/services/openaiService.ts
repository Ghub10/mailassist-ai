import type { Tone } from '../types/user';
import type { Email } from '../types/email';
import { buildReplyPrompt } from '../utils/prompts';
import { truncateForAI } from '../utils/emailParser';

const RETRY_DELAY_MS = 15_000;

// On a genuine 429 rate-limit response, waits 15 s then tries once more.
// A 429 caused by insufficient_quota (no credits / no billing) is NOT retried,
// since waiting can never resolve it. onRetry is called right before a retry so
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
  if (err?.error?.code === 'insufficient_quota') return first;

  onRetry?.();
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  return fetch(url, init);
}

export async function generateDraft(
  emailBody: string,
  tone: Tone,
  signerName: string,
  onChunk?: (accumulated: string) => void
): Promise<string> {
  const truncatedBody = truncateForAI(emailBody, 3000);
  const prompt = buildReplyPrompt(truncatedBody, tone, signerName);

  const init: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
    ? () => onChunk('Rate limited — retrying in 15 s…')
    : undefined;

  const response = await fetchWithRetry('/api/openai', init, onRetry);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (err.error?.code === 'insufficient_quota') {
      throw new Error(
        'Your OpenAI account has no credits. Add a payment method and credit at platform.openai.com to enable AI replies.'
      );
    }
    if (response.status === 429) {
      throw new Error('AI rate limit reached. Please wait a minute and try again.');
    }
    if (response.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your configuration.');
    }
    throw new Error(err.error?.message || 'AI service unavailable. Please try again.');
  }

  // Non-streaming path
  if (!onChunk) {
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('AI returned an empty response. Please try again.');
    return content;
  }

  // Streaming path — parse SSE chunks and accumulate
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Streaming not supported by this browser.');

  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          accumulated += delta;
          onChunk(accumulated);
        }
      } catch {
        // Incomplete JSON fragment — skip
      }
    }
  }

  if (!accumulated) throw new Error('AI returned an empty response. Please try again.');
  return accumulated;
}

export async function classifyUrgency(
  emails: Email[]
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
  draftText: string
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
