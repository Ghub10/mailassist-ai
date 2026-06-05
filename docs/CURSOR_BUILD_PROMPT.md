# Cursor Build Prompt
## AI Email Assistant — MailAssist AI

---

## Role Definition

You are a senior mobile web engineer working inside this repository. Your job is to build the MailAssist AI application — a mobile-first web app that connects to Gmail and Outlook, generates AI reply drafts, and lets users review and send them.

You will follow this document exactly. Build only what is described. Do not add features that are not listed. Favor readable, beginner-friendly code over clever abstractions.

---

## Goal Summary

Build a mobile-first web application that:
1. Lets users sign in via Google or Microsoft OAuth
2. Fetches their inbox emails (Gmail or Outlook)
3. Generates an AI-drafted reply for any email using the OpenAI API
4. Lets the user edit, regenerate, approve, and send that reply
5. Lets the user tag and organize emails manually
6. Persists tone preference and tags in LocalStorage

---

## Approved Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | Latest | Build tool and dev server |
| React | 18 | UI framework |
| TypeScript | 5+ | Type safety |
| TailwindCSS | 3 | Styling (mobile-first utility classes) |
| React Router | v6 | Client-side routing |
| Google OAuth 2.0 | PKCE flow | Gmail authentication |
| MSAL.js | v3 | Microsoft authentication |
| Gmail REST API | v1 | Read + send Gmail emails |
| Microsoft Graph API | v1.0 | Read + send Outlook emails |
| OpenAI API | GPT-4o | AI reply draft generation |
| Heroicons | v2 | Icon library |
| Inter (Google Fonts) | — | Primary typeface |

Do NOT add: Redux, MobX, React Query, Firebase, Supabase, or any backend server. This is a fully client-side application for MVP.

---

## Environment Variables

Create a `.env` file using the template below. Never commit the `.env` file.

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_MICROSOFT_CLIENT_ID=your_microsoft_oauth_client_id
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_APP_URL=http://localhost:5173
```

Create a `.env.example` with the same keys but empty values. Commit only `.env.example`.

---

## Project Structure

Build the project with this exact folder structure:

```
src/
├── main.tsx
├── App.tsx
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── EmailListItem.tsx
│   ├── ReplyEditor.tsx
│   ├── ToneSelector.tsx
│   ├── EmptyState.tsx
│   ├── LoadingSkeleton.tsx
│   └── Toast.tsx
├── screens/
│   ├── LoginScreen.tsx
│   ├── InboxScreen.tsx
│   ├── EmailDetailScreen.tsx
│   └── SettingsScreen.tsx
├── context/
│   ├── AuthContext.tsx
│   └── InboxContext.tsx
├── services/
│   ├── gmailService.ts
│   ├── outlookService.ts
│   ├── openaiService.ts
│   └── authService.ts
├── hooks/
│   ├── useEmails.ts
│   └── useAIDraft.ts
├── types/
│   ├── email.ts
│   ├── user.ts
│   └── draft.ts
├── utils/
│   ├── tokenStorage.ts
│   ├── emailParser.ts
│   └── prompts.ts
└── styles/
    └── index.css
```

---

## Ordered Build Steps

Follow these steps in order. Complete each step fully before moving to the next.

---

### Step 1: Initialize the Project

```bash
npm create vite@latest emailassistant -- --template react-ts
cd emailassistant
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install react-router-dom @heroicons/react
npm install @azure/msal-browser @azure/msal-react
```

Configure `tailwind.config.ts`:
- Set `content` to include `./index.html` and `./src/**/*.{ts,tsx}`
- Add the Inter font via `@import` in `src/styles/index.css`
- Add TailwindCSS directives: `@tailwind base; @tailwind components; @tailwind utilities;`

Create `.env` and `.env.example` files.

**Decision:** Vite is chosen because it starts instantly and works great with React + TypeScript. No complex webpack config needed.

---

### Step 2: Define Types

Create all TypeScript types in `src/types/` before writing any logic.

**`src/types/user.ts`**
```typescript
export type Provider = 'google' | 'microsoft';
export type Tone = 'friendly' | 'formal' | 'concise';

export interface User {
  id: string;
  email: string;
  provider: Provider;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry: number; // Unix timestamp ms
  tone: Tone;
}
```

**`src/types/email.ts`**
```typescript
export type EmailStatus = 'needs_reply' | 'replied' | 'ignored';
export type EmailTag = 'urgent' | 'client' | 'billing' | 'low_priority' | 'other' | null;

export interface Email {
  id: string;
  threadId: string;
  from: string;
  fromEmail: string;
  subject: string;
  bodyText: string;
  receivedAt: string; // ISO date string
  status: EmailStatus;
  tag: EmailTag;
}
```

**`src/types/draft.ts`**
```typescript
export interface Draft {
  emailId: string;
  content: string;
  isLoading: boolean;
  error: string | null;
}
```

---

### Step 3: Build Utility Functions

**`src/utils/tokenStorage.ts`**
- `saveUser(user: User): void` — save to LocalStorage as JSON
- `loadUser(): User | null` — load and parse from LocalStorage
- `clearUser(): void` — remove from LocalStorage
- `isTokenExpired(user: User): boolean` — check `tokenExpiry < Date.now()`

**`src/utils/emailParser.ts`**
- `extractPlainText(rawBody: string): string` — strip HTML tags, decode HTML entities, return clean plain text
- `truncateForAI(text: string, maxChars = 3000): string` — truncate to maxChars, append "(truncated)" if cut

**`src/utils/prompts.ts`**
- `buildReplyPrompt(emailBody: string, tone: Tone): string` — returns the OpenAI prompt string:
  ```
  "You are a professional email assistant. Draft a concise, helpful reply to the following email.
  Tone: {tone}. Reply in the same language as the email.
  Do not add subject lines or greetings beyond what is appropriate.
  Email: {emailBody}"
  ```

---

### Step 4: Build Context Providers

**`src/context/AuthContext.tsx`**

State: `{ user: User | null, isLoading: boolean }`

Actions:
- `login(user: User)` — set user, save to LocalStorage
- `logout()` — clear user, clear LocalStorage
- `updateTone(tone: Tone)` — update tone in state and LocalStorage

On mount: call `loadUser()` — if user exists and token is not expired, restore session.

Export: `useAuth()` hook.

**`src/context/InboxContext.tsx`**

State:
```typescript
{
  emails: Email[];
  isLoading: boolean;
  error: string | null;
  statusFilter: EmailStatus | 'all';
  tagFilter: EmailTag | 'all';
  draft: Draft | null;
}
```

Actions:
- `setEmails(emails: Email[])`
- `updateEmailStatus(id: string, status: EmailStatus)`
- `updateEmailTag(id: string, tag: EmailTag)`
- `setDraft(draft: Draft | null)`
- `setStatusFilter(filter)`
- `setTagFilter(filter)`

Tag changes: persist tag to LocalStorage keyed as `tag_${emailId}`.
On `setEmails`: rehydrate tags from LocalStorage for each email.

Export: `useInbox()` hook.

---

### Step 5: Build API Services

**`src/services/authService.ts`**

Implement:
- `initiateGoogleLogin()` — redirect to Google OAuth with PKCE; request scopes: `gmail.readonly`, `gmail.send`, `email`, `profile`
- `handleGoogleCallback(code: string): Promise<User>` — exchange code for tokens using Google token endpoint
- `refreshGoogleToken(refreshToken: string): Promise<Partial<User>>` — refresh access token
- `initiateMicrosoftLogin()` — use MSAL to start Microsoft OAuth; request scopes: `Mail.Read`, `Mail.Send`, `User.Read`
- `handleMicrosoftCallback(): Promise<User>` — complete MSAL auth flow
- `getValidToken(user: User): Promise<string>` — check expiry; refresh if needed; return valid access token

**`src/services/gmailService.ts`**

Implement:
- `fetchEmails(accessToken: string): Promise<Email[]>` — call Gmail API `users/me/messages?maxResults=50&labelIds=INBOX`, then fetch each message's body
- `sendReply(accessToken: string, threadId: string, to: string, subject: string, body: string): Promise<void>` — send via Gmail API `users/me/messages/send` with proper MIME encoding

**`src/services/outlookService.ts`**

Implement:
- `fetchEmails(accessToken: string): Promise<Email[]>` — call Microsoft Graph `me/messages?$top=50&$select=id,conversationId,from,subject,bodyPreview,body,receivedDateTime`
- `sendReply(accessToken: string, messageId: string, body: string): Promise<void>` — call Graph `me/messages/{id}/reply`

**`src/services/openaiService.ts`**

Implement:
- `generateDraft(emailBody: string, tone: Tone): Promise<string>` — call OpenAI Chat Completions API with `gpt-4o`, `max_tokens: 500`. Use `buildReplyPrompt()` from utils.
- Handle errors: if API returns error, throw with message "AI service unavailable. Please try again."

---

### Step 6: Build Custom Hooks

**`src/hooks/useEmails.ts`**

- On mount (when user is authenticated): call `getValidToken()` then the appropriate `fetchEmails()` based on provider
- Set `isLoading: true` before fetch, `false` after
- On error: set `error` message in InboxContext
- Return: `{ emails, isLoading, error, refetch }`

**`src/hooks/useAIDraft.ts`**

- `generate(emailBody: string)`: set draft loading → call `generateDraft()` → set draft content or error
- `regenerate(emailBody: string)`: same as generate, clears previous draft first
- Return: `{ draft, generate, regenerate, clearDraft }`

---

### Step 7: Build Reusable Components

Build these components to match the Design System (DESIGN_SYSTEM.md).

**`Button.tsx`** — variants: `primary`, `secondary`, `destructive`, `ghost`. Props: `onClick`, `disabled`, `isLoading`, `fullWidth`, `children`.

**`Badge.tsx`** — variants matching tag colors from Design System. Props: `tag: EmailTag | EmailStatus`.

**`EmailListItem.tsx`** — renders one email row with status dot, sender, subject preview, timestamp, tag badge. Props: `email: Email`, `onClick`.

**`ReplyEditor.tsx`** — textarea with edit capability. Props: `draft: Draft`, `onEdit(text)`, `onRegenerate()`, `onApprove()`, `onDiscard()`. Shows skeleton when `draft.isLoading` is true. Shows error banner when `draft.error` is set.

**`ToneSelector.tsx`** — three radio options (Friendly / Formal / Concise) with descriptions. Props: `value: Tone`, `onChange(tone: Tone)`.

**`EmptyState.tsx`** — icon + title + subtitle + optional action button. Props: `icon`, `title`, `subtitle`, `actionLabel`, `onAction`.

**`LoadingSkeleton.tsx`** — animated pulse skeleton rows. Props: `rows: number`.

**`Toast.tsx`** — fixed bottom notification. Props: `message`, `type: 'success' | 'error' | 'info'`, `onDismiss`. Auto-dismisses after 4 seconds.

---

### Step 8: Build Screens

Follow the wireframes in UI_WIREFRAMES.md exactly.

**`LoginScreen.tsx`**
- Gradient background from Design System
- App name + tagline
- "Sign in with Google" button → calls `initiateGoogleLogin()`
- "Sign in with Microsoft" button → calls `initiateMicrosoftLogin()`
- Handle OAuth callback (check URL params on mount for `?code=`)
- On successful auth: call `login(user)` and navigate to `/inbox`

**`InboxScreen.tsx`**
- Top nav with app name + Settings link
- Status filter dropdown (All / Needs Reply / Replied / Ignored)
- Tag filter dropdown (All Tags / Urgent / Client / Billing / Low Priority / Other)
- Email list using `EmailListItem` component
- Show `LoadingSkeleton` while fetching
- Show `EmptyState` if no emails or no filter results
- Tap email → navigate to `/email/:id`

**`EmailDetailScreen.tsx`**
- Back button → Inbox
- Subject + sender + timestamp header
- Tag selector dropdown
- Full email body (scrollable)
- "Generate AI Reply" button → navigate to `/email/:id/reply` and trigger draft generation
- "Mark as Ignored" button → update status, go back to Inbox

**`EmailDetailScreen.tsx` — Reply sub-view (same screen or `/email/:id/reply`)**
- "Replying to: {name}" header
- Tone reminder (read-only label)
- `ReplyEditor` component
- Regenerate link
- "Approve & Send" primary button → call send API → show success toast → navigate to Inbox
- "Discard Draft" button → clear draft → return to email detail

**`SettingsScreen.tsx`**
- Back button → Inbox
- Connected account section: email address + provider label + "Disconnect" button
- `ToneSelector` component — saves on change
- App version + Privacy Policy link
- "Sign Out" button → confirm dialog → `logout()` → navigate to `/`

> Note: Both "Disconnect Account" and "Sign Out" perform the same action in MVP: clear all auth tokens from LocalStorage and redirect to the Login screen. Implement both as calls to the same `logout()` function. "Disconnect" is shown near the account info; "Sign Out" is shown at the bottom of the screen.

---

### Step 9: Set Up Routing

**`App.tsx`**

```typescript
// Routes:
// /           → LoginScreen (redirect to /inbox if already authenticated)
// /inbox      → InboxScreen (protected route — redirect to / if not authenticated)
// /email/:id  → EmailDetailScreen (protected route)
// /settings   → SettingsScreen (protected route)
```

Create a `ProtectedRoute` wrapper component that checks `useAuth().user` — if null, redirect to `/`.

---

### Step 10: Apply Mobile-First Styling

- Use Tailwind's `sm:` and `md:` prefixes for responsive variants
- Default styles target mobile (375px)
- At `md:` (768px): switch Inbox + Email Detail to two-column layout
- At `lg:` (1280px): apply max-width container (`max-w-screen-xl mx-auto`)
- Ensure all touch targets are `min-h-[44px] min-w-[44px]`
- Test that no horizontal scrollbar appears at 375px

---

### Step 11: Add Offline Detection

In `App.tsx` or a dedicated `useOnlineStatus` hook:
- Listen to `window.addEventListener('online' / 'offline')`
- When offline: show a fixed top banner "You are offline — email actions require a connection"
- Disable "Generate Reply" and "Approve & Send" buttons when offline
- When back online: banner disappears automatically

---

### Step 12: Final Validation

Before marking the build as complete, verify every item in the TEST_PLAN.md acceptance criteria:

- [ ] Google OAuth sign-in works end-to-end
- [ ] Microsoft OAuth sign-in works end-to-end
- [ ] Inbox loads and displays real emails
- [ ] AI draft generation works and produces relevant output
- [ ] Edit, regenerate, and send flow works
- [ ] Tags persist across page refresh
- [ ] Tone setting persists across page refresh
- [ ] App is usable on 375px screen (no overflow)
- [ ] Offline state shows banner and disables actions
- [ ] All error states show actionable messages

---

## Working Rules

1. **Incremental commits** — commit after each Step is complete, with a clear commit message (e.g. `feat: add AuthContext and token storage`)
2. **Small file changes** — prefer editing one file at a time; avoid large multi-file changes in a single edit
3. **Mobile-first always** — write base styles for mobile, add `md:` or `lg:` breakpoints for larger screens
4. **Readable code** — use clear variable names, avoid one-liners, add brief comments only where the logic is non-obvious
5. **No feature creep** — if a feature is not in this document, do not build it
6. **Explain major decisions** — when making a non-obvious implementation choice, add a one-line comment explaining why

---

## Definition of Done

The application is complete when:

- [ ] `npm install` runs with no errors
- [ ] `npm run dev` starts the app on `localhost:5173`
- [ ] All 5 screens are implemented and navigable
- [ ] Google OAuth + Gmail API integration is functional
- [ ] Microsoft OAuth + Graph API integration is functional
- [ ] OpenAI API draft generation is functional
- [ ] Send reply via provider API is functional
- [ ] All MVP features from FEATURE_PRIORITY.md are implemented
- [ ] All acceptance criteria in TEST_PLAN.md pass
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] App renders correctly on 375px, 768px, and 1280px viewports

---

## Deployment (Post-Build)

Recommended: **Vercel**

```bash
npm install -g vercel
vercel
```

Set environment variables in the Vercel dashboard (Settings → Environment Variables) using the same keys from `.env.example`.

The app will be assigned a public URL (e.g. `https://mailassist-ai.vercel.app`).

Update the OAuth redirect URIs in Google Cloud Console and Microsoft Azure AD to include the production Vercel URL before testing in production.
