# COMPONENTS.md — Threadly

Reference spec for every component and major JSX block in `Threadly.jsx`.
Use this before editing any component to understand its exact structure and constraints.

---

## Component tree

```
Threadly (root)
├── FontLink
├── Top banner (JSX block — no component)
├── Main grid (JSX block)
│   ├── Left panel (JSX block)
│   │   └── TaskCard (× n, in add-task section)
│   ├── Center canvas (JSX block)
│   │   ├── TaskCard (× 8)
│   │   ├── Arrow (× 7, between cards)
│   │   ├── StatusChip (inside TaskCard)
│   │   └── Interruption card (conditional JSX block)
│   └── Right panel (JSX block)
│       └── Stamp (× several)
└── Bottom calendar strip (JSX block)
```

---

## `FontLink`

**Type:** Functional component, no props.
**Purpose:** Injects the Google Fonts `@import` and ALL custom CSS class definitions into the document via a `<style>` tag. This is the only place styles are defined outside of inline `style={{}}` props.

**Why it exists:** The app runs as a React artifact with no build step. There is no `.css` file and no Tailwind config. All custom classes (`sticky-shadow`, `rotate-m1`, `chip-done`, `btn-primary`, etc.) live here.

**Do not:**
- Move styles out of this component into a separate file
- Add a `<link>` tag for fonts separately — the `@import` inside the `<style>` tag handles it
- Delete or rename any class defined here without updating every JSX element that uses it

**Classes defined here (full list):**
```
paper-texture       dot-pattern         diagonal-stripe
stamp-border        sticky-shadow       panel-shadow
rotate-m1           rotate-p1           rotate-m05
rotate-p05          rotate-p15          chip-not-started
chip-doing          chip-blocked        chip-done
btn-primary         btn-secondary       btn-orange
pulse               slide-down          torn-bottom
arrow-connector     arrow-line          arrow-head
cal-block           font-serif          font-sans
```

---

## `StatusChip`

**Props:** `{ status: "done" | "doing" | "blocked" | "not-started" }`

**Renders:** A small coloured pill tag. "Doing" status includes a pulsing white dot to the left of the label.

**CSS mapping:**
```
"done"        → chip-done        (#8FAF87 bg, white text)
"doing"       → chip-doing       (#5FB3B3 bg, white text) + pulse dot
"blocked"     → chip-blocked     (#E9A6A6 bg, #6E1F2B text)
"not-started" → chip-not-started (#e2ddd6 bg, #23201D text)
```

**Inline styles:** `fontSize: 9`, `fontWeight: 700`, `letterSpacing: "0.08em"`, `padding: "2px 7px"`, `borderRadius: 20`, `textTransform: "uppercase"`.

**Do not** change the font size below 9px or remove `textTransform: uppercase` — these are part of the stamp aesthetic.

---

## `Arrow`

**Props:** None.

**Renders:** A horizontal dashed line with a triangular arrowhead, pointing right (→). Used between task cards in the flow rows.

**Structure:**
```jsx
<div className="arrow-connector">   // display:flex, alignItems:center
  <div className="arrow-line"/>     // 2px tall, 24px wide, repeating dashed gradient
  <div className="arrow-head"/>     // CSS border triangle, 6px × 10px, burgundy
</div>
```

**Do not** replace this with an SVG or an image. The pure-CSS implementation is intentional.

---

## `Stamp`

**Props:** `{ children: string, color?: string }` — color defaults to `#6E1F2B`.

**Renders:** A tiny uppercase label with a dashed border, evoking a physical rubber stamp.

**Key styles:** `fontSize: 8`, `fontWeight: 700`, `letterSpacing: "0.18em"`, `textTransform: "uppercase"`, `borderRadius: 3`, `opacity: 0.8`, border is `2.5px dashed` in the specified colour.

**Used for:** All section labels — "PLAN BOARD", "FLOW MAP", "AI CO-PLANNER", "WEEK VIEW", "ACTIVE", "INTERRUPTION LOG", etc.

---

## `TaskCard`

**Props:**
```js
{
  task: Task,           // full task object from state
  onMarkDone: (id) => void,
  rotation: number      // index used to pick a rotation class (0–5)
}
```

**Renders:** A sticky-note-style card with a tape strip, title, note, time estimate, status chip, and (if not done) a "Mark Done" button.

**Structure:**
```
div.sticky-shadow.rotate-*         ← card wrapper, coloured bg from task.color
  div                              ← tape strip (absolute, top: -7px, centre)
  p.font-serif                     ← task title (13px, bold 700)
  p.font-sans                      ← task.note (9.5px, 0.75 opacity)
  div                              ← bottom row
    span.font-sans                 ← time estimate ("⏱ 3 hrs")
    StatusChip                     ← status pill
  button.btn-primary               ← "✓ MARK DONE" (hidden when status === "done")
```

**Rotation classes by index (mod 6):**
```
0 → (none)    1 → rotate-m1    2 → rotate-p1
3 → rotate-m05  4 → rotate-p05  5 → rotate-p15
```

**Constraints:**
- `minWidth: 115px`, `maxWidth: 128px` — do not widen cards
- Tape strip is `position: absolute`, `top: -7px` — the card wrapper needs `position: relative`
- If `task.status === "blocked"`, the card gets an additional `border: 2px solid #E9A6A6`
- `task.color` and `task.textColor` come from the task object — never hardcode colours inside the component

---

## Left panel (JSX block, not a component)

**Background:** `#E85D04` (burnt orange). **Border-right:** `3px solid #6E1F2B`.

**Contains:**
1. Section stamp + "Your Projects" display heading
2. Dashed horizontal divider
3. Project card — cream background, `diagonal-stripe` overlay, progress bar
4. Three stat rows (Total hrs / Planned / Remaining)
5. Add-task section (button or inline input, toggled by `showAddTask`)

**Progress bar:** Track is `#e2ddd6` with `1px solid #6E1F2B` border. Fill is a teal→green gradient, `width` driven by `pct` state, animated with `transition: width 0.4s ease`.

**Stat rows:** Use `rgba(245,239,227,0.18)` background and `rgba(245,239,227,0.3)` border — deliberately low contrast against the orange panel.

**Add-task input:** Controlled by `newTask` state. Submits on Enter (`onKeyDown`) or button click. On submit calls `handleAddTask()` which appends to `tasks` with a rotating colour from `["#F3B23C","#E9A6A6","#8FAF87","#5FB3B3","#F5EFE3"]`.

---

## Center canvas (JSX block, not a component)

**Background:** `#F5EFE3` cream. **Border-right:** `3px solid #6E1F2B`.

**Layout:** Column flex. Header bar at top, scrollable card area in the middle, legend strip at the bottom.

**Card area:** `overflowX: auto, overflowY: auto`. Has `dot-pattern` as an absolute positioned background overlay at `opacity: 0.4`.

**Two rows of cards:**
- Row 1: `tasks.slice(0, 4)` — cards at index 0–3 with Arrows between them
- Down-arrow connector between rows (absolute div with vertical dashed line + triangle)
- Row 2: `tasks.slice(4)` — cards at index 4–7 with Arrows between them

**Interruption card:** Conditionally rendered when `interruption === true`. Position: `absolute`, `bottom: 70`, `right: 30`. Has `slide-down` animation class and `rotate-m1` rotation. Background `#6E1F2B`, border `2px solid #E85D04`.

**Legend strip:** `border-top: 2px dashed rgba(110,31,43,0.2)`. Shows all four StatusChip variants side by side.

---

## Right panel (JSX block, not a component)

**Background:** `#6E1F2B` (deep burgundy). No border-right (it's the last column).

**Sections (top to bottom):**
1. Header — Stamp + "AI + Human Co-Flow" heading
2. Goal textarea — controlled by `goalInput`, `rows={3}`, semi-transparent cream-on-dark styling
3. Action buttons — "Break into Flow" (teal), "Reality Check" (outlined mustard), "Life Happened?" (orange) + "Replan" (outlined green) side by side
4. AI message block — dark semi-transparent container, messages rendered as individual `div`s; first message gets `rgba(232,93,4,0.2)` bg and `3px solid #E85D04` left border; subsequent messages get a softer style
5. Footer note — "Big picture is still alive." in mustard, centred, `opacity: 0.6`

**AI flash:** When `flashAI` is true, the message block container gets `className="slide-down"` to re-trigger the entrance animation. `flashAI` is set to `true` in `triggerAI()` and cleared after 600ms via `setTimeout`.

**Button layout note:** "Life Happened?" and "Replan" share a `display: flex, gap: 7` row. All buttons in this panel are full-width or half-width — no icon-only buttons.

---

## Bottom calendar strip (JSX block, not a component)

**Background:** `#23201D` (charcoal). **Border-top:** `3px solid #E85D04`.

**Layout:** Column flex. Header row (Stamp + title + date range) then a 7-column CSS Grid.

**Grid:** `gridTemplateColumns: "repeat(7, 1fr)"`, `gap: 6`.

**Each day cell:**
- Header: day abbreviation (Mon–Sun) in small uppercase + date number in Fraunces 15px
- Task blocks: one `cal-block` div per task, coloured by `day.colors[i]`
- Empty days show "Free" in `rgba(245,239,227,0.2)`
- Interruption cells (`isInterruption === true`) get `border: 1.5px solid rgba(232,93,4,0.5)` and task text in mustard

**`calendar` state shape:**
```js
{ day: string, date: string, tasks: string[], colors: string[], isInterruption?: boolean }
```

---

## Naming conventions

- Components: PascalCase (`TaskCard`, `StatusChip`)
- Handler functions: `handle*` prefix (`handleMarkDone`, `handleAddTask`)
- AI trigger: `triggerAI(mode: string)` — takes a key from `AI_MESSAGES`
- State setters follow React convention: `setTasks`, `setAiMessages`, etc.
- CSS class names: kebab-case, defined only in `FontLink`
- Inline style objects: camelCase keys, all values as strings or numbers per React convention
