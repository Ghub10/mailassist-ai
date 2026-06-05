import type { Email } from '../types/email';
import { extractPlainText, sanitizePlainText } from '../utils/emailParser';

const BASE_URL = 'https://graph.microsoft.com/v1.0/me';

// Fetches inbox emails from Microsoft Graph API
export async function fetchOutlookEmails(accessToken: string): Promise<Email[]> {
  const res = await fetch(
    `${BASE_URL}/messages?$top=50&$select=id,conversationId,from,subject,bodyPreview,body,receivedDateTime&$orderby=receivedDateTime desc`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to fetch emails from Outlook');
  }

  const data = await res.json();
  const messages = data.value || [];

  return messages.map(
    (msg: {
      id: string;
      conversationId: string;
      from: { emailAddress: { name: string; address: string } };
      subject: string;
      body: { content: string; contentType: string };
      receivedDateTime: string;
    }): Email => {
      const isHtml = msg.body?.contentType === 'html';
      const bodyText = isHtml
        ? extractPlainText(msg.body.content)
        : sanitizePlainText(msg.body?.content || '');
      const bodyHtml = isHtml ? msg.body.content : null;

      return {
        id: msg.id,
        threadId: msg.conversationId,
        from: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || 'Unknown',
        fromEmail: msg.from?.emailAddress?.address || '',
        subject: msg.subject || '(No subject)',
        bodyText,
        bodyHtml,
        receivedAt: msg.receivedDateTime,
        status: 'needs_reply',
        tag: null,
        urgency: null,
      };
    }
  );
}

// Sends a reply via Microsoft Graph API
export async function sendOutlookReply(
  accessToken: string,
  messageId: string,
  body: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/messages/${messageId}/reply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        body: {
          contentType: 'Text',
          content: body,
        },
      },
    }),
  });

  if (!res.ok && res.status !== 202) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to send reply via Outlook');
  }
}

// Moves an Outlook message to Deleted Items (recoverable)
export async function trashOutlookEmail(accessToken: string, messageId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/messages/${messageId}/move`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ destinationId: 'deleteditems' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to move email to deleted items');
  }
}

// Permanently deletes an Outlook message (cannot be undone)
export async function deleteOutlookEmail(accessToken: string, messageId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/messages/${messageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to permanently delete email');
  }
}
