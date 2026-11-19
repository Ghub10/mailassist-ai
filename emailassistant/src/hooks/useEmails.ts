import { useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInbox } from '../context/InboxContext';
import { fetchGmailEmails } from '../services/gmailService';
import { fetchOutlookEmails } from '../services/outlookService';
// classifyUrgency disabled to reduce API calls on free-tier accounts
import { getValidGoogleToken } from '../services/authService';
import { refreshMicrosoftToken } from '../services/msalService';
import { isTokenExpired } from '../utils/tokenStorage';
import { getSampleEmails } from '../data/sampleMode';

export function useEmails() {
  const { user, updateToken } = useAuth();
  const { setEmails, setLoading, setError, updateUrgencyBatch } = useInbox();
  const inFlightRef = useRef(false);

  const fetchEmails = useCallback(async () => {
    if (!user) return;
    // Synchronously block overlapping fetches (e.g. StrictMode double-invoke)
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setLoading(true);
    setError(null);

    // Sample mode: show the built-in emails, never contact Gmail or Outlook.
    if (user.isDemo) {
      setEmails(getSampleEmails());
      inFlightRef.current = false;
      return;
    }

    try {
      let token = user.accessToken;

      // Silently refresh token if expired before fetching
      if (isTokenExpired(user)) {
        if (user.provider === 'google') {
          token = await getValidGoogleToken(user);
        } else {
          const refreshed = await refreshMicrosoftToken(user);
          token = refreshed.accessToken;
          updateToken(refreshed.accessToken, refreshed.tokenExpiry);
        }
        updateToken(token, user.tokenExpiry);
      }

      const emails =
        user.provider === 'google'
          ? await fetchGmailEmails(token)
          : await fetchOutlookEmails(token);

      setEmails(emails);

      // Urgency classification temporarily disabled to preserve API quota on
      // free-tier OpenAI accounts. Re-enable once billing is set up by
      // uncommenting the block below.
      //
      // setTimeout(() => {
      //   classifyUrgency(emails).then((urgencyMap) => {
      //     const items = Object.entries(urgencyMap).map(([id, urgency]) => ({ id, urgency }));
      //     if (items.length > 0) updateUrgencyBatch(items);
      //   }).catch(() => {});
      // }, 8_000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load emails';
      setError(message);
    } finally {
      inFlightRef.current = false;
    }
  }, [user, setEmails, setLoading, setError, updateToken, updateUrgencyBatch]);

  return { fetchEmails };
}
