# Feature Priority
## AI Email Assistant — MailAssist AI

**Version:** 1.0  
**Date:** April 14, 2026

---

## Prioritization Framework

Features are categorized using the **MoSCoW method** applied across three delivery phases:

- **MVP** — Must have for initial launch. Core value is impossible without these.
- **Phase 2 Enhancements** — Should have soon after launch. Meaningfully improve the experience once the core works.
- **Future Ideas** — Could have eventually. Valuable but non-critical; re-evaluate based on user feedback.

---

## MVP Features

These are the minimum set of features required to deliver the app's core value proposition: *connect an inbox, get AI-drafted replies, approve and send.*

| # | Feature | Reasoning |
|---|---------|-----------|
| 1 | Google OAuth sign-in (Gmail) | Without auth + inbox connection, the app cannot function |
| 2 | Microsoft OAuth sign-in (Outlook) | Second required provider from product decisions |
| 3 | Fetch and display last 50 inbox emails | Users need to see their emails before they can act on them |
| 4 | Email detail view (full body) | Users must read the email before generating a reply |
| 5 | AI reply draft generation (email content → GPT) | Core product value — the primary reason to use this app |
| 6 | Reply editor with editable text area | User must be able to review and refine the AI draft |
| 7 | Regenerate draft button | Essential for when the first draft is wrong; drives trust |
| 8 | Approve & Send action (via Gmail API / Graph API) | Without sending, the workflow is incomplete |
| 9 | Discard draft option | User must be able to abandon a draft safely |
| 10 | Manual email tagging (Urgent, Client, Billing, Low Priority, Other) | Users want to organize; identified in interview as primary need |
| 11 | Email status tracking (Needs Reply / Replied / Ignored) | Prevents duplicate replies; shows progress through the inbox |
| 12 | Filter inbox by tag and status | Required to act on organized emails; pairs with tagging |
| 13 | Tone setting in Settings (Friendly / Formal / Concise) | Identified in interview; affects every AI draft |
| 14 | Persist tone setting across sessions (LocalStorage) | Without persistence, user must reconfigure every session |
| 15 | Settings screen (account info, tone, sign-out) | Required for account management and configuration |
| 16 | Mobile-first responsive UI | Core platform constraint; must work on 375px screens |
| 17 | OAuth token refresh (silent re-auth) | Without this, sessions break after 1 hour |
| 18 | Loading states and skeleton UI | Without feedback, the app feels broken during API calls |
| 19 | Error handling for AI + send failures | Real-world reliability; errors will occur |
| 20 | Empty state screen (inbox zero + filter no-results) | UX polish required for "inbox zero" users |
| 21 | Offline detection banner + disabled action buttons | Safety requirement — prevents silent failures when network drops |
| 22 | Refresh inbox button (manual reload) | Needed to access new emails and shown in empty state wireframe |

---

## Phase 2 Enhancements

These features add meaningful value after the core loop is proven and stable. Priority order within this phase is approximate.

| # | Feature | Reasoning |
|---|---------|-----------|
| 1 | Email search (within the app) | High-volume users need to find specific emails quickly |
| 2 | AI urgency detection with suggested priority | Reduces manual tagging effort; makes organizing faster |
| 3 | Sent / reply history log | Users want a record of what was sent and when |
| 4 | Pagination / load more emails (beyond 50) | Power users will hit the 50-email cap frequently |
| 5 | Bulk tagging (select multiple emails, apply tag) | Manual tagging one-by-one becomes tedious at scale |
| 6 | Keyboard shortcuts for desktop power users | Productivity boost for users who stay at a desk |
| 7 | Toast undo for "Mark as Ignored" | Prevents accidental data loss |
| 8 | Streaming AI response (token-by-token display) | Makes AI feel faster and more responsive |
| 9 | Offline full caching + background sync (Service Worker / Workbox) | MVP shows the offline banner; Phase 2 enables a richer offline experience |

---

## Future Ideas

These are worth tracking but should only be built based on real user demand and feedback after Phase 2.

| # | Feature | Reasoning |
|---|---------|-----------|
| 1 | Multi-account support (Gmail + Outlook simultaneously) | High complexity; user confirmed single account for MVP |
| 2 | AI writing style learning from sample emails | Powerful personalization but requires significant prompt engineering |
| 3 | Business knowledge base / FAQ for AI context | Great for customer support use cases; requires UI for content entry |
| 4 | Team / shared inbox support | Requires user management, permissions, backend — major scope increase |
| 5 | Analytics dashboard (response time, volume, edit rate) | Valuable for business users but requires data collection infrastructure |
| 6 | Push notifications for new emails | Requires Service Worker + backend push service (e.g. Web Push API) |
| 7 | Scheduled send (draft now, send later) | Convenient but low urgency for most users |
| 8 | Progressive Web App (PWA) with offline full support | Installable app experience; meaningful investment after core is stable |
| 9 | Third-party CRM integrations (HubSpot, Notion, Airtable) | Highly valuable for business users; requires dedicated integration work per CRM |
| 10 | Email thread summary by AI | Useful for long threads; add when users report friction reading history |
| 11 | Custom tags (user-defined tag names) | Currently fixed tag list; allow customization after validating tag usage patterns |
| 12 | Dark mode | Common user request; implement after core UX is validated |

---

## Feature Map Summary

```
MVP (Launch)
├── Auth (Google + Microsoft OAuth)
├── Inbox (fetch, display, filter, tag, status, manual refresh)
├── Email Detail (full view, tagging)
├── Reply Flow (generate, edit, regenerate, send, discard)
├── Settings (tone, account, sign-out)
└── Core UX (loading, error, empty states, offline banner)

Phase 2 (Post-launch improvements)
├── Search
├── AI urgency detection
├── Sent log
├── Pagination
├── Bulk tagging
├── Keyboard shortcuts
├── Streaming AI responses
└── Offline full caching + background sync (Service Worker)

Future (Based on user demand)
├── Multi-account
├── Writing style learning
├── Business knowledge base
├── Team inbox
├── Analytics
└── PWA + integrations
```

---

## Scope Decisions Explained

**Why is search not in MVP?**  
The 50-email fetch window makes search less critical initially. Users can visually scan a short list. Adding search before the core reply flow is proven would be premature optimization.

**Why is urgency detection not in MVP?**  
Manual tagging was the user's explicit choice in the interview. Introducing AI tagging simultaneously with AI drafting adds complexity and potential confusion about what the AI is doing. Validate manual tagging first.

**Why is dark mode in Future?**  
Design system is built with Tailwind, making dark mode straightforward to add later. It does not affect core functionality and should wait until the product is stable.

**Why is multi-account in Future?**  
User explicitly chose single-account in the interview. Building multi-account now would add significant complexity (token management, UI context-switching) without validated demand.
