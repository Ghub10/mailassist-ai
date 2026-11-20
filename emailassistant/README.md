# MailAssist AI (the app)

This folder holds the web app. For what it does, how it works, the reasoning behind the design, and what I'd improve next, read the **[main README](../README.md)**.

## Quick start

You need Node 20.19 or newer (or Node 22.12+).

```bash
npm install
npm run dev
```

Open <http://localhost:5173> and click **Try a demo, no sign-in**. The sample inbox needs no keys or accounts.

## Connecting a real inbox

Copy `.env.example` to `.env` and fill it in. The variables, and which ones must stay secret, are listed in the [main README](../README.md#run-it-yourself).

`npm run dev` doesn't run the functions in `api/`. To try real AI replies on your computer, run `npx vercel dev` instead.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app on port 5173 |
| `npm run build` | Type-checks and builds for production |
| `npm run lint` | Checks the code style |
| `npm run preview` | Serves the production build locally |
