import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInbox } from '../context/InboxContext';
import { generateDraft, scoreDraft } from '../services/openaiService';
import { loadDisplayName, loadReplyHistory, type ReplyHistoryEntry } from '../utils/tokenStorage';
import type { Tone } from '../types/user';

function normalizeSubject(subject: string): Set<string> {
  return new Set(
    subject
      .toLowerCase()
      .replace(/^(re|fwd?|fw):\s*/gi, '')
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}

export function useAIDraft(emailId: string) {
  const { user } = useAuth();
  const { draft, setDraft, clearDraft } = useInbox();

  const getSignerName = useCallback((): string => {
    return loadDisplayName() || user?.name || 'Your name';
  }, [user]);

  const findSimilarReply = useCallback((subject: string): ReplyHistoryEntry | null => {
    const history = loadReplyHistory();
    if (history.length === 0) return null;
    const subjectWords = normalizeSubject(subject);
    for (const entry of history) {
      const entryWords = normalizeSubject(entry.subject);
      if (jaccardSimilarity(subjectWords, entryWords) >= 0.5) return entry;
    }
    return null;
  }, []);

  async function runWithScoring(emailBody: string, tone: Tone, signerName: string) {
    const content = await generateDraft(emailBody, tone, signerName, (accumulated) => {
      setDraft({ emailId, content: accumulated, isLoading: true, error: null, confidence: null });
    });
    // Draft scoring temporarily disabled to preserve API quota on free-tier
    // OpenAI accounts (scoring adds a second API call per generate).
    // Re-enable once billing is set up by restoring the scoreDraft call below.
    setDraft({ emailId, content, isLoading: false, error: null, confidence: null });
    //
    // setDraft({ emailId, content, isLoading: false, error: null, confidence: { score: 0, feedback: '', isScoring: true } });
    // try {
    //   await new Promise((resolve) => setTimeout(resolve, 2000));
    //   const { score, feedback } = await scoreDraft(emailBody, content);
    //   setDraft({ emailId, content, isLoading: false, error: null, confidence: { score, feedback, isScoring: false } });
    // } catch {
    //   setDraft({ emailId, content, isLoading: false, error: null, confidence: null });
    // }
    return content;
  }

  const generate = useCallback(async (emailBody: string) => {
    if (!user) return;

    setDraft({ emailId, content: '', isLoading: true, error: null, confidence: null });

    try {
      await runWithScoring(emailBody, user.tone, getSignerName());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI service unavailable. Please try again.';
      setDraft({ emailId, content: '', isLoading: false, error: message, confidence: null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, emailId, setDraft, getSignerName]);

  const regenerate = useCallback(async (emailBody: string) => {
    if (!user) return;

    setDraft({ emailId, content: '', isLoading: true, error: null, confidence: null });

    try {
      await runWithScoring(emailBody, user.tone, getSignerName());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI service unavailable. Please try again.';
      setDraft({ emailId, content: '', isLoading: false, error: message, confidence: null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, emailId, setDraft, getSignerName]);

  const updateContent = useCallback((content: string) => {
    if (!draft) return;
    // Preserve confidence when user manually edits; clear score so it's not stale
    setDraft({ ...draft, content, confidence: null });
  }, [draft, setDraft]);

  return { draft, generate, regenerate, updateContent, clearDraft, findSimilarReply };
}
