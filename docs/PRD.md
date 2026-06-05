# Product Requirements Document (PRD)
## AI Email Assistant

**Version:** 1.0  
**Date:** April 14, 2026  
**Status:** Draft

---

## 1. Product Overview

The AI Email Assistant is a mobile-first web application that helps small business owners and customer support representatives handle high volumes of incoming emails efficiently. The app connects to a user's Gmail or Outlook inbox, uses AI to draft contextually appropriate replies, and lets the user review, edit, regenerate, and approve each response before it is sent — keeping the human in control while dramatically reducing response time.

---

## 2. Problem Statement

Small business owners and support staff frequently receive more emails than they can respond to in a timely manner. Crafting individual replies is time-consuming, repetitive, and mentally fatiguing. Existing email clients offer no intelligent drafting assistance, and fully automated tools remove human oversight, risking incorrect or inappropriate responses.

**Core pain points:**
- Too many emails, not enough time to reply thoughtfully
- Repetitive replies to similar questions drain productivity
- Fear of missing important or urgent messages
- Fully automated tools feel risky — tone and accuracy errors can damage relationships

---

## 3. Target Users

**Primary:** Small business owners and customer support representatives who:
- Receive 20–200+ emails per day
- Need to respond quickly but maintain a human, professional tone
- Work from a desktop browser or mobile device
- Are not necessarily technical users

**Secondary:** Freelancers or consultants managing client communication at volume.

---

## 4. Assumptions

- Users have an active Gmail or Microsoft Outlook account
- Users are comfortable signing in via Google or Microsoft OAuth
- Users have access to an internet connection when using the app
- The AI drafting is powered by an external API (e.g. OpenAI GPT-4o)
- Each user manages one email account at a time
- Emails are not deleted or moved automatically — the app only reads and sends
- Users understand that AI drafts require review before sending

---

## 5. Core User Flows

### Flow 1: Onboarding
1. User visits the app URL
2. User selects "Sign in with Google" or "Sign in with Microsoft"
3. OAuth consent screen grants read + send email permissions
4. User is redirected to the Inbox view
5. User visits Settings and configures their preferred reply tone

### Flow 2: Reviewing and Replying to an Email
1. User opens the Inbox view — sees a list of emails
2. User taps/clicks an email to open it
3. User optionally applies a tag (e.g. Urgent, Client, Billing) and priority label
4. User taps "Generate Reply"
5. AI draft appears in the reply editor
6. User reads the draft; can:
   - Edit the text directly
   - Tap "Regenerate" for a new draft
   - Tap "Approve & Send" to send the reply
   - Tap "Discard" to dismiss without sending
7. On send: the reply is sent via the connected provider's API

### Flow 3: Organizing the Inbox
1. User opens the Inbox view
2. User applies a tag (Urgent, Client, Billing, Low Priority, Other) to individual emails
3. User uses filter controls to view by tag or status (Needs Reply / Replied / Ignored)
4. Replied and ignored emails are separated by status filter

### Flow 4: Settings Configuration
1. User opens Settings
2. User selects reply tone: Friendly / Formal / Concise
3. Changes are saved automatically and applied to all future AI drafts

---

## 6. Screen Requirements

| Screen | Description |
|--------|-------------|
| Login / Onboarding | Provider selection (Google / Microsoft), OAuth redirect |
| Inbox | List of emails with status indicators, tags, and sort/filter controls |
| Email Detail | Full email thread view, tagging, "Generate Reply" button |
| Reply Editor | AI-drafted reply with edit, regenerate, approve/send, discard actions |
| Settings | Tone selection, connected account info, sign-out |

---

## 7. Data Model

### User
```
{
  id: string,
  email: string,
  provider: "google" | "microsoft",
  accessToken: string,
  refreshToken: string,
  tone: "friendly" | "formal" | "concise",
  createdAt: timestamp
}
```

### Email (fetched from provider, not stored long-term)
```
{
  id: string,
  threadId: string,
  from: string,
  fromEmail: string,
  subject: string,
  bodyText: string,
  receivedAt: string (ISO),
  status: "needs_reply" | "replied" | "ignored",
  tag: "urgent" | "client" | "billing" | "low_priority" | "other" | null
}
```

> Note: Each email has one tag at a time (MVP). Priority labels are a Phase 2 feature.

### Draft
```
{
  emailId: string,
  content: string,
  generatedAt: timestamp,
  editedByUser: boolean
}
```

---

## 8. Functional Requirements

### MVP
- [ ] Google OAuth sign-in with Gmail read + send permissions
- [ ] Microsoft OAuth sign-in with Outlook read + send permissions
- [ ] Fetch and display inbox emails (most recent 50)
- [ ] Display full email content in detail view
- [ ] AI reply draft generation from email body content
- [ ] Reply editor: edit, regenerate, approve & send, discard
- [ ] Send reply via Gmail API or Microsoft Graph API
- [ ] Manual tagging of emails — one tag per email (Urgent, Client, Billing, Low Priority, Other)
- [ ] Offline detection banner with disabled actions when no internet connection
- [ ] Email status tracking: Needs Reply / Replied / Ignored
- [ ] Filter/sort inbox by tag and status
- [ ] Settings screen: tone selection (Friendly / Formal / Concise)
- [ ] Persist tone setting across sessions (LocalStorage)
- [ ] Mobile-first responsive UI

### Phase 2 Enhancements
- [ ] AI urgency detection with suggested priority labels
- [ ] Email search within the app
- [ ] Bulk tag application
- [ ] Reply history / sent log view
- [ ] Keyboard shortcuts for power users
- [ ] Pagination / load more emails (beyond 50)

### Phase 3 (Future)
- [ ] Multi-account support
- [ ] AI trained on user's own writing style (sample email upload)
- [ ] Business context / FAQ knowledge base for richer AI replies
- [ ] Team/shared inbox support
- [ ] Analytics dashboard (response rate, average response time)
- [ ] Push notifications for new emails

---

## 9. Non-Goals

- This app will NOT automatically send replies without user approval
- This app will NOT delete, archive, or move emails in the provider inbox
- This app will NOT support IMAP/SMTP generic providers in MVP
- This app will NOT support multiple email accounts simultaneously in MVP
- This app will NOT store email body content on our own backend server — it remains in-session only (email content is sent to the OpenAI API for draft generation and to the provider API for sending; both are third-party services with their own privacy policies)
- This app will NOT provide a full email client (compose new, folders, labels sync)

---

## 10. Edge Cases

| Scenario | Handling |
|----------|----------|
| OAuth token expires mid-session | Prompt user to re-authenticate; preserve current view |
| AI API is unavailable or times out | Show error message; allow manual reply or retry |
| Email has no text body (image-only or attachment-only) | Show notice: "No readable content to generate a reply from" |
| User sends reply but API call fails | Show error toast; keep draft intact for retry |
| Email thread has multiple previous replies | Show full thread context; generate reply based on latest message |
| User regenerates draft 5+ times | Allow unlimited regenerations; no cap |
| Empty inbox | Show friendly empty state: "You're all caught up!" |
| Very long email (>5000 tokens) | Truncate to first 3000 tokens for AI input; note truncation to user |

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Time to draft a reply | Under 30 seconds from opening email to AI draft |
| Draft acceptance rate | ≥ 60% of AI drafts sent with minimal or no edits |
| Daily active usage | User returns to app on at least 3 of 5 weekdays |
| Inbox zero rate | Users report clearing their queue faster than before |
| Error rate | < 5% of send actions result in an error |
| Mobile usability | App fully usable on a 375px wide screen with no horizontal scroll |

---

## 12. Future Roadmap

1. **Multi-account support** — manage Gmail + Outlook simultaneously
2. **Writing style learning** — upload sample emails to personalize AI tone
3. **Business knowledge base** — feed FAQs and product info to the AI for richer replies
4. **Team inbox** — share an inbox with colleagues, assign emails to team members
5. **Analytics dashboard** — track response times, volume handled, AI edit frequency
6. **Scheduled send** — approve a draft now, send it at a scheduled time
7. **Mobile PWA** — installable progressive web app with offline support
8. **Third-party integrations** — CRM sync (HubSpot, Notion, Airtable)
