export type Provider = 'google' | 'microsoft';
export type Tone = 'friendly' | 'formal' | 'concise';

export interface User {
  id: string;
  email: string;
  name: string;
  provider: Provider;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry: number; // Unix timestamp in ms
  tone: Tone;
}
