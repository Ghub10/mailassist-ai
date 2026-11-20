import type { User } from '../types/user';
import { supabase } from '../services/supabaseClient';

const USER_KEY = 'mailassist_user';
const DISPLAY_NAME_KEY = 'mailassist_display_name';
const REPLY_HISTORY_KEY = 'mailassist_reply_history';
const REPLY_HISTORY_MAX = 100;

export function saveUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

// Clears only auth credentials — tags, statuses, and reply history are preserved
// so they survive a sign-out / re-sign-in (e.g. re-consenting OAuth scopes).
export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(DISPLAY_NAME_KEY);
}

// Full reset — wipes everything including tags, statuses, and reply history.
// Only call this on an explicit "Disconnect Account" action.
export function clearAllData(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(DISPLAY_NAME_KEY);
  localStorage.removeItem(REPLY_HISTORY_KEY);
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('tag_') || key.startsWith('status_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

export function isTokenExpired(user: User): boolean {
  // Consider token expired 5 minutes before actual expiry to avoid edge cases
  return Date.now() > user.tokenExpiry - 5 * 60 * 1000;
}

/** Reads the signed-in user's email from localStorage to use as Supabase user_id. */
function getCurrentUserId(): string | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as User;
    // Sample-mode visitors are never written to the database.
    if (user.isDemo) return null;
    return user.email ?? null;
  } catch {
    return null;
  }
}

export function saveEmailTag(emailId: string, tag: string | null): void {
  if (tag === null) {
    localStorage.removeItem(`tag_${emailId}`);
  } else {
    localStorage.setItem(`tag_${emailId}`, tag);
  }
  const userId = getCurrentUserId();
  if (userId) pushTagToSupabase(userId, emailId, tag);
}

export function loadEmailTag(emailId: string): string | null {
  return localStorage.getItem(`tag_${emailId}`);
}

export function saveEmailStatus(emailId: string, status: string): void {
  localStorage.setItem(`status_${emailId}`, status);
  const userId = getCurrentUserId();
  if (userId) pushStatusToSupabase(userId, emailId, status);
}

export function loadEmailStatus(emailId: string): string | null {
  return localStorage.getItem(`status_${emailId}`);
}

export function saveDisplayName(name: string): void {
  localStorage.setItem(DISPLAY_NAME_KEY, name);
  const userId = getCurrentUserId();
  if (userId) pushDisplayNameToSupabase(userId, name);
}

export function loadDisplayName(): string | null {
  return localStorage.getItem(DISPLAY_NAME_KEY);
}

export interface ReplyHistoryEntry {
  subject: string;
  bodySnippet: string;
  replyText: string;
  sentAt: string;
}

export function saveReplyToHistory(entry: ReplyHistoryEntry): void {
  const history = loadReplyHistory();
  const updated = [entry, ...history].slice(0, REPLY_HISTORY_MAX);
  localStorage.setItem(REPLY_HISTORY_KEY, JSON.stringify(updated));
  const userId = getCurrentUserId();
  if (userId) pushReplyToSupabase(userId, entry);
}

export function loadReplyHistory(): ReplyHistoryEntry[] {
  const raw = localStorage.getItem(REPLY_HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ReplyHistoryEntry[];
  } catch {
    return [];
  }
}

// ─── Supabase sync helpers ────────────────────────────────────────────────────
// All Supabase calls are fire-and-forget (no await at call sites) so they
// never block the UI. localStorage remains the synchronous local cache.

/** Pull all user data from Supabase and write it into localStorage. */
export async function syncFromSupabase(userId: string): Promise<void> {
  if (!supabase) return;
  try {
    const [tagsRes, statusesRes, prefsRes, historyRes] = await Promise.all([
      supabase.from('email_tags').select('email_id, tag').eq('user_id', userId),
      supabase.from('email_statuses').select('email_id, status').eq('user_id', userId),
      supabase.from('user_preferences').select('display_name, tone').eq('user_id', userId).maybeSingle(),
      supabase.from('reply_history').select('subject, body_snippet, reply_text, sent_at').eq('user_id', userId).order('sent_at', { ascending: false }).limit(REPLY_HISTORY_MAX),
    ]);

    if (tagsRes.data) {
      for (const row of tagsRes.data) {
        if (row.tag) {
          localStorage.setItem(`tag_${row.email_id}`, row.tag);
        } else {
          localStorage.removeItem(`tag_${row.email_id}`);
        }
      }
    }

    if (statusesRes.data) {
      for (const row of statusesRes.data) {
        localStorage.setItem(`status_${row.email_id}`, row.status);
      }
    }

    if (prefsRes.data) {
      if (prefsRes.data.display_name) {
        localStorage.setItem(DISPLAY_NAME_KEY, prefsRes.data.display_name);
      }
    }

    if (historyRes.data) {
      const entries: ReplyHistoryEntry[] = historyRes.data.map((row) => ({
        subject: row.subject ?? '',
        bodySnippet: row.body_snippet ?? '',
        replyText: row.reply_text ?? '',
        sentAt: row.sent_at ?? new Date().toISOString(),
      }));
      localStorage.setItem(REPLY_HISTORY_KEY, JSON.stringify(entries));
    }
  } catch {
    // Supabase unavailable — localStorage cache is still usable
  }
}

/** Upsert a tag change to Supabase (fire-and-forget). */
export function pushTagToSupabase(userId: string, emailId: string, tag: string | null): void {
  if (!supabase) return;
  if (tag === null) {
    supabase.from('email_tags').delete().eq('user_id', userId).eq('email_id', emailId).then(() => {});
  } else {
    supabase.from('email_tags').upsert({ user_id: userId, email_id: emailId, tag, updated_at: new Date().toISOString() }).then(() => {});
  }
}

/** Upsert a status change to Supabase (fire-and-forget). */
export function pushStatusToSupabase(userId: string, emailId: string, status: string): void {
  if (!supabase) return;
  supabase.from('email_statuses').upsert({ user_id: userId, email_id: emailId, status, updated_at: new Date().toISOString() }).then(() => {});
}

/** Upsert display name to Supabase (fire-and-forget). */
export function pushDisplayNameToSupabase(userId: string, displayName: string): void {
  if (!supabase) return;
  supabase.from('user_preferences').upsert({ user_id: userId, display_name: displayName, updated_at: new Date().toISOString() }).then(() => {});
}

/** Upsert tone preference to Supabase (fire-and-forget). */
export function pushToneToSupabase(userId: string, tone: string): void {
  if (!supabase) return;
  supabase.from('user_preferences').upsert({ user_id: userId, tone, updated_at: new Date().toISOString() }).then(() => {});
}

/** Insert a reply history entry to Supabase (fire-and-forget). */
export function pushReplyToSupabase(userId: string, entry: ReplyHistoryEntry): void {
  if (!supabase) return;
  supabase.from('reply_history').insert({
    user_id: userId,
    subject: entry.subject,
    body_snippet: entry.bodySnippet,
    reply_text: entry.replyText,
    sent_at: entry.sentAt,
  }).then(() => {});
}
