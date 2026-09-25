export const config = { runtime: 'edge' };

// Proxies chat-completion requests to OpenAI so the API key stays server-side
// and is never shipped in the client bundle.
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: { message: 'OPENAI_API_KEY is not configured on the server.' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.text();

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  });
}
