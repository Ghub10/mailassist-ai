import type { User } from '../types/user';
import { isTokenExpired } from '../utils/tokenStorage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const APP_URL = import.meta.env.VITE_APP_URL as string;
const GOOGLE_REDIRECT_URI = `${APP_URL}/auth/google/callback`;

// Generates a random string for PKCE code verifier
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Hashes the code verifier to create the code challenge
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function initiateGoogleLogin(): Promise<void> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  // Store verifier in sessionStorage so we can use it in the callback
  sessionStorage.setItem('pkce_verifier', verifier);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleGoogleCallback(code: string): Promise<User> {
  const verifier = sessionStorage.getItem('pkce_verifier');
  if (!verifier) throw new Error('Missing PKCE verifier. Please try signing in again.');

  const response = await fetch('/api/auth/google-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error_description || 'Google sign-in failed');
  }

  const tokens = await response.json();
  sessionStorage.removeItem('pkce_verifier');

  // Decode the ID token to get user info (it's a JWT — we just need the payload)
  const idPayload = JSON.parse(atob(tokens.id_token.split('.')[1]));

  const user: User = {
    id: idPayload.sub,
    email: idPayload.email,
    name: idPayload.name || idPayload.email,
    provider: 'google',
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiry: Date.now() + tokens.expires_in * 1000,
    tone: 'friendly',
  };

  return user;
}

export async function refreshGoogleToken(refreshToken: string): Promise<{ accessToken: string; tokenExpiry: number }> {
  const response = await fetch('/api/auth/google-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) throw new Error('Failed to refresh Google token. Please sign in again.');

  const tokens = await response.json();
  return {
    accessToken: tokens.access_token,
    tokenExpiry: Date.now() + tokens.expires_in * 1000,
  };
}

// Returns a valid access token, refreshing it silently if expired
export async function getValidGoogleToken(user: User): Promise<string> {
  if (!isTokenExpired(user)) return user.accessToken;

  if (!user.refreshToken) throw new Error('Session expired. Please sign in again.');

  const { accessToken } = await refreshGoogleToken(user.refreshToken);
  // The caller (hook/service) should update the context with the new token
  return accessToken;
}
