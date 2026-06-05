export type EmailStatus = 'needs_reply' | 'replied' | 'ignored';
export type EmailTag = 'urgent' | 'high_priority' | 'client' | 'billing' | 'low_priority' | 'other' | null;

export interface Email {
  id: string;
  threadId: string;
  from: string;
  fromEmail: string;
  subject: string;
  bodyText: string;
  bodyHtml: string | null; // original HTML for rich display; null when only plain text
  receivedAt: string; // ISO date string
  status: EmailStatus;
  tag: EmailTag;
  urgency: 1 | 2 | 3 | null; // 3 = high, 2 = medium, 1 = low
}
