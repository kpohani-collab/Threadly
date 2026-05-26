# CLAUDE.md — Threadly

Personal AI + human planning wall app. Single-page React, no backend, no auth, desktop only.

---

## Project overview

Threadly is a visual task flow app where a user breaks a big goal into sticky-note task cards arranged on a canvas. It has mock AI suggestions and basic interactivity. Built for personal use only — prioritise visual fidelity over engineering robustness.

---

## Stack

- **React** (single `.jsx` file, default export)
- **Tailwind CSS** (utility classes only — no compiled config, uses CDN base stylesheet)
- **Google Fonts** — Fraunces (serif headings) + Space Grotesk (UI/body), injected via `<style>` tag inside a `FontLink` component
- **No build step** — the file is loaded directly as a React JSX artifact
- **No backend, no API calls, no localStorage** — all state lives in `useState`
- **No external images** — all visuals are pure CSS (gradients, borders, box-shadow)

---

## File structure

```
Threadly.jsx                   # Entire app — one file
threadly-design-guidelines.md  # Design reference (colours, type, components)
CLAUDE.md                      # This file
```

Everything is in `Threadly.jsx`. Do not split into multiple files unless explicitly asked.

---

## Commands

There is no build, test, or lint command. Open `Threadly.jsx` as a React artifact in Claude or in a local Vite/CRA sandbox:

```bash
# Quick local preview (if Vite available)
npm create vite@latest threadly -- --template react
# then replace src/App.jsx with Threadly.jsx contents
npm run dev
```

---

## Architecture

### State (all in the root component)

| Variable | Type | Purpose |
|---|---|---|
| `tasks` | `Task[]` | All task cards on the canvas |
| `aiMessages` | `string[]` | Current 3-line AI suggestion block |
| `interruption` | `boolean` | Whether the interruption card is visible |
| `calendar` | `CalDay[]` | 7-day calendar strip data |
| `newTask` | `string` | Controlled input for the add-task field |
| `goalInput` | `string` | Controlled textarea for the goal/interruption input |
| `aiMode` | `string` | Key into `AI_MESSAGES` (`default` \| `realityCheck` \| `replan` \| `interruption` \| `breakFlow`) |
| `showAddTask` | `boolean` | Toggle for the add-task input in the left panel |
| `flashAI` | `boolean` | Briefly true on AI action to trigger `slide-down` re-animation |

### Data shapes

```js
// Task
{ id, title, time, status, dep, note, color, textColor }
// status: "done" | "doing" | "blocked" | "not-started"
// dep: id of blocking task, or null
// color/textColor: hex strings from the accent palette

// CalDay
{ day, date, tasks: string[], colors: string[], isInterruption?: boolean }
```

### Key constants

- `INITIAL_TASKS` — the default 8-card flow (Big Goal → Polish Portfolio)
- `INITIAL_CALENDAR` — 7-day week starting May 26 2026
- `AI_MESSAGES` — object keyed by mode, each value is a `string[]` of 3–4 messages

### Sub-components

| Component | Props | Notes |
|---|---|---|
| `FontLink` | none | Injects `<style>` tag with `@import` + all CSS classes |
| `StatusChip` | `{ status }` | Coloured pill tag; "doing" has a pulsing dot |
| `Arrow` | none | Pure-CSS dashed line + triangle arrowhead |
| `Stamp` | `{ children, color? }` | Tiny uppercase dashed-border label |
| `TaskCard` | `{ task, onMarkDone, rotation }` | Sticky note card with tape strip and status chip |

---

## Design rules (summary — full detail in `threadly-design-guidelines.md`)

### Colours
```
Cream      #F5EFE3   global background
Orange     #E85D04   left panel, CTA buttons
Burgundy   #6E1F2B   right panel, headings, borders
Teal       #5FB3B3   interactive buttons, "Doing" chip
Mustard    #F3B23C   accents, AI labels, sticky notes
Pink       #E9A6A6   sticky notes, "Blocked" chip
Green      #8FAF87   sticky notes, "Done" chip, progress bar
Charcoal   #23201D   body text on light surfaces, calendar bg
```

- Never use `#fff` or `#000` anywhere
- Teal is the **only** colour for primary interactive elements
- Sticky note colours rotate by task index; avoid repeating on adjacent cards

### Typography
- **Fraunces** for all headings and card titles (`font-serif` class)
- **Space Grotesk** for all labels, body, buttons (`font-sans` class)
- Headings: `letter-spacing: -0.02em` to `-0.03em`; labels: uppercase + `letter-spacing: 0.08em` to `0.18em`

### Layout
- 3-column CSS Grid: `230px 1fr 260px` + full-width bottom calendar strip
- Do not change column widths without good reason — the proportions are deliberate

### Cards
- Always include the tape strip pseudo-element at top-centre
- Always apply a rotation class (`rotate-m1`, `rotate-p1`, etc.) — never leave cards at 0deg
- Shadow: `3px 5px 18px rgba(35,32,29,0.22), 0 1px 3px rgba(35,32,29,0.12)`

### CSS classes defined in `FontLink`
All custom classes live inside the injected `<style>` tag — not in a separate CSS file.
Key classes: `paper-texture`, `dot-pattern`, `diagonal-stripe`, `stamp-border`, `sticky-shadow`, `panel-shadow`, `rotate-m1/p1/m05/p05/p15`, `chip-*`, `btn-primary/secondary/orange`, `pulse`, `slide-down`, `torn-bottom`

---

## Interaction map

| User action | Handler | What changes |
|---|---|---|
| Click "Mark Done" on a card | `handleMarkDone(id)` | `tasks[id].status → "done"`, progress bar updates |
| Click "+ Add Task" | `setShowAddTask(true)` | Input slides in on left panel |
| Submit add-task input | `handleAddTask()` | New task appended to `tasks` with next rotating colour |
| Click "Break into Flow" | `handleBreakFlow()` | Resets `tasks` to `INITIAL_TASKS`, sets `aiMessages` to `breakFlow` |
| Click "Reality Check" | `triggerAI("realityCheck")` | Swaps AI message block |
| Click "Life Happened?" | `handleSomethingCameUp()` | Sets `interruption = true`, updates Wed calendar block, sets `aiMessages` to `interruption` |
| Click "Replan Timeline" | `handleReplanning()` | Updates Thu/Sun calendar blocks, sets `aiMessages` to `replan` |

---

## Things to preserve

- The scrapbook/editorial aesthetic — this is the whole point of the app
- Card rotations — removing them makes the canvas look like a boring table
- The `FontLink` component injecting styles — do not move styles to a separate file
- Single-file constraint — keep everything in `Threadly.jsx`
- No API calls or localStorage — state is ephemeral by design
- Cream background, never white

## Things to avoid

- Do not add a navigation bar or top-level router
- Do not add authentication or user accounts
- Do not add a backend or database connection
- Do not use plain white backgrounds or grey shadows
- Do not introduce a new typeface — only Fraunces + Space Grotesk
- Do not use `localStorage` (not supported in the artifact environment)
- Do not add a separate CSS file — all styles go in `FontLink`
- Do not make the UI look like a generic SaaS dashboard
