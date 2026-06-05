# Test Plan
## AI Email Assistant — MailAssist AI

**Version:** 1.0  
**Date:** April 14, 2026

All tests are written in plain language and can be executed manually by a non-developer tester or implemented as automated tests.

---

## 1. Core User Flow Tests

### Flow 1: Onboarding — Google Sign-In

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 1.1 | Open the app URL in a browser | Login screen appears with "Sign in with Google" and "Sign in with Microsoft" buttons | |
| 1.2 | Tap "Sign in with Google" | Google OAuth consent screen opens | |
| 1.3 | Sign in with a valid Google account and grant permissions | User is redirected to the Inbox screen | |
| 1.4 | Inbox screen loads | A list of recent emails appears (or empty state if inbox is empty) | |
| 1.5 | Close and reopen the app (same browser) | User is still logged in — no need to sign in again | |

---

### Flow 2: Onboarding — Microsoft Sign-In

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 2.1 | Open the app URL | Login screen appears | |
| 2.2 | Tap "Sign in with Microsoft" | Microsoft OAuth consent screen opens | |
| 2.3 | Sign in with a valid Microsoft/Outlook account and grant permissions | User is redirected to the Inbox screen | |
| 2.4 | Inbox shows Outlook emails | Emails from the Outlook inbox are displayed | |

---

### Flow 3: Viewing the Inbox

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 3.1 | Open Inbox screen | Up to 50 most recent emails are shown | |
| 3.2 | Scroll down through the list | Emails scroll smoothly; no layout breaking | |
| 3.3 | Each email row shows | Sender name, subject, preview text, timestamp, and tag/status badge | |
| 3.4 | Apply "Needs Reply" filter | Only emails with "Needs Reply" status are shown | |
| 3.5 | Apply a tag filter (e.g. "Client") | Only emails tagged "Client" are shown | |
| 3.6 | Clear all filters | Full inbox list returns | |

---

### Flow 4: Opening an Email

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 4.1 | Tap an email in the inbox | Email Detail screen opens with full content | |
| 4.2 | Email body is displayed | Complete email text is readable and properly formatted | |
| 4.3 | Sender name and address are shown | Correct sender information visible at the top | |
| 4.4 | Timestamp is shown | Correct date/time of the email | |
| 4.5 | Tag selector is visible | Shows current tag or "No tag" state | |
| 4.6 | Tap "Back" | Returns to Inbox screen at the same scroll position | |

---

### Flow 5: Tagging an Email

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 5.1 | Open an email and tap the tag selector | Dropdown shows: Urgent, Client, Billing, Low Priority, Other | |
| 5.2 | Select "Urgent" | Tag updates to "Urgent"; badge appears on the email in the list | |
| 5.3 | Change tag to "Billing" | Tag updates; previous "Urgent" badge replaced | |
| 5.4 | Close and reopen the app | Tag is still "Billing" (persisted in LocalStorage) | |

---

### Flow 6: Generating an AI Reply Draft

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 6.1 | Open an email and tap "Generate AI Reply" | Loading state (skeleton) appears in the reply editor | |
| 6.2 | AI draft finishes loading | Reply text appears in the editor, pre-populated with a complete reply | |
| 6.3 | Draft is in the configured tone | If tone is "Friendly," reply sounds warm; if "Formal," it sounds professional | |
| 6.4 | Draft is relevant to the email content | AI reply addresses the subject matter of the email | |
| 6.5 | Draft appears in an editable text area | User can click/tap and modify the text | |

---

### Flow 7: Editing the Draft

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 7.1 | Tap inside the reply editor | Cursor appears; keyboard shows on mobile | |
| 7.2 | Type additional text | Text appears as typed; no lag | |
| 7.3 | Delete text | Text is removed correctly | |
| 7.4 | Edit draft extensively | All changes are preserved in the editor | |

---

### Flow 8: Regenerating the Draft

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 8.1 | With a draft visible, tap "Regenerate Draft" | Loading state appears; previous draft is replaced | |
| 8.2 | New draft appears | Content is different from the previous draft | |
| 8.3 | Regenerate a second time | Another new draft appears | |
| 8.4 | After 5 regenerations | No cap — regeneration still works | |

---

### Flow 9: Approving and Sending a Reply

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 9.1 | With a draft ready, tap "Approve & Send" | Sending state (spinner or button disabled) briefly appears | |
| 9.2 | Send succeeds | Success toast "Reply sent!" appears at bottom of screen | |
| 9.3 | Email status updates | Email moves to "Replied" status in the inbox list | |
| 9.4 | Navigate back to Inbox | Email shows ✅ "Replied" indicator | |
| 9.5 | Check actual email inbox (Gmail/Outlook) | Sent reply appears in the provider's sent folder | |

---

### Flow 10: Discarding a Draft

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 10.1 | With a draft visible, tap "Discard Draft" | Confirmation prompt or immediate discard (per implementation) | |
| 10.2 | Confirm discard | Editor clears; user returns to Email Detail screen | |
| 10.3 | Email status is unchanged | Still shows "Needs Reply" — no reply was sent | |

---

### Flow 11: Marking an Email as Ignored

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 11.1 | Open an email and tap "Mark as Ignored" | Email status changes to "Ignored" | |
| 11.2 | Navigate to inbox and apply "Ignored" filter | Email appears in the Ignored list | |
| 11.3 | Apply "Needs Reply" filter | Email does not appear | |

---

### Flow 12: Settings — Changing Tone

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 12.1 | Open Settings screen | Current tone is shown as selected (radio button) | |
| 12.2 | Select "Formal" tone | Radio selection updates immediately | |
| 12.3 | Close and reopen the app | Tone setting is still "Formal" | |
| 12.4 | Generate an AI reply | Reply uses a formal, professional tone | |

---

### Flow 13: Sign Out

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 13.1 | Open Settings and tap "Sign Out" | Confirmation dialog appears | |
| 13.2 | Confirm sign out | User is redirected to the Login screen | |
| 13.3 | Reload the app | Login screen is shown (user is not auto-logged in) | |
| 13.4 | Auth tokens are cleared | LocalStorage no longer contains access/refresh tokens | |

### Flow 14: Disconnect Account

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 14.1 | Open Settings and tap "Disconnect Account" | Confirmation dialog appears | |
| 14.2 | Confirm disconnect | Tokens cleared; user redirected to Login screen | |
| 14.3 | Behavior is equivalent to Sign Out for MVP | Both actions clear all auth data and return to Login | |

> Note: In MVP, "Disconnect" and "Sign Out" produce the same result (clear tokens + redirect to Login). The label "Disconnect" is shown next to the connected account details; "Sign Out" is shown at the bottom of Settings. Both are safe to implement as the same action.

---

## 2. Edge Case Tests

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| E1 | Open an email with no text body (e.g. image-only) | "No readable content — cannot generate a reply" message shown |
| E2 | Email is extremely long (newsletter, 5000+ words) | App truncates the content for AI; shows a note "Email was shortened for AI processing" |
| E3 | AI API is down or returns an error | Error banner in editor: "AI unavailable — please try again" with a retry button |
| E4 | Send fails due to provider API error | Error toast: "Failed to send — please try again." Draft is preserved in editor |
| E5 | OAuth token is expired mid-session | User is prompted to re-authenticate; current email context is preserved where possible |
| E6 | User tries to sign in with a Gmail account after already signing in with Microsoft | Existing session is replaced (one account at a time) |
| E7 | Inbox is completely empty | Empty state screen shown: "You're all caught up!" with a Refresh button |
| E8 | No emails match the current filter | Empty state for filter: "No emails match this filter" with Clear Filters button |
| E9 | User tries to regenerate draft while offline | Button is disabled; offline banner visible |
| E10 | Tone is changed in Settings while Reply Editor is open | New tone applies to the next regeneration only; existing draft is unchanged |
| E11 | Reply is sent to an email that was already replied to | Send proceeds normally — no duplicate detection in MVP |
| E12 | Network drops between clicking "Approve & Send" and the send completing | Error toast shown; draft preserved for retry |
| E13 | Email is part of a thread with multiple previous messages | Full thread shown in detail view; AI draft generated based on the most recent message in the thread |

---

## 3. Offline Scenario Tests

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| O1 | Open app while offline | App shell loads; "You are offline" banner is displayed |
| O2 | Open the inbox while offline (without navigating away first) | Previously loaded emails remain visible in React state (in-memory); no new fetch is attempted. Reloading the page while offline will show a loading/error state as emails cannot be refetched. |
| O3 | Try to generate AI reply while offline | "Generate Reply" button is disabled; tooltip or note explains offline status |
| O4 | Try to send a reply while offline | "Approve & Send" button is disabled |
| O5 | Reconnect to internet while the app is open | Banner disappears; buttons re-enable |
| O6 | Try to change tag while offline | Tag change applies locally (LocalStorage) — no API required |

---

## 4. Data Persistence Tests

| # | What is Tested | Steps | Expected Result |
|---|---------------|-------|-----------------|
| P1 | Tone persists after page refresh | Set tone to "Concise" → refresh page | Settings screen shows "Concise" selected |
| P2 | Tags persist after page refresh | Tag email as "Urgent" → refresh page | Email still shows "Urgent" tag |
| P3 | Login persists across sessions | Sign in → close browser tab → reopen | User is still logged in |
| P4 | Auth token is refreshed silently | Wait for token expiry (1 hour) → try to fetch emails | New emails load without re-authentication prompt |
| P5 | Sign-out clears all data | Sign out → check LocalStorage | Tokens, tone preference cleared |
| P6 | Email content is not persisted | Open email → generate draft → refresh page | Draft is gone (drafts are in-memory only) |

---

## 5. UI Validation Tests

| # | What is Tested | Expected Result |
|---|---------------|-----------------|
| U1 | Mobile layout at 375px width | All content fits; no horizontal scrollbar; no text overflow |
| U2 | Tablet layout at 768px | Two-column layout activates; email list + detail panel visible side by side |
| U3 | Desktop layout at 1280px | Content is centered with max-width container; not stretched to full width |
| U4 | Touch targets on mobile | All buttons and interactive elements are at least 44×44px |
| U5 | Long email subject truncation | Email list row truncates long subjects with "…" — no layout breaking |
| U6 | Long sender name | Truncated gracefully in list view |
| U7 | Reply editor on mobile | Keyboard opens without covering the "Approve & Send" button |
| U8 | Loading skeleton on email list | Skeleton rows animate while emails are fetching |
| U9 | Loading skeleton on draft generation | Skeleton lines animate in the editor while AI is processing |
| U10 | Success toast visibility | Toast appears above the bottom navigation; fully readable |
| U11 | Error state in reply editor | Error message is clear and actionable; "Try Again" button is visible |
| U12 | Empty inbox state | Illustration (or icon) + message is centered and friendly-looking |
| U13 | Tag badges are readable | All tag colors meet WCAG contrast requirements |
| U14 | Focus states are visible | Tabbing through the app shows visible focus rings on all interactive elements |
| U15 | Sign-out confirmation dialog | Dialog appears, has clear "Confirm" and "Cancel" actions |

---

## 6. Acceptance Criteria (Definition of Done)

The app is ready for launch when ALL of the following are true:

- [ ] User can sign in with Google and access their Gmail inbox
- [ ] User can sign in with Microsoft and access their Outlook inbox
- [ ] User can generate an AI reply for any email with a readable body
- [ ] User can edit, regenerate, and send the AI draft
- [ ] Sent emails appear in the provider's sent folder
- [ ] Emails can be tagged and filtered
- [ ] Tone preference persists across sessions
- [ ] App is fully usable on a 375px mobile screen
- [ ] Offline state is communicated clearly; no silent failures
- [ ] All core error states show actionable messages
- [ ] All edge cases in Section 2 behave as documented
