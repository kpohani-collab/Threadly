# TASKS.md — Threadly Backlog

Work through this list top-to-bottom. Each task is self-contained unless a dependency is noted.
Update status inline as you go: `[ ]` → `[x]`.

---

## In Progress

_(nothing currently active)_

---

## P0 — Core functionality gaps

These are things the MVP is missing that break the primary use case.

- [x] **Drag to reorder tasks on the canvas**
  Cards are currently in a fixed array order. Add drag-and-drop reordering so the user can manually reprioritise the flow. Use the HTML5 Drag and Drop API (no external library). Update the `tasks` array order in state on drop. Preserve rotations after reorder.

- [ ] **Edit a task card inline**
  Clicking a card title should make it editable (`contentEditable` or a small inline input). Blur or Enter confirms the edit and updates `tasks` state. Escape cancels. Do not open a modal — keep it inline on the card.

- [ ] **Delete a task**
  Add a small `×` button in the top-right corner of each card, visible on hover only (`opacity: 0` → `1` on card hover via CSS). Clicking it removes the task from state. If the deleted task is a dependency (`dep`) of another task, set that task's `dep` to `null`.

- [ ] **Persist state to localStorage**
  > ⚠ Only do this if running outside the Claude artifact sandbox (e.g. local Vite). In the artifact environment localStorage is not available.
  Wrap `tasks`, `calendar`, and `interruption` in a `useEffect` that writes to `localStorage` on every change. On mount, read from `localStorage` and hydrate state. Key prefix: `threadly_`.

---

## P1 — AI panel improvements

- [ ] **Goal input actually drives "Break into Flow"**
  Currently "Break into Flow" always resets to `INITIAL_TASKS` regardless of what is typed in the goal textarea. Change it so if the textarea has content, the app generates a plausible task breakdown from the input text using a simple keyword-matching mock (e.g. if input contains "design", include a Wireframes card; if "research", include a Research card; otherwise fall back to `INITIAL_TASKS`). No real API needed — this is mock logic.

- [ ] **"Something Came Up" input**
  When the user clicks "Life Happened?", instead of immediately triggering the mock response, first show a small input field in the AI panel asking "What happened? (one line)". After the user types and submits, show the reshuffled AI message incorporating their text (e.g. "Got it — [user text] logged. Timeline reshuffled."). Dismiss the input after submission.

- [ ] **AI message history / log**
  Keep a running list of the last 5 AI interactions (mode + timestamp) visible below the main suggestion block. Each entry is a single collapsed line: e.g. `"10:42 — Reality Check"`. Clicking an entry re-displays that message set. Style as a small scrollable list inside the AI panel, below the existing suggestion block.

---

## P2 — Calendar improvements

- [ ] **Click a calendar day to assign a task**
  Clicking a day cell in the calendar strip opens a small dropdown (positioned above the cell) listing tasks that are not yet on the calendar. Selecting one adds it to that day's task list. Clicking outside dismisses the dropdown.

- [ ] **Show task count badge on each day**
  If a day has 2+ tasks, show a small badge (`2 tasks`) below the last task block. Use Space Grotesk 8px, mustard text.

- [ ] **Highlight today**
  The current day column gets a `2px solid #5FB3B3` border and a small "TODAY" stamp label above the day name.

---

## P3 — Visual polish

- [ ] **Entrance animations for task cards**
  On initial render, stagger each card's appearance with a `fadeInUp` animation, 60ms delay per card. This makes the canvas feel like it's being assembled, not just loaded.

- [ ] **"Done" card visual treatment**
  When a task is marked done, add a faint diagonal strikethrough line across the card (CSS `::after` pseudo-element, `2px solid` in `rgba(35,32,29,0.2)`, rotated 45deg). Keep the card visible — do not hide or fade it out.

- [ ] **Completion celebration**
  When `pct` reaches 100%, briefly show a full-width banner at the top of the canvas ("Big picture: complete. ✦") in burgundy with mustard text. Auto-dismiss after 3 seconds using `setTimeout` + state.

- [ ] **Mobile layout (portrait)**
  Stack the three panels vertically on screens narrower than 768px. Left panel collapses to a horizontal top bar showing only the project name and progress %. Center canvas scrolls horizontally. Right panel stacks below the canvas. Calendar strip remains at the bottom.

---

## P4 — Nice to have (do last)

- [ ] **Export canvas as PNG**
  Add an "Export" button in the top banner. Use `html2canvas` (load from CDN) to capture the center canvas div and trigger a download. Button label: "EXPORT WALL".

- [ ] **Dark mode**
  Add a toggle in the top banner (moon icon). In dark mode: swap cream `#F5EFE3` → `#1A1714`, charcoal `#23201D` → `#F5EFE3`, orange panel → deeper `#7A2D00`. All other colours stay the same — they read well on dark.

- [ ] **Multiple projects**
  The left panel currently shows one hardcoded project. Make it support up to 4 projects. Clicking a project card switches the active project and loads its `tasks` and `calendar` into state. Add a small "+ New Project" button at the bottom of the left panel.

---

## Completed

- [x] Initial MVP — 4-panel layout, 8-task flow, AI co-planner, calendar strip
- [x] Mark task as done
- [x] Add task manually
- [x] "Break into Flow" mock action
- [x] "Reality Check" mock action
- [x] "Life Happened?" interruption card
- [x] "Replan Timeline" calendar update
- [x] Design guidelines (`threadly-design-guidelines.md`)
- [x] CLAUDE.md
