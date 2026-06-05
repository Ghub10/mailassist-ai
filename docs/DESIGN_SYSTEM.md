# Design System
## AI Email Assistant — MailAssist AI

**Version:** 1.0  
**Date:** April 14, 2026  
**Style Direction:** Colorful, friendly, bright accents, approachable feel

---

## 1. Color Palette

### Primary — Violet (brand identity)
| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#F5F3FF` | Hover backgrounds, light fills |
| `primary-100` | `#EDE9FE` | Active state backgrounds |
| `primary-500` | `#8B5CF6` | Primary buttons, links, active nav |
| `primary-600` | `#7C3AED` | Button hover state |
| `primary-700` | `#6D28D9` | Button pressed state |

### Accent — Coral/Pink (energy, friendly)
| Token | Hex | Usage |
|-------|-----|-------|
| `accent-400` | `#F472B6` | Highlights, illustrations |
| `accent-500` | `#EC4899` | Secondary CTAs, badges |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `success-500` | `#22C55E` | Sent confirmation, replied status |
| `warning-500` | `#F59E0B` | Medium priority indicator |
| `error-500` | `#EF4444` | Error messages, urgent tag |
| `info-500` | `#3B82F6` | Informational notices |

### Neutral (surfaces & text)
| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-50` | `#FAFAFA` | App background |
| `neutral-100` | `#F4F4F5` | Card background, input fill |
| `neutral-200` | `#E4E4E7` | Borders, dividers |
| `neutral-400` | `#A1A1AA` | Placeholder text, secondary text |
| `neutral-600` | `#52525B` | Body text secondary |
| `neutral-800` | `#27272A` | Primary text |
| `neutral-900` | `#18181B` | Headings |
| `white` | `#FFFFFF` | Card surfaces, modal backgrounds |

### Background Gradient (Login screen)
```css
background: linear-gradient(135deg, #EDE9FE 0%, #FCE7F3 100%);
```

---

## 2. Typography Scale

**Primary Font:** `Inter` (Google Fonts — system fallback: `system-ui, -apple-system, sans-serif`)  
**Monospace Font:** `JetBrains Mono` (used for email body to distinguish quoted content)

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-xs` | 12px | 400 | 1.5 | Meta labels, timestamps |
| `text-sm` | 14px | 400 | 1.5 | Secondary text, badge labels |
| `text-base` | 16px | 400 | 1.6 | Body text, email content |
| `text-lg` | 18px | 500 | 1.5 | Card titles, email subjects |
| `text-xl` | 20px | 600 | 1.4 | Screen headings |
| `text-2xl` | 24px | 700 | 1.3 | App name / hero heading |
| `text-3xl` | 30px | 700 | 1.2 | Login screen headline |

**Usage rules:**
- Headings: `neutral-900`, weight 600–700
- Body text: `neutral-800`, weight 400
- Secondary/meta text: `neutral-400`, weight 400
- Never use more than 2 font weights on one screen

---

## 3. Spacing Scale

Uses TailwindCSS spacing units (1 unit = 4px).

| Token | Value | Common Usage |
|-------|-------|-------------|
| `space-1` | 4px | Icon gaps, tight padding |
| `space-2` | 8px | Internal component padding |
| `space-3` | 12px | Badge padding, list item gaps |
| `space-4` | 16px | Standard section padding |
| `space-5` | 20px | Card padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Screen top padding |
| `space-12` | 48px | Large section spacing |
| `space-16` | 64px | Hero section spacing |

**Screen padding:** `px-4` (16px) on mobile, `px-6` (24px) on tablet+

---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Small badges |
| `rounded-md` | 8px | Cards, input fields |
| `rounded-lg` | 12px | Buttons |
| `rounded-xl` | 16px | Modal, bottom sheet |
| `rounded-full` | 9999px | Avatar, status dot |

---

## 5. Shadows

| Token | CSS | Usage |
|-------|-----|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards at rest |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards on hover |
| `shadow-lg` | `0 10px 25px rgba(0,0,0,0.1)` | Modals, bottom sheets |

---

## 6. Buttons

### Primary Button
```
Background:  primary-500 (#8B5CF6)
Text:        white, text-base, font-semibold
Padding:     py-3 px-6
Radius:      rounded-lg
Min height:  52px (touch target)
Width:       full width on mobile

Hover:       primary-600
Active:      primary-700
Disabled:    opacity-40, cursor-not-allowed
```

**Example Tailwind classes:**
```
className="w-full bg-violet-500 hover:bg-violet-600 active:bg-violet-700
           text-white font-semibold text-base py-3 px-6 rounded-lg
           min-h-[52px] transition-colors disabled:opacity-40"
```

### Secondary Button (outline)
```
Background:  transparent
Border:      2px solid primary-500
Text:        primary-500, text-base, font-semibold
Padding:     py-3 px-6
Radius:      rounded-lg
Min height:  52px

Hover:       bg-primary-50
```

### Destructive Button
```
Background:  error-500 (#EF4444)
Text:        white, font-semibold
Same sizing as primary
```

### Ghost / Text Button
```
Background:  transparent
Text:        primary-500, font-medium
No border, no shadow
Hover:       bg-primary-50
Used for:    "Regenerate Draft", back navigation links
```

---

## 7. Input Fields

### Text Input / Textarea
```
Background:   neutral-100
Border:       1px solid neutral-200
Border focus: 2px solid primary-500
Text:         neutral-800, text-base
Placeholder:  neutral-400
Padding:      py-3 px-4
Radius:       rounded-md
Min height:   52px (single line), auto-expand (textarea)
```

### Dropdown / Select
```
Same visual as text input
Arrow icon:   neutral-400, right-aligned
```

### Radio Button (Tone selector)
```
Custom radio with visible ring
Selected:     ring-2, ring-primary-500, bg-primary-500 dot
Unselected:   ring-2, ring-neutral-200
Label:        text-base, neutral-800 (selected bold)
Sublabel:     text-sm, neutral-400
```

---

## 8. Cards

### Email List Item Card
```
Background:   white
Border:       1px solid neutral-200
Radius:       rounded-md
Padding:      p-4
Shadow:       shadow-sm
Hover:        shadow-md, border-primary-100
Active/open:  border-l-4, border-l-primary-500

Layout:
  Row 1: [status dot]  [sender name bold]  [timestamp right]
  Row 2:               [subject, neutral-600]
  Row 3:               [preview snippet, neutral-400 truncated]
  Row 4:               [tag badge(s)]
```

### Detail / Content Card
```
Background:   white
Border:       1px solid neutral-200
Radius:       rounded-xl
Padding:      p-5
Shadow:       shadow-sm
```

---

## 9. Badges / Tags

```
Shape:        rounded-full
Padding:      py-0.5 px-3
Font:         text-xs, font-semibold
```

| Tag | Background | Text color |
|-----|-----------|------------|
| Urgent | `error-500` bg at 15% opacity | `error-500` |
| Client | `primary-100` | `primary-700` |
| Billing | `warning-500` bg at 15% | `warning-500` |
| Low Priority | `neutral-100` | `neutral-500` |
| Other | `neutral-100` | `neutral-600` |

### Status indicators
```
Status dot:   8px circle, rounded-full
Needs reply (untagged): neutral-400
Needs reply (urgent):   error-500
Replied:                success-500  + ✅ icon in list
Ignored:                neutral-200
```

---

## 10. Navigation

### Top Nav Bar
```
Height:       56px
Background:   white
Border-bottom: 1px solid neutral-200
Shadow:        shadow-sm

Left:   hamburger or back arrow (icon button, 44x44px tap target)
Center: screen title (text-lg, font-semibold, neutral-900)
Right:  icon action (settings gear, overflow menu)
```

### Bottom Nav (Mobile — future Phase 2)
Not included in MVP. Navigation is handled by top bar + back arrow.

---

## 11. Icons

Library: [Heroicons](https://heroicons.com/) (MIT license, works with React)

| Action | Icon |
|--------|------|
| Settings | `Cog6ToothIcon` |
| Back | `ChevronLeftIcon` |
| Send / Approve | `PaperAirplaneIcon` |
| Generate AI | `SparklesIcon` |
| Regenerate | `ArrowPathIcon` |
| Discard | `TrashIcon` |
| Tag | `TagIcon` |
| Filter | `FunnelIcon` |
| Inbox | `InboxIcon` |
| Sign out | `ArrowRightOnRectangleIcon` |
| Error | `ExclamationCircleIcon` |
| Success | `CheckCircleIcon` |

---

## 12. Motion & Transitions

Keep animations minimal and fast for a snappy mobile feel.

| Element | Transition |
|---------|-----------|
| Button hover/active | `transition-colors duration-150` |
| Card hover | `transition-shadow duration-200` |
| Screen navigation | Slide in from right (React Router transition, 200ms) |
| Toast notification | Slide up from bottom, 250ms ease-out |
| Skeleton loading | Pulse animation, 1.5s |
| AI draft appearing | Fade in, 300ms ease |

---

## 13. Toast / Notification Snackbar

```
Position:     fixed bottom-4, centered horizontally
Width:        calc(100% - 32px), max 400px
Padding:      py-3 px-4
Radius:       rounded-xl
Shadow:       shadow-lg
Font:         text-sm, font-medium

Success:      bg-success-500, text-white
Error:        bg-error-500, text-white
Info:         bg-neutral-800, text-white

Duration:     auto-dismiss after 4 seconds
              tap/click to dismiss
```

---

## 14. Accessibility Guidelines

- Minimum text contrast: 4.5:1 (WCAG AA) for all body text
- Interactive element focus: `focus-visible:ring-2 focus-visible:ring-primary-500`
- All icon-only buttons include `aria-label`
- Status colors supplemented with text or icon (never color alone)
- Minimum touch target: 44×44px on mobile
- Form inputs have visible labels (not placeholder-only)
- Error messages linked to inputs via `aria-describedby`
