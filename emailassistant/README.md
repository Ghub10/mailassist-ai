# MailAssist AI

AI-powered email reply assistant. Connect your Gmail or Outlook inbox, generate AI-drafted replies, review them, and send — all from a fast mobile-first web app.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Setup

1. Copy `.env.example` to `.env`
2. Fill in your API credentials:

```env
VITE_GOOGLE_CLIENT_ID=      # Google Cloud Console → OAuth 2.0 Client
VITE_MICROSOFT_CLIENT_ID=   # Azure Portal → App registrations
VITE_OPENAI_API_KEY=        # platform.openai.com
VITE_APP_URL=http://localhost:5173
```

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → APIs & Services → Credentials → Create OAuth 2.0 Client
3. Authorized redirect URI: `http://localhost:5173/auth/google/callback`
4. Enable: Gmail API

### Microsoft OAuth Setup
1. Go to [Azure Portal](https://portal.azure.com/) → App registrations → New registration
2. Redirect URI: `http://localhost:5173/auth/microsoft/callback`
3. API Permissions: `Mail.Read`, `Mail.Send`, `User.Read`

### OpenAI Setup
1. Go to [platform.openai.com](https://platform.openai.com/)
2. API keys → Create new key

## Tech Stack

- **Vite + React + TypeScript** — fast, type-safe frontend
- **TailwindCSS** — mobile-first utility styling
- **Google OAuth 2.0 (PKCE)** — Gmail authentication
- **MSAL.js** — Microsoft/Outlook authentication
- **Gmail API + Microsoft Graph API** — email read/send
- **OpenAI GPT-4o** — AI reply drafting

## Features (MVP)

- Sign in with Google or Microsoft
- View your last 50 inbox emails
- Generate an AI-drafted reply for any email
- Edit, regenerate, and send replies
- Tag emails (Urgent, Client, Billing, Low Priority, Other)
- Filter inbox by status and tag
- Configure reply tone (Friendly / Formal / Concise)
- Offline detection banner

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add the same environment variables from `.env` in the Vercel dashboard under Settings → Environment Variables.

Update your Google and Microsoft OAuth redirect URIs to include your production Vercel URL.

## Project Structure

```
src/
├── components/    # Reusable UI components
├── screens/       # Page-level screen components
├── context/       # Global state (Auth, Inbox)
├── services/      # Gmail, Outlook, OpenAI API clients
├── hooks/         # Custom React hooks
├── types/         # TypeScript types
└── utils/         # Pure utility functions
```
