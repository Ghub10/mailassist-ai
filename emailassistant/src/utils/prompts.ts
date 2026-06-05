import type { Tone } from '../types/user';

const toneDescriptions: Record<Tone, string> = {
  friendly: 'warm, approachable, and conversational — like writing to someone you know',
  formal: 'professional, structured, and polite — appropriate for business correspondence',
  concise: 'brief and direct — get to the point quickly, avoid unnecessary words',
};

export function buildReplyPrompt(emailBody: string, tone: Tone, signerName: string): string {
  return `You are a professional email assistant. Draft a helpful, complete reply to the following email.

Tone: ${toneDescriptions[tone]}

Instructions:
- Reply in the same language as the email
- Address the sender's question or request directly
- Do not include a subject line
- Do not add "Subject:" or "To:" headers
- Sign off with the name "${signerName}"
- Keep the reply focused and relevant

Email to reply to:
---
${emailBody}
---

Draft reply:`;
}
