import type { Email } from '../types/email';
import type { Tone, User } from '../types/user';

// Sample mode lets visitors try the app without signing in. Everything here is
// made up: the emails, the senders, and the replies. Nothing is sent anywhere.

export const DEMO_USER: User = {
  id: 'demo-user',
  email: 'demo@mailassist.example',
  name: 'Sample User',
  provider: 'google',
  accessToken: 'demo',
  tokenExpiry: 9999999999999,
  tone: 'friendly',
  isDemo: true,
};

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

export function getSampleEmails(): Email[] {
  return [
    {
      id: 'demo-1',
      threadId: 'demo-thread-1',
      from: 'Hannah Brooks',
      fromEmail: 'hannah@brooksandco.example',
      subject: 'Urgent: our order page is down',
      bodyText:
        "Hi,\n\nOur customers can't check out on the order page this morning. It shows an error after they click Pay. We have a promotion going out at noon, so we need this fixed as soon as possible.\n\nCan you take a look right away and let me know what's going on?\n\nThanks,\nHannah",
      bodyHtml: null,
      receivedAt: hoursAgo(1),
      status: 'needs_reply',
      tag: 'urgent',
      urgency: null,
    },
    {
      id: 'demo-2',
      threadId: 'demo-thread-2',
      from: 'Priya Shah',
      fromEmail: 'priya@brightpath-design.example',
      subject: 'Quick question about the proposal',
      bodyText:
        "Hello,\n\nThanks for sending over the proposal. It looks great. One question: is there any chance we could move the launch date up by a week? Our team is free earlier than we expected.\n\nIf that changes the price, just let me know.\n\nBest,\nPriya",
      bodyHtml: null,
      receivedAt: hoursAgo(4),
      status: 'needs_reply',
      tag: 'client',
      urgency: null,
    },
    {
      id: 'demo-3',
      threadId: 'demo-thread-3',
      from: 'Dana Whitfield',
      fromEmail: 'billing@northwind-supply.example',
      subject: 'Invoice #4821 is 5 days overdue',
      bodyText:
        'Hello,\n\nOur records show invoice #4821 for $1,240.00 was due 5 days ago and has not been paid. Please arrange payment or let us know if there is a problem with the invoice.\n\nThank you,\nDana Whitfield\nNorthwind Supply Accounts',
      bodyHtml: null,
      receivedAt: hoursAgo(9),
      status: 'needs_reply',
      tag: 'billing',
      urgency: null,
    },
    {
      id: 'demo-4',
      threadId: 'demo-thread-4',
      from: 'Marcus Lee',
      fromEmail: 'marcus@leeandsons.example',
      subject: "Can we move Thursday's call?",
      bodyText:
        "Hi,\n\nSomething came up on my end and I can't make our call on Thursday at 2pm. Could we move it to Friday morning instead? Anytime before noon works for me.\n\nSorry for the short notice.\n\nMarcus",
      bodyHtml: null,
      receivedAt: hoursAgo(22),
      status: 'needs_reply',
      tag: 'high_priority',
      urgency: null,
    },
    {
      id: 'demo-5',
      threadId: 'demo-thread-5',
      from: 'Maya Torres',
      fromEmail: 'hello@cedarcafe.example',
      subject: "This week's specials and a new loyalty card",
      bodyText:
        "Hi there,\n\nThis week we're serving a roasted squash soup and a new maple pecan scone. We also have a new loyalty card: buy nine drinks and get the tenth free.\n\nSee you soon,\nMaya\nCedar Café",
      bodyHtml: null,
      receivedAt: hoursAgo(30),
      status: 'needs_reply',
      tag: 'low_priority',
      urgency: null,
    },
    {
      id: 'demo-6',
      threadId: 'demo-thread-6',
      from: 'Jordan Rivera',
      fromEmail: 'jordan@rivera-studio.example',
      subject: 'Thanks for the quick turnaround!',
      bodyText:
        "Hi,\n\nJust wanted to say thank you for turning the changes around so quickly. Everything looks exactly how we wanted.\n\nJordan",
      bodyHtml: null,
      receivedAt: hoursAgo(50),
      status: 'replied',
      tag: 'client',
      urgency: null,
    },
  ];
}

// Pre-written replies, one set per sample email and tone. The wrapper below adds
// the greeting and sign-off so the three tones read differently.
const REPLY_CORES: Record<string, Record<Tone, string>> = {
  'demo-1': {
    friendly:
      "Thanks for flagging this, and sorry about the trouble. I'm looking into the order page right now and will message you within the hour with what I find. Your noon promotion is my top priority.",
    formal:
      'Thank you for alerting me to this issue. I am investigating the order page immediately and will update you within the hour. Resolving it before your noon promotion is my highest priority.',
    concise: "On it now. I'll update you within the hour, well before your noon promotion.",
  },
  'demo-2': {
    friendly:
      "Glad you like the proposal! Moving the launch up by a week should be doable. I'll check the schedule and send over any price change by tomorrow.",
    formal:
      'I am pleased that the proposal meets your expectations. An earlier launch date by one week appears feasible. I will confirm the schedule and any change in cost by tomorrow.',
    concise: "A week earlier should work. I'll confirm the schedule and any price change by tomorrow.",
  },
  'demo-3': {
    friendly:
      "Thanks for the reminder, and sorry for the delay on my end. I'll get the payment for invoice #4821 sent today and will let you know once it's on its way.",
    formal:
      'Thank you for the reminder. I apologize for the delay. Payment for invoice #4821 will be issued today, and I will confirm once it has been sent.',
    concise: "Apologies for the delay. I'll send payment for invoice #4821 today and confirm.",
  },
  'demo-4': {
    friendly:
      "No problem at all, things come up! Friday morning works for me. How about 10am? If that doesn't suit you, any time before noon is fine.",
    formal:
      'Thank you for letting me know. Friday morning is suitable for me. Would 10:00 AM work for you? I am happy to adjust to any time before noon.',
    concise: 'Friday at 10am works for me. Let me know if another time before noon is better.',
  },
  'demo-5': {
    friendly:
      "Thanks for the update! The new scone sounds delicious, and I'll stop by this week to grab a loyalty card.",
    formal: 'Thank you for sharing this week’s specials and the new loyalty card. I look forward to visiting soon.',
    concise: 'Thanks for the update. See you this week!',
  },
  'demo-6': {
    friendly: "You're very welcome! I'm so glad everything looks right. Let me know if you need anything else.",
    formal: 'You are most welcome. I am pleased the changes meet your expectations. Please let me know if you need anything further.',
    concise: "You're welcome. Glad it looks right.",
  },
};

const GREETINGS: Record<Tone, (name: string) => string> = {
  friendly: (name) => `Hi ${name},`,
  formal: (name) => `Dear ${name},`,
  concise: (name) => `${name},`,
};

const SIGN_OFFS: Record<Tone, string> = {
  friendly: 'Best,',
  formal: 'Sincerely,',
  concise: 'Thanks,',
};

export function getSampleReply(emailId: string, tone: Tone, signerName: string): string {
  const email = getSampleEmails().find((e) => e.id === emailId);
  const firstName = email ? email.from.split(' ')[0] : 'there';
  const core = REPLY_CORES[emailId]?.[tone] ?? REPLY_CORES['demo-6'][tone];
  return `${GREETINGS[tone](firstName)}\n\n${core}\n\n${SIGN_OFFS[tone]}\n${signerName}`;
}

/** Types the sample reply out word by word, like the real AI streaming a draft. */
export async function streamSampleReply(
  text: string,
  onProgress: (accumulated: string) => void
): Promise<string> {
  const parts = text.split(/(\s+)/);
  let accumulated = '';
  for (const part of parts) {
    accumulated += part;
    onProgress(accumulated);
    if (part.trim()) await new Promise((resolve) => setTimeout(resolve, 28));
  }
  return text;
}
