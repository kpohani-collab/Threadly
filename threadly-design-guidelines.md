# Threadly — Design Guidelines

> *A personal AI + human planning wall. Warm, tactile, editorial. Not a SaaS dashboard.*

---

## 1. Design Philosophy

Threadly is built on a single premise: **planning should feel like making, not managing.** The visual language is borrowed from editorial design, physical scrapbooking, and the layered texture of a well-used studio wall — not from productivity software.

Three principles govern every decision:

**Tactile over polished.** Slightly imperfect is intentional. Cards are rotated. Borders are dashed. Tape strips sit on sticky notes. The interface should feel like it has been touched.

**Editorial over utilitarian.** Typography is dramatic and oversized where it matters. Labels are stamped, not simply typeset. Hierarchy is communicated through weight, size, and contrast — not just colour.

**Warm over neutral.** The palette is rooted in spice, clay, and parchment. Nothing here is grey. Every background, every surface, every accent earns its place in the emotional register of the app.

---

## 2. Colour Palette

### Core Colours

| Token | Hex | Role |
|---|---|---|
| `--cream` | `#F5EFE3` | Global background, card surfaces, light text on dark |
| `--orange` | `#E85D04` | Primary panels (left sidebar), CTA buttons, accent borders |
| `--burgundy` | `#6E1F2B` | Right panel, headings, decorative borders, body dividers |
| `--teal` | `#5FB3B3` | Primary interactive buttons, "Doing" status chip, calendar blocks |
| `--charcoal` | `#23201D` | Body text on light surfaces, calendar strip background |

### Accent Colours (Sticky Notes & Tags)

| Token | Hex | Use |
|---|---|---|
| `--mustard` | `#F3B23C` | Sticky notes, AI panel labels, calendar blocks, highlight text |
| `--pink` | `#E9A6A6` | Sticky notes, "Blocked" status chip, soft callouts |
| `--green` | `#8FAF87` | Sticky notes, "Done" status chip, progress bar |

### Colour Rules

- **Never use pure white (`#FFFFFF`)** as a background. Always use cream `#F5EFE3` or a tinted surface.
- **Never use pure black (`#000000`)** for text. Charcoal `#23201D` is the darkest text colour.
- Orange and burgundy are **never used together as background + text** at small sizes — contrast is insufficient. Use cream or mustard as text on those backgrounds.
- Teal is the **only colour for interactive/clickable elements** by default. This creates a consistent affordance signal.
- Sticky note colours (mustard, pink, green, cream, teal, orange, burgundy) rotate by index across dynamically added cards. No two adjacent cards should share the same colour if avoidable.

### Opacity Scale

Transparency is used extensively for layered textures and subtle surfaces. Use these values only:

| Level | Value | Use |
|---|---|---|
| Ghost | `0.05` | Dark panel inner surfaces |
| Whisper | `0.08` – `0.12` | Panel overlays, textarea backgrounds |
| Soft | `0.18` – `0.22` | Sidebar stat rows |
| Medium | `0.35` | Dashed stamp borders |
| Visible | `0.50` – `0.75` | Tape strip on cards, texture overlays |

---

## 3. Typography

### Typefaces

| Face | Source | Use |
|---|---|---|
| **Fraunces** | Google Fonts | All display headings, card titles, progress numbers |
| **Space Grotesk** | Google Fonts | All UI labels, body text, buttons, status chips, captions |

Fraunces is an optical-size variable serif with a warm, slightly irregular character — it reinforces the editorial, handcrafted feel. Space Grotesk is geometric but friendly, readable at small sizes, and never clinical.

**Fallback stack:** `Georgia, serif` for Fraunces; `sans-serif` for Space Grotesk.

### Type Scale

| Level | Size | Weight | Face | Use |
|---|---|---|---|---|
| Display | `32px` | 900 | Fraunces | App name, section heroes ("Your Projects") |
| Heading 1 | `22px` | 900 | Fraunces | Panel headings ("Visual Task Flow") |
| Heading 2 | `18px` | 900 | Fraunces | Sub-panel titles ("AI + Human Co-Flow") |
| Heading 3 | `15px` | 700 | Fraunces | Card titles, project card names |
| Progress Number | `20px` | 900 | Fraunces | Percentage display in stat rows |
| Body | `11px – 12px` | 400 – 500 | Space Grotesk | Descriptions, AI messages, textarea, notes |
| Label | `9px – 10px` | 600 – 700 | Space Grotesk | Stamps, status chips, calendar day labels, section tags |
| Micro | `8px – 9px` | 700 | Space Grotesk | Decorative stamps, tiny metadata |

### Typography Rules

- Headings use `letter-spacing: -0.02em` to -0.03em for density and editorial punch.
- Labels use `letter-spacing: 0.08em` to `0.18em` and are always **UPPERCASE**.
- Line height for display text: `1.05` – `1.1`. For body: `1.35` – `1.5`.
- Mix type sizes aggressively within a panel — contrast between huge headings and tiny labels is part of the visual language, not a mistake.
- Italic Fraunces (`font-style: italic`) can be used sparingly for pull-quotes or emphasis on AI messages.

---

## 4. Spacing & Layout

### Grid

Threadly uses a **3-column + bottom strip** layout:

| Zone | Width | Purpose |
|---|---|---|
| Left Panel | `230px` fixed | Project list, progress, add task |
| Center Canvas | `1fr` (flexible) | Task flow, sticky notes |
| Right Panel | `260px` fixed | AI co-planner, actions |
| Bottom Strip | Full width, `auto` height | Weekly calendar |

The layout is set in CSS Grid: `gridTemplateColumns: "230px 1fr 260px"`. The bottom strip sits outside the grid as a flex row.

### Spacing Scale

Use multiples of **4px** as the base unit.

| Token | Value | Use |
|---|---|---|
| `xs` | `4px` | Tight gaps between chips and inline elements |
| `sm` | `6–8px` | Button padding, card inner gaps |
| `md` | `10–12px` | Panel inner padding, card padding |
| `lg` | `16–20px` | Panel horizontal padding |
| `xl` | `24–28px` | Section spacing, canvas top padding |

### Borders

Three border styles are used, each with a distinct role:

| Style | CSS | Role |
|---|---|---|
| Structural | `3px solid #6E1F2B` | Panel separators, project card borders |
| Decorative | `2.5px dashed rgba(110,31,43,0.35)` | Stamp elements, small UI tags |
| Soft | `1.5px dashed rgba(243,178,60,0.4)` | AI message area, textarea, calendar cells |

Never use a plain `1px solid` border on visible UI surfaces — it reads as generic. Use the structural or soft border styles.

---

## 5. Components

### 5.1 Sticky Note Card

The core unit of the canvas. Each card represents a task.

**Anatomy:**
- Tape strip: `36 × 14px`, cream at `55%` opacity, positioned at top-centre, `top: -7px`
- Card body: coloured background from the accent palette
- Title: Fraunces 13px, bold 700, card's `textColor`
- Description note: Space Grotesk 9.5px, `0.75` opacity
- Time estimate: Space Grotesk 9px, bold
- Status chip: inline at bottom-right
- "Mark Done" button: only visible when task is not completed

**Shadow:** `3px 5px 18px rgba(35,32,29,0.22), 0 1px 3px rgba(35,32,29,0.12)`

**Rotation:** Cards are rotated by small amounts (`-1.2deg` to `+1.5deg`) assigned by index. This is **deliberate and must be preserved** — removing rotations makes the canvas look like a table, not a planning wall.

**Sizes:** `minWidth: 115px`, `maxWidth: 128px`. Cards are intentionally narrow and tall to feel like physical sticky notes.

### 5.2 Status Chip

Small pill tag indicating task state. Always uppercase, 9px Space Grotesk, bold.

| Status | Background | Text |
|---|---|---|
| Not Started | `#e2ddd6` | `#23201D` |
| Doing | `#5FB3B3` (teal) | `#fff` |
| Blocked | `#E9A6A6` (pink) | `#6E1F2B` |
| Done | `#8FAF87` (green) | `#fff` |

"Doing" chips include a small pulsing dot (`5×5px` circle, white, `pulse` animation at `1.4s`).

### 5.3 Stamp

A tiny decorative label evoking a physical rubber stamp.

- Font: Space Grotesk, 8px, bold 700, `letter-spacing: 0.18em`, uppercase
- Border: `2.5px dashed` in the stamp's colour at `0.35` opacity
- Border radius: `3px` (slightly rounded, not pill)
- Opacity: `0.8`
- Used for: section labels ("PLAN BOARD", "FLOW MAP", "INTERRUPTION LOG")

### 5.4 Arrow Connector

Connects task cards in the flow. Made from pure CSS (no SVG needed).

- Line: `2px` height, repeating dashed gradient in burgundy (`6px on, 4px gap`)
- Width: `24px`
- Arrowhead: CSS `border` triangle, `6px` tall, `10px` wide, burgundy

### 5.5 Buttons

Three button variants, each with a clear role:

| Variant | Background | Text | Use |
|---|---|---|---|
| Primary (`btn-primary`) | `#5FB3B3` teal | White | Main CTA: "Break into Flow", "Mark Done" |
| Secondary (`btn-secondary`) | Transparent | Burgundy/custom | Outlined: "Reality Check" |
| Orange (`btn-orange`) | `#E85D04` | White | Urgent actions: "Life Happened?" |

All buttons use Space Grotesk, `font-weight: 700`, `letter-spacing: 0.04–0.06em`, uppercase or sentence case. Hover states shift brightness and apply a `translateY(-1px)` lift.

Buttons inside the AI panel (on the dark burgundy surface) use contrasting border and text colours rather than the standard variants.

### 5.6 Progress Bar

- Track: `#e2ddd6`, `8px` tall, `border-radius: 4px`, `1px solid #6E1F2B` border
- Fill: linear gradient from teal `#5FB3B3` to green `#8FAF87`, animated with `transition: width 0.4s ease`
- Percentage label: Fraunces 20px, bold 900, orange `#E85D04` — oversized by design

### 5.7 Calendar Block

Compact task label for the bottom strip.

- Font: Space Grotesk, 10px, bold 600
- Background: inherits from task colour (teal or mustard for tasks; burgundy for interruptions)
- Text: white, or mustard `#F3B23C` on burgundy background
- Border radius: `4px`
- Padding: `2px 5px`
- Overflow: hidden, text-overflow ellipsis

---

## 6. Texture & Decorative Patterns

Texture is applied via CSS only — no external images, no SVG files. These patterns add depth and reinforce the tactile aesthetic.

### Paper Texture (Global Background)
```css
background-image: repeating-linear-gradient(
  0deg, transparent, transparent 24px,
  rgba(110,31,43,0.04) 24px, rgba(110,31,43,0.04) 25px
);
```
Subtle horizontal rules, like lined paper. Applied to the entire app wrapper.

### Dot Pattern (Canvas)
```css
background-image: radial-gradient(circle, rgba(110,31,43,0.15) 1px, transparent 1px);
background-size: 12px 12px;
```
Grid of tiny dots, like a bullet journal page. Applied to the center canvas at `opacity: 0.4`.

### Diagonal Stripe (Project Cards)
```css
background-image: repeating-linear-gradient(
  45deg,
  transparent, transparent 4px,
  rgba(232,93,4,0.12) 4px, rgba(232,93,4,0.12) 8px
);
```
Faint diagonal hatching. Applied as an overlay inside the project card at `opacity: 0.5`.

### Dashed Dividers
Horizontal dividers use dashed repeating gradients rather than solid lines:
```css
background-image: repeating-linear-gradient(
  90deg, #6E1F2B 0 8px, transparent 8px 14px
);
```
Height: `3px`. Used between sections inside the left panel.

### Torn Edge
The left panel header can use a CSS `::after` pseudo-element to simulate a torn paper edge at the bottom of a block. See the `torn-bottom` class.

---

## 7. Animation & Motion

Threadly uses minimal, purposeful motion. Nothing animates continuously except the "Doing" pulse indicator.

| Animation | Duration | Easing | Trigger |
|---|---|---|---|
| `slideDown` | `0.25s` | `ease` | AI message swap, interruption card, add-task input |
| `pulse` | `1.4s infinite` | default | "Doing" status chip dot |
| Progress bar width | `0.4s` | `ease` | On task marked done |
| Button hover lift | `0.1s` | default | Hover on primary/orange buttons |
| AI panel background flash | `0.6s` | state clear | On any AI action button click |

**Motion rules:**
- Never animate layout (no width/height transitions on panels).
- Entrances use `slideDown` only — no bounce, no spring physics.
- No exit animations. Elements appear; they don't disappear with fanfare.

---

## 8. Microcopy & Voice

The language in Threadly is warm, direct, and slightly personal. It assumes the user is a capable adult who sometimes gets overwhelmed.

### Principles

- **Address the user as a collaborator**, not as a subject. "We" and "Let's" over "You should."
- **Acknowledge reality** without catastrophising. "Life happened — and that's okay."
- **Be brief.** AI messages are 1–2 sentences. Labels are 1–3 words.
- **Never be robotic.** Avoid "Task successfully marked as complete." Prefer "Done ✓"

### Example Copy

| Element | Copy |
|---|---|
| Goal input placeholder | "What are we finishing?" |
| Add task prompt | "Break this into tiny wins" |
| Interruption card | "Life happened — and that's okay." |
| Replan prompt | "Let's re-route, not panic." |
| AI footer | "Big picture is still alive." |
| Blocking warning | "This task is blocking the next one." |
| Reality check | "Reduce scope or add 2 deep-work blocks." |
| Empty calendar day | "Free" |

### Labels (Stamps)

All stamp labels are uppercase, max 2 words:

`PLAN BOARD` · `FLOW MAP` · `AI CO-PLANNER` · `WEEK VIEW` · `ACTIVE` · `INTERRUPTION LOG` · `REALITY CHECK`

---

## 9. Accessibility Notes

Threadly is a personal-use tool, but these minimums should be maintained:

- All interactive elements (buttons, inputs) have a minimum touch/click target of `28px × 28px`.
- Status chips use both **colour and text** to convey state — never colour alone.
- The pulsing "Doing" dot is supplemental to the chip label, not the sole indicator.
- Font sizes below `10px` are decorative only (stamps, micro labels) and do not convey critical information.
- Keyboard: the add-task input supports `Enter` to submit.
- Focus outlines: not styled in the MVP — add `outline: 2px solid #5FB3B3` on `:focus-visible` if extending the app.

---

## 10. Do / Don't

| Do | Don't |
|---|---|
| Use cream `#F5EFE3` as the base background | Use white `#FFFFFF` anywhere |
| Rotate sticky note cards by 0.5–1.5 degrees | Remove rotations for a "cleaner" look |
| Use oversized Fraunces headings | Use uniform type sizes across a panel |
| Mix uppercase micro-labels with large serif headings | Use only one type size per panel |
| Use dashed or dotted borders for decorative elements | Use plain `1px solid` borders on visible surfaces |
| Keep AI messages short and conversational | Write robotic confirmation messages |
| Use the teal `#5FB3B3` for primary interactive affordances | Introduce a new accent colour for buttons |
| Keep shadows warm (`rgba(35,32,29,...)`) | Use cold grey shadows |
| Layer textures (dot pattern + paper lines) at low opacity | Apply textures at full opacity |
| Let the canvas feel slightly asymmetric | Centre-align every element on the canvas |

---

*Design by Khushbu · Threadly MVP · May 2026*
