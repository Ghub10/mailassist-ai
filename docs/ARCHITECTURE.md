# Architecture Document
## AI Email Assistant

**Version:** 1.0  
**Date:** April 14, 2026

---

## 1. Recommended Tech Stack

> These are recommendations based on project requirements. Each item is labeled as **Required** (tied to a core product decision) or **Recommended** (best default for this use case).

| Layer | Technology | Status | Reason |
|-------|-----------|--------|--------|
| Build tool | Vite | Recommended | Fast dev server, excellent React/TS support |
| UI framework | React 18 | Recommended | Component model ideal for email list + editor UI |
| Language | TypeScript | Recommended | Type safety for API responses and data models |
| Styling | TailwindCSS | Recommended | Mobile-first utility classes, rapid UI iteration |
| Auth — Google | Google OAuth 2.0 (PKCE) | Required | Gmail access requires Google OAuth |
| Auth — Microsoft | MSAL.js (Microsoft Authentication Library) | Required | Outlook access requires Microsoft OAuth |
| Email API — Gmail | Gmail REST API (Google APIs JS Client) | Required | Read + send Gmail emails |
| Email API — Outlook | Microsoft Graph API | Required | Read + send Outlook emails |
| AI drafting | OpenAI API (GPT-4o) | Recommended | High-quality reply generation from email content |
| State management | React Context + useReducer | Recommended | Simple; avoids Redux overhead for MVP scope |
| Persistence | LocalStorage | Recommended | Store tone setting, auth tokens (encrypted) |
| Routing | React Router v6 | Recommended | Client-side routing for screens |
| HTTP client | native fetch / axios | Recommended | Lightweight API calls |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                   │
│                                                       │
│  ┌──────────┐   ┌──────────┐   ┌─────────────────┐  │
│  │  React   │   │  State   │   │  LocalStorage   │  │
│  │   UI     │◄─►│ Context  │◄─►│  (tone, token)  │  │
│  └────┬─────┘   └──────────┘   └─────────────────┘  │
│       │                                               │
│  ┌────▼──────────────────────────────────────────┐   │
│  │              API Service Layer                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐  │   │
│  │  │  Gmail   │  │ MS Graph │  │  OpenAI    │  │   │
│  │  │  Client  │  │  Client  │  │   Client   │  │   │
│  │  └──────────┘  └──────────┘  └────────────┘  │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         │                │               │
         ▼                ▼               ▼
   Gmail API       MS Graph API     OpenAI API
   (Google)        (Microsoft)      (External)
```

---

## 3. Project Folder Structure

```
emailassistant/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                  # App entry point
│   ├── App.tsx                   # Root component + router
│   │
│   ├── components/               # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx             # Tag/status badge
│   │   ├── EmailListItem.tsx     # Single email row
│   │   ├── ReplyEditor.tsx       # Draft editor with actions
│   │   ├── ToneSelector.tsx      # Tone radio buttons
│   │   └── EmptyState.tsx
│   │
│   ├── screens/                  # Top-level page components
│   │   ├── LoginScreen.tsx       # OAuth provider selection
│   │   ├── InboxScreen.tsx       # Email list with filters
│   │   ├── EmailDetailScreen.tsx # Full email + reply flow
│   │   └── SettingsScreen.tsx    # Tone + account info
│   │
│   ├── context/                  # Global state
│   │   ├── AuthContext.tsx       # User auth state
│   │   └── InboxContext.tsx      # Email list + tag state
│   │
│   ├── services/                 # External API integration
│   │   ├── gmailService.ts       # Gmail API calls
│   │   ├── outlookService.ts     # MS Graph API calls
│   │   ├── openaiService.ts      # AI draft generation
│   │   └── authService.ts        # OAuth token management
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useEmails.ts          # Fetch + cache emails
│   │   └── useAIDraft.ts         # Generate + regenerate draft
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── email.ts
│   │   ├── user.ts
│   │   └── draft.ts
│   │
│   ├── utils/                    # Pure utility functions
│   │   ├── tokenStorage.ts       # LocalStorage helpers
│   │   ├── emailParser.ts        # Extract plain text from email
│   │   └── prompts.ts            # AI prompt templates
│   │
│   └── styles/
│       └── index.css             # Tailwind base imports
│
├── .env.example                  # Required env variable names
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 4. State Management Approach

**Strategy: React Context + useReducer**

Two context providers:

### AuthContext
Holds: current user, provider type, access token, tone preference  
Actions: `LOGIN`, `LOGOUT`, `SET_TONE`  
Persists: token + tone to LocalStorage on change

### InboxContext
Holds: email list, active filters, selected email, current draft  
Actions: `SET_EMAILS`, `UPDATE_EMAIL_STATUS`, `SET_TAGS`, `SET_DRAFT`, `CLEAR_DRAFT`  
Does NOT persist: email content is always fetched fresh from provider API

**Why not Redux or Zustand?**  
MVP scope is small. Context + useReducer gives the same predictability without extra dependencies. Can migrate to Zustand in Phase 2 if performance becomes a concern.

---

## 5. Data Persistence Strategy

| Data | Storage | Reason |
|------|---------|--------|
| Reply tone preference | LocalStorage | Lightweight, persistent, no server needed |
| OAuth access token | LocalStorage (with expiry check) | Allows re-use across sessions |
| OAuth refresh token | LocalStorage | Used to silently refresh access token |
| Email content | In-memory only (React state) | Privacy — emails never written to disk/server |
| Tags applied to emails | LocalStorage (keyed by email ID) | Persist user organization across sessions |
| AI drafts | In-memory only | Discarded when screen unmounts |

> **Privacy note:** No email body content is stored in LocalStorage or sent to any server other than the provider's own API and the OpenAI API for draft generation.

---

## 6. Authentication Flow

```
User selects provider
       │
       ▼
OAuth redirect to Google / Microsoft
       │
       ▼
User grants permissions:
  Gmail: gmail.readonly + gmail.send
  Outlook: Mail.Read + Mail.Send
       │
       ▼
OAuth callback → receive auth code
       │
       ▼
Exchange code for access + refresh token (PKCE)
       │
       ▼
Store tokens in LocalStorage
       │
       ▼
Redirect to Inbox screen
```

Token refresh: check token expiry before every API call; silently refresh using refresh token if expired.

---

## 7. AI Draft Generation Flow

```
User taps "Generate Reply"
       │
       ▼
Read email body text (plain text extraction)
       │
       ▼
Read tone setting from AuthContext
       │
       ▼
Build prompt:
  "You are an email assistant. Draft a reply to this email.
   Tone: {tone}. Email: {emailBody}"
       │
       ▼
POST to OpenAI Chat Completions API
       │
       ▼
Return draft text → populate ReplyEditor
       │
       ▼
User edits / regenerates / approves
       │
       ▼
On approve: call Gmail API or MS Graph send endpoint
```

---

## 8. Offline Capability Strategy

**MVP: Limited offline support**

- App shell (UI) loads and renders from cache via browser caching
- If offline, show a clear banner: "You are offline — email actions require a connection"
- Disable "Generate Reply" and "Send" buttons when navigator.onLine is false
- Cached email list (from last fetch) is still viewable while offline
- No background sync in MVP

**Phase 2:** Implement a Service Worker (Workbox) for full offline caching + background sync of pending sends.

---

## 9. Performance Considerations

| Concern | Strategy |
|---------|----------|
| Large inbox list rendering | Virtualized list (react-window) in Phase 2; 50-item cap for MVP |
| AI draft latency | Show skeleton/spinner immediately; stream tokens if OpenAI streaming is enabled |
| OAuth token API overhead | Cache tokens; check expiry before refresh to avoid unnecessary calls |
| Bundle size | Vite tree-shaking; lazy-load screen components with React.lazy |
| Mobile network | Minimize API payloads; only fetch email headers for list view, full body on open |

---

## 10. Accessibility Considerations

- All interactive elements have visible focus states (Tailwind `focus-visible` ring)
- Color is never the only indicator of meaning (badges include text labels)
- Buttons have descriptive `aria-label` attributes
- Reply editor textarea is keyboard accessible
- Font sizes respect user browser settings (use `rem` units)
- Touch targets minimum 44×44px on mobile
- Loading and error states announced via `aria-live` regions
- Contrast ratios meet WCAG 2.1 AA minimum (4.5:1 for text)

---

## 11. Environment Variables

```env
# .env.example
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_MICROSOFT_CLIENT_ID=your_microsoft_oauth_client_id
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_APP_URL=http://localhost:5173
```

> **Security note:** In production, the OpenAI API key should be proxied through a serverless function (e.g. Vercel Edge Function) to prevent exposure in client-side code. For MVP/development, the key is used client-side with appropriate environment variable handling.
