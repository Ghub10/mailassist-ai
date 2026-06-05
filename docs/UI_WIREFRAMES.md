# UI Wireframes
## AI Email Assistant — Mobile-First Layouts

**Version:** 1.0  
**Date:** April 14, 2026

All wireframes designed for 375px wide mobile screens. Desktop adapts to a two-column layout where noted.

---

## Screen 1: Login / Onboarding

```
┌─────────────────────────────────┐
│                                 │
│         ✉ MailAssist AI         │
│                                 │
│   Your AI-powered email         │
│   reply assistant               │
│                                 │
│ ─────────────────────────────── │
│                                 │
│  ┌───────────────────────────┐  │
│  │  🔵  Sign in with Google  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  🟦  Sign in with         │  │
│  │      Microsoft            │  │
│  └───────────────────────────┘  │
│                                 │
│  By signing in you grant read   │
│  and send access to your inbox. │
│                                 │
│  Privacy Policy · Terms         │
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- Full-screen centered layout
- Provider buttons are large touch targets (min 52px height)
- Subtle illustration or gradient background
- No email/password fields — OAuth only

---

## Screen 2: Inbox

```
┌─────────────────────────────────┐
│  ≡  Inbox          ⚙ Settings  │  ← Top nav bar
├─────────────────────────────────┤
│                                 │
│  [ All ▼ ]  [ Filter by tag ▼] │  ← Status + tag filters
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🔴 Sarah Johnson          │  │
│  │ RE: Invoice #1042         │  │
│  │ "Hi, I haven't received…" │  │
│  │ 📌 Billing  · 2h ago      │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🟡 Mark Lee               │  │
│  │ Product question          │  │
│  │ "Can you tell me more…"   │  │
│  │ 💼 Client  · 4h ago       │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ ⚪ newsletter@example.com │  │
│  │ Weekly Digest             │  │
│  │ "Top stories this week…"  │  │
│  │ 🏷 Other  · 1d ago        │  │
│  └───────────────────────────┘  │
│                                 │
│  ─────── Replied ───────────    │
│                                 │
│  ┌───────────────────────────┐  │
│  │ ✅ Tom Baker               │  │
│  │ Project kickoff           │  │
│  │ Replied 3h ago            │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Status dot legend:**
- 🔴 Needs reply (high priority / tagged Urgent)
- 🟡 Needs reply (medium)
- ⚪ Needs reply (untagged)
- ✅ Replied

**Filter row options:**
- Status dropdown: All / Needs Reply / Replied / Ignored
- Tag dropdown: All Tags / Urgent / Client / Billing / Low Priority / Other

**Desktop layout (≥768px):** sidebar with email list on left (320px), detail panel on right.

---

## Screen 3: Email Detail

```
┌─────────────────────────────────┐
│  ←  Back           ⋯ More       │  ← Nav: back + overflow menu
├─────────────────────────────────┤
│                                 │
│  RE: Invoice #1042              │  ← Subject
│  Sarah Johnson                  │  ← Sender
│  sarah@example.com · 2h ago     │
│                                 │
│  Tag: [ Billing ▾ ]             │  ← Tag selector dropdown
│                                 │
├─────────────────────────────────┤
│                                 │
│  Hi,                            │  ← Email body (scrollable)
│                                 │
│  I haven't received the         │
│  invoice for last month's       │
│  work yet. Could you please     │
│  resend it? We need it for      │
│  our accounting by Friday.      │
│                                 │
│  Thanks,                        │
│  Sarah                          │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │   ✨ Generate AI Reply    │  │  ← Primary CTA
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │   Mark as Ignored         │  │  ← Secondary action
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- Tag selector shows current tag; tap to change
- "Generate AI Reply" is the prominent action
- Overflow menu (⋯): Mark as Ignored, Copy Email Address
- Scroll area: email body can be long — scrollable independently

---

## Screen 4: Reply Editor

```
┌─────────────────────────────────┐
│  ←  Back to Email               │  ← Nav
├─────────────────────────────────┤
│                                 │
│  Replying to: Sarah Johnson     │
│  RE: Invoice #1042              │
│                                 │
│  Tone: Friendly ✓               │  ← Read-only reminder (set in settings)
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │ Hi Sarah,                 │  │
│  │                           │  │  ← Editable text area
│  │ Thank you for reaching    │  │     (auto-expands)
│  │ out! I apologize for the  │  │
│  │ delay. I'll resend the    │  │
│  │ invoice for last month    │  │
│  │ right away. Please let    │  │
│  │ me know if you need       │  │
│  │ anything else.            │  │
│  │                           │  │
│  │ Best,                     │  │
│  │ [Your name]               │  │
│  └───────────────────────────┘  │
│                                 │
│  🔄 Regenerate Draft            │  ← Regenerate link/button
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │   ✅ Approve & Send       │  │  ← Primary CTA
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │   🗑 Discard Draft        │  │  ← Secondary CTA
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**States:**
- **Loading:** Skeleton lines animate in the text area while AI generates
- **Error:** "AI unavailable — try again" banner with retry button
- **Regenerating:** Spinner replaces text area content briefly
- **Sent:** Green success toast — "Reply sent!" — then navigate back to Inbox

---

## Screen 5: Settings

```
┌─────────────────────────────────┐
│  ←  Back              Settings  │  ← Nav
├─────────────────────────────────┤
│                                 │
│  CONNECTED ACCOUNT              │
│  ─────────────────────────────  │
│  📧 sarah@gmail.com             │
│     Connected via Google        │
│                                 │
│  [ Disconnect Account ]         │
│                                 │
├─────────────────────────────────┤
│                                 │
│  REPLY TONE                     │
│  ─────────────────────────────  │
│  Choose how the AI sounds       │
│  when drafting replies.         │
│                                 │
│  ◉ Friendly                     │
│    Warm, approachable, natural  │
│                                 │
│  ○ Formal                       │
│    Professional, structured     │
│                                 │
│  ○ Concise                      │
│    Short, direct, to the point  │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ABOUT                          │
│  ─────────────────────────────  │
│  MailAssist AI  v1.0.0          │
│  Privacy Policy                 │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │   Sign Out                │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- Tone selection auto-saves — no explicit save button needed
- "Disconnect Account" clears tokens and returns to Login
- "Sign Out" is destructive — confirm dialog before action

---

## Empty States

### Empty Inbox
```
┌─────────────────────────────────┐
│  ≡  Inbox          ⚙ Settings  │
├─────────────────────────────────┤
│                                 │
│         🎉                      │
│                                 │
│   You're all caught up!         │
│                                 │
│   No emails need a reply        │
│   right now.                    │
│                                 │
│   [ Refresh Inbox ]             │
│                                 │
└─────────────────────────────────┘
```

### No matching filters
```
│                                 │
│       🔍                        │
│                                 │
│   No emails match this filter.  │
│                                 │
│   [ Clear Filters ]             │
│                                 │
```

---

## Loading States

### Inbox loading
```
│  ┌───────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░ ░░░░░░░░   │  │  ← Skeleton row
│  │ ░░░░░░░░░░░░░░░░░░░░░░░   │  │
│  │ ░░░░░  ░░░░░░             │  │
│  └───────────────────────────┘  │
```

### AI draft generating
```
│  ┌───────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░   │  │  ← Skeleton lines
│  │ ░░░░░░░░░░░░░░░░          │  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░   │  │
│  │ ░░░░░░░░░░░              │  │
│  └───────────────────────────┘  │
│                                 │
│  ✨ Generating your reply…      │
```

---

## Desktop Layout (≥768px)

```
┌────────────────────────────────────────────────────────┐
│  ✉ MailAssist AI                          ⚙ Settings  │
├──────────────────────┬─────────────────────────────────┤
│                      │                                  │
│  [ All ▼ ] [Tag ▼]  │  RE: Invoice #1042               │
│  ─────────────────── │  Sarah Johnson · 2h ago          │
│  🔴 Sarah Johnson    │  Tag: [ Billing ▾ ]              │
│  RE: Invoice #1042   │  ─────────────────────────────── │
│  Billing · 2h ago    │                                  │
│                      │  Hi, I haven't received the      │
│  🟡 Mark Lee         │  invoice for last month's work   │
│  Product question    │  yet. Could you please resend    │
│  Client · 4h ago     │  it? We need it for our          │
│                      │  accounting by Friday.           │
│  ⚪ newsletter@...   │                                  │
│  Weekly Digest       │  ─────────────────────────────── │
│  Other · 1d ago      │                                  │
│                      │  [ ✨ Generate AI Reply ]         │
│  ─── Replied ─────── │  [ Mark as Ignored ]             │
│  ✅ Tom Baker         │                                  │
│                      │                                  │
└──────────────────────┴─────────────────────────────────┘
```

**Breakpoints:**
- `< 768px` — Single column, full-screen screens with back navigation
- `≥ 768px` — Two-column split layout (email list + detail/editor panel)
- `≥ 1280px` — Max width container (1200px) centered with side padding
