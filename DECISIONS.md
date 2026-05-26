# DECISIONS.md — Threadly

Log of intentional architectural and design decisions.
Before "fixing" or "improving" anything in this project, check here first.
If a decision is listed below, it is deliberate — do not change it without explicit instruction.

---

## Architecture

### Single file (`Threadly.jsx`)
**Decision:** The entire app lives in one `.jsx` file — components, styles, data, handlers.
**Why:** This is a personal-use MVP, not a production codebase. A single file means zero import/export complexity, instant readability, and easy sharing as a React artifact. The file is ~500 lines — well within comfortable reading range.
**Do not:** Split into `components/`, `hooks/`, `styles/`, or `utils/` folders. Do not create a `TaskCard.jsx` or `useThreadly.js` etc.

### No build step
**Decision:** The app runs directly as a React JSX artifact (or in a minimal Vite sandbox). No Webpack, no CRA, no Next.js, no TypeScript compilation.
**Why:** Faster iteration, zero config, no dependency drift. The scope does not justify a build pipeline.
**Do not:** Add `tsconfig.json`, `webpack.config.js`, `.babelrc`, or `vite.config.js` unless the user explicitly asks to migrate to a local dev environment.

### No backend, no API
**Decision:** Zero server-side code. No REST endpoints, no GraphQL, no Supabase, no Firebase.
**Why:** Personal planning tool. Data does not need to be shared, synced, or persisted across devices.
**Do not:** Suggest or add a backend. Do not add `fetch()` calls to external APIs.

### No localStorage (in artifact environment)
**Decision:** State is ephemeral — it resets on page reload. `localStorage` is explicitly not used.
**Why:** The Claude artifact sandbox does not support `localStorage`. Attempting to use it will cause a silent failure.
**Exception:** If the user explicitly moves to a local Vite environment and asks for persistence, then localStorage can be added. See `TASKS.md` P0 item.

### Mock AI, not real AI
**Decision:** All "AI" responses are static strings in the `AI_MESSAGES` constant object.
**Why:** No API key, no latency, no cost, no complexity. The mock responses are carefully written to feel plausible and warm — they serve the UX goal without real inference.
**Do not:** Add an `import Anthropic` or `fetch('https://api.openai.com/...')` call. Do not suggest wiring up a real LLM "to make it better."

---

## Styling

### All CSS in `FontLink`, not a separate file
**Decision:** Custom CSS classes are injected via a `<style>` tag inside the `FontLink` component. There is no `index.css`, `App.css`, or `tailwind.css` file.
**Why:** Artifact environment has no file system for CSS. Keeping styles co-located in the JSX file means the entire app is self-contained and portable.
**Do not:** Create a separate CSS file. Do not move styles out of `FontLink`.

### Tailwind utility classes via CDN, not compiled
**Decision:** Tailwind is used for a small number of utility classes (e.g. `flex`, `items-center`). It is loaded from CDN — there is no `tailwind.config.js` and no JIT compilation.
**Why:** No build step. Only Tailwind's base/preflight classes are available. Custom tokens (colours, fonts) cannot be added to the Tailwind config.
**Implication:** Never use Tailwind classes that depend on custom config values (e.g. `text-burgundy`, `bg-cream`). Use inline `style={{}}` props for all custom colours and values instead.

### Inline styles for all custom values
**Decision:** Custom colours, sizes, borders, and spacing that fall outside standard Tailwind utilities are always written as inline `style={{}}` props in React, not as custom CSS classes.
**Why:** It avoids a parallel naming system and makes the values explicit and searchable. Inline styles also make it obvious which values are "ours" vs. which come from Tailwind or `FontLink`.
**Exception:** Hover states, animations, pseudo-elements, and media queries cannot be expressed as inline styles — those go in `FontLink`.

### Card rotations are required
**Decision:** Every `TaskCard` receives a `rotation` prop (an integer) which maps to a rotation CSS class (`rotate-m1`, `rotate-p1`, etc.). No card should sit at exactly 0 degrees.
**Why:** The scrapbook / planning wall aesthetic depends on slight imperfection. Removing rotations makes the canvas look like a grid table and destroys the visual intent.
**Do not:** Set all cards to `rotation={0}` or remove the rotation logic "for alignment."

### Cream background, never white
**Decision:** `#F5EFE3` is the global background. Pure white (`#ffffff`) is never used on any surface.
**Why:** White reads as clinical SaaS. Cream is warm, tactile, editorial — it's foundational to the aesthetic. Even "white" elements (like the tape strip on cards) use cream at partial opacity.
**Do not:** Replace `#F5EFE3` with `#fff` anywhere, even for "simplicity."

### Shadows use warm charcoal, not grey
**Decision:** All box-shadows use `rgba(35,32,29,...)` (charcoal) as the shadow colour.
**Why:** Cold grey shadows (`rgba(0,0,0,...)`) feel digital and flat against the warm palette. Warm shadows make cards feel like they are physically resting on a surface.
**Do not:** Use `rgba(0,0,0,0.2)` or similar cold shadow values.

---

## Typography

### Fraunces + Space Grotesk only
**Decision:** Two typefaces, no more. Fraunces for headings and card titles; Space Grotesk for everything else.
**Why:** The pairing is intentional — warm editorial serif contrasted with a clean, slightly quirky grotesque. Adding a third typeface creates visual noise.
**Do not:** Introduce Inter, Roboto, system-ui, or any other typeface. Do not change the Google Fonts import URL.

### Oversized headings
**Decision:** Display headings are large (22–32px) and use `fontWeight: 900`. This is intentional, not an accessibility mistake.
**Why:** Editorial hierarchy. The contrast between enormous headings and tiny 9px stamps is part of the visual language.
**Do not:** Reduce heading sizes to "normalise" the hierarchy.

---

## Data

### `INITIAL_TASKS` as the source of truth for the default flow
**Decision:** The 8-task default flow is defined once in `INITIAL_TASKS` and never duplicated. `handleBreakFlow()` resets to this constant.
**Why:** Single source of truth. If the default task list needs to change, it changes in one place.
**Do not:** Hardcode task arrays inline inside handler functions.

### Task colours stored on the task object, not derived
**Decision:** Each task object has `color` and `textColor` fields. The card component reads these props directly — it does not compute colour from status or index.
**Why:** Allows per-task colour customisation in the future (e.g. user picks a colour). Deriving from status would couple colour to state in a way that's hard to override.
**Implication:** When adding tasks programmatically, always include `color` and `textColor`. See `handleAddTask()` for the rotating palette logic.

---

## UX

### No modals
**Decision:** No popups, dialogs, or overlays. All interactions happen inline (e.g. the add-task input slides into the left panel; the interruption card appears on the canvas).
**Why:** Modals interrupt flow and feel like generic software. Inline interactions feel more like a physical planning wall.
**Do not:** Open a modal for task editing, task creation, or AI suggestions.

### No confirmation dialogs
**Decision:** Destructive actions (delete task, mark done) execute immediately without "Are you sure?" prompts.
**Why:** This is a personal tool. The user knows what they're doing. Confirmation dialogs add friction without safety value at this scale.

### AI panel is a co-planner, not a chatbot
**Decision:** The right panel shows pre-written suggestion blocks triggered by buttons. It is not a freeform chat interface.
**Why:** A chat interface would require real inference, streaming, and message history management — all out of scope. The button-triggered model is simpler and more intentional: each action has a clear, predictable response.
**Do not:** Replace the AI panel with a chat UI or add a message input with a send button as the primary interaction.
