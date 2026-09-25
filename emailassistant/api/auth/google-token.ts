/// <reference types="node" />

export const config = { runtime: 'edge' };

// Exchanges/refreshes Google OAuth tokens so the client secret stays
// server-side and is never shipped in the client bundle.
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientSecret) {
    return new Response(
      JSON.stringify({
        error: 'server_misconfigured',
        error_description: 'GOOGLE_CLIENT_SECRET is not configured on the server.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const incoming = await request.formData();
  const params = new URLSearchParams();
  for (const [key, value] of incoming.entries()) {
    params.set(key, String(value));
  }
  params.set('client_secret', clientSecret);

  const upstream = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  });
}
