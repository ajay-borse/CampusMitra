# CampusMitra — “Campus Workshop” Design System

A warm, tactile skeuomorphic interface built from physical materials: walnut, cork,
paper, leather, brass, felt, enamel, and painted steel. Every surface looks like it
could be picked up, pinned, stamped, or opened. The goal is a campus noticeboard
and workshop desk — not a dark cyber dashboard.

> **Scope:** this document describes the presentation layer in `frontend/`.
> It does not change routes, API contracts, socket events, form field names, or
> business logic.

---

## 1. Design intent

| Principle | Expression |
| --- | --- |
| **Physical, not flat** | Layered bevels, inset shadows, paper grain, stitched borders, hardware |
| **Warm, not neon** | Walnut, cork, parchment, brass, brick, forest, terracotta, teal, olive |
| **One light source** | Highlights sit top-left; shadows fall bottom-right on every element |
| **Tactile interaction** | Buttons lift and press, toggles snap, links ink-underline, cards straighten |
| **Readable first** | Parchment cards carry dark ink; bright metal accents stay on dark boards |
| **Handmade, not noisy** | Textures are CSS/SVG only; no runtime image dependencies |

The shell is a **walnut desk**. Pages are **material boards** mounted on it.
Cards are **paper slips** or **photo mounts** pinned to those boards.

---

## 2. File architecture

```
frontend/
├─ index.html                 # warm title, theme-color, inline SVG favicon, fonts
└─ src/
   ├─ index.css               # imports the four layers, in order
   └─ styles/
      ├─ tokens.css           # palette, materials, type, shadows, motion, textures
      ├─ base.css             # reset, shell, navbar, footer, utilities, keyframes
      ├─ components.css       # reusable tactile controls
      └─ pages.css            # module surfaces, layouts, responsive rules
```

Import order is mandatory:

```css
@import './styles/tokens.css';
@import './styles/base.css';
@import './styles/components.css';
@import './styles/pages.css';
```

Rules:

- Add **new tokens** to `tokens.css`, not to page files.
- Add **new reusable controls** to `components.css`.
- Add **module-specific layout** to `pages.css` under a page wrapper selector.
- Never hard-code a colour when an existing token expresses the role.
- Page-specific overrides must be scoped under the page wrapper.

---

## 3. Tokens

All tokens live in `src/styles/tokens.css` on `:root`.

### 3.1 Core surfaces

| Token | Value | Use |
| --- | --- | --- |
| `--bg-app` | `#2b1d14` | App background behind boards |
| `--bg-surface` | `#f2e4c7` | Generic parchment surface |
| `--bg-surface-elevated` | `#f8eed8` | Raised parchment |
| `--bg-card` | `#f5e8ce` | Default paper card |
| `--bg-card-hover` | `#fbf1dd` | Hovered paper card |
| `--bg-subtle` | `#e8d6b4` | Recessed paper well |
| `--border-subtle` | `#c8b18a` | Soft paper edge |
| `--border-card` | `#b59a6e` | Card border |
| `--border-focus` | `#a9661f` | Focus ring on paper |

`--bg-glass` is retained only as a legacy alias mapped to opaque parchment.
It is **not** glassmorphism; there is no transparency blur anywhere.

### 3.2 Ink and semantic accents

| Token | Value | Use |
| --- | --- | --- |
| `--text-primary` / `--ink` | `#2a2118` | Primary ink on paper |
| `--text-secondary` / `--ink-soft` | `#4e3d2b` | Secondary ink |
| `--text-muted` / `--ink-muted` | `#6d5841` | Muted ink (≥ 5.4:1 on paper) |
| `--primary` | `#7d4c15` | Walnut-brown action |
| `--secondary` | `#914434` | Brick-red action |
| `--accent-green` | `#3d6045` | Success |
| `--accent-amber` | `#7b5a16` | Warning / gold ink on paper |
| `--accent-red` | `#8f3226` | Danger |
| `--accent-cyan` | `#2f615d` | Info (teal, never electric blue) |
| `--text-on-dark` | `#f6ead2` | Cream type on dark boards |
| `--text-on-dark-muted` | `#d9c3a0` | Muted cream on dark boards |

### 3.3 Material palette

| Material | Tokens | Character |
| --- | --- | --- |
| **Walnut** | `--walnut`, `--walnut-dark`, `--walnut-light` | Desk shell, navbar, footer |
| **Cork** | `--cork`, `--cork-light`, `--cork-dark` | Plans board |
| **Paper** | `--paper`, `--paper-deep`, `--paper-edge` | Cards, forms, modals, tickets |
| **Leather** | `--leather`, `--leather-dark`, `--leather-light` | Discover, Connections |
| **Brass** | `--brass`, `--brass-light`, `--brass-dark` | Hardware, primary buttons, seals |
| **Mustard** | `--mustard`, `--mustard-light` | Plans accents, focus ring on light |
| **Brick** | `--brick`, `--brick-light` | Plans accents, danger ink |
| **Forest** | `--forest`, `--forest-light` | Circles felt |
| **Ivory** | `--ivory` | Circles type |
| **Copper** | `--copper` | Circles accent, “vibe” icons |
| **Terracotta** | `--terracotta` | Pulse board |
| **Teal enamel** | `--teal`, `--teal-light` | Radar board |
| **Sand** | `--sand` | Radar cards |
| **Cream** | `--cream` | Chat surface |
| **Olive** | `--olive`, `--olive-light` | Chat accent, Settings spine |
| **Tan** | `--tan` | Chat secondary hardware |
| **Gunmetal** | `--gunmetal`, `--gunmetal-dark` | Admin shell |
| **Steel** | `--steel`, `--steel-light` | Admin panels |
| **Safety orange** | `--safety-orange` | Admin spine and caution accents |

### 3.4 Typography

| Token | Family | Role |
| --- | --- | --- |
| `--font-heading` | **Bitter** (serif) | Page titles, card titles, stamps |
| `--font-sans` | **Source Sans 3** | Body, controls, navigation |
| `--font-accent` | **Caveat** | Sticky-note / handwritten accents only |
| `--font-mono` | **IBM Plex Mono** | Counts, codes, technical metadata |

Rules:

- Headings are Bitter with tight tracking; body is Source Sans 3 at 16px / 1.55.
- Caveat is seasoning — never body copy or form labels.
- Use tabular/mono treatment for counts and numeric metrics where alignment matters.
- Uppercase labels use `letter-spacing: 0.045em` and small sizes.

### 3.5 Radii, shadows, light

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | `4px` | Buttons, inputs, badges |
| `--radius-md` | `7px` | Panels, small modals |
| `--radius-lg` | `11px` | Page boards, cards, dialogs |
| `--radius-xl` | `16px` | Large feature surfaces |
| `--radius-full` | `9999px` | Pills, dots, avatars |

Shadows follow **one top-left light source**:

```css
--shadow-raised:
  inset 0 1px 0 rgba(255, 246, 225, 0.62),   /* top highlight */
  inset 0 -2px 0 rgba(79, 45, 14, 0.28),     /* bottom bevel */
  0 4px 0 rgba(83, 49, 18, 0.65),            /* physical edge */
  0 8px 14px rgba(30, 16, 7, 0.28);          /* cast shadow */
```

- **Raised** controls: highlight inset on top, solid “edge” below, soft cast shadow.
- **Recessed** controls: `--shadow-pressed` / `--inset-soft` (dark inset at top).
- **Boards**: `inset 0 1px 0` highlight, `inset 0 -3px 0` lower bevel,
  `0 4px 0` hard edge, large soft shadow.
- Never place a highlight on the bottom edge or a shadow on the top edge.

### 3.6 Motion

| Token | Value | Use |
| --- | --- | --- |
| `--dur-fast` | `150ms` | Colour, border, small state changes |
| `--dur-base` | `240ms` | Hover lift, toggles, drawers |
| `--dur-slow` | `350ms` | Page entrance, stamps, larger moves |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Lift, toggle knob, stamps |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Fades, page entrance |

### 3.7 Textures

All textures are hand-written CSS gradients or inline SVG data URIs:

| Token | Material |
| --- | --- |
| `--texture-noise` | Coarse SVG fractal noise overlay |
| `--texture-fine-noise` | Fine SVG noise for small surfaces |
| `--texture-wood` | Walnut grain with warm top-left bloom |
| `--texture-cork` | Speckled cork granules |
| `--texture-paper` | Parchment fibre lines and corner shading |
| `--texture-leather` | Pebbled leather with soft highlight |
| `--texture-felt` | Dense forest felt |
| `--texture-enamel` | Glossy teal enamel |
| `--texture-metal` | Gunmetal with vertical brushing |
| `--texture-brushed` | Brushed steel for Admin panels |

Usage pattern:

```css
background-color: var(--paper);
background-image: var(--texture-noise), var(--texture-paper);
background-size: 160px 160px, cover;
```

No external image URLs, no Unsplash, no runtime texture downloads.

---

## 4. Layout shell

- `.app-shell` — full-height column.
- `.main-viewport` — centered, `max-width: 1360px`, generous desk margins.
- `.navbar-container` — sticky walnut plank with a brass inlay strip.
- `.footer-bar` — walnut footer with brass hairline and warm links.
- `.page-header-row` — title on the left, actions on the right, wraps on small screens.
- `.paper-panel` — generic parchment panel for small content blocks.

The body background is walnut wood with a fixed top-left warm bloom and a
bottom-right darkening. This establishes the global light direction.

---

## 5. Components

### 5.1 Buttons

Base `.btn` is a raised paper-and-brass key:

- top highlight + bottom bevel + solid edge + cast shadow;
- hover: `translateY(-2px) rotate(-0.25deg)`, stronger edge;
- active: presses **down** into the desk with inset shadow;
- disabled: desaturated, striped “locked” material, `cursor: not-allowed`.

Variants:

| Class | Material |
| --- | --- |
| `.btn-primary` | Brass key with dark ink label |
| `.btn-secondary` | Pale parchment |
| `.btn-outline` | Paper outline with hardware border |
| `.btn-ghost` | Bare stamped label |
| `.btn-danger` | Oxblood enamel |
| `.btn-danger-soft` | Pale clay danger |
| `.btn-success` | Forest enamel |
| `.btn-wood` / `.btn-wood-danger` | Dark wood chip for use on photos |
| `.btn-sm`, `.btn-xs`, `.btn-lg`, `.btn-block` | Size modifiers |
| `.btn-text` | Ink-style text action, no lift |

### 5.2 Forms

- `.form-label` — small uppercase stamped label.
- `.form-control` / `.form-input` — **debossed** paper well:
  inset shadow, warm border, fine fibre lines.
- Focus: brass border plus warm outer ring (`--primary-glow`), never blue.
- Placeholder: muted ink at ≥ 4.5:1.
- `.form-hint` / `.form-error` — small helper and danger text.
- `.input-with-icon` / `.search-input-wrapper` — icon sits in a recessed slot.

### 5.3 Toggles

Physical rocker switches:

- recessed track with inner shadow;
- cream knob with top highlight and cast shadow;
- checked track turns brass;
- knob slides with `--ease-spring`;
- both `.toggle-row input[type="checkbox"]` and `.toggle-switch` patterns exist.

### 5.4 Badges and chips

- `.badge` — small stamped metal/paper label with a bevel.
- Variants: `primary/accent`, `warning`, `success`, `danger`, `neutral`,
  `verified`, `program`, `pending`, `unverified`.
- `.chip`, `.chip-tag`, `.chip-goal`, `.chip-interest`, `.chip-selectable` —
  paper tags; selected chips press in and turn brass.
- Radar category badges use material names, not colour names:
  `.badge-coding`, `.badge-study`, `.badge-sports`, `.badge-coffee`,
  `.badge-gaming`, `.badge-events`, `.badge-default`.

### 5.5 Cards and boards

- Page wrappers are material boards with an inner dashed “stitch” line
  (`::before`) on dark modules.
- Paper cards use `--texture-paper` + noise, a fine edge, and a 2–4px hard bottom edge.
- Hover lifts cards slightly and straightens rotated photo mounts.
- Circles felt cards, Radar sand cards, and Admin steel panels each define their
  own material, but share the same lighting logic.

### 5.6 Modals and drawers

- `.modal-backdrop` — warm vignette, no blur.
- `.modal-dialog` — parchment sheet with a perforated brass strip across the top,
  stitched header/footer rules, and a spring scale-in.
- Close button is a round brass-trimmed paper button that rotates on hover.
- Mobile navigation uses `.mobile-drawer` with a downward paper-unfurl animation.

### 5.7 Match celebration — admission ticket

`SocketContext` opens a physical ticket, not a neon modal:

- `.match-modal-card` is perforated paper with punched side notches
  (`::before` / `::after`) and a wax-seal avatar ring;
- `.match-badge` is a rotated “MUTUAL MATCH” rubber stamp;
- avatars are photo mounts with cream borders and slight opposite rotations;
- a brick-red wax seal with a graduation-cap icon sits at the centre;
- `stampIn` animation lands the ticket with a spring;
- confetti is recoloured to brass, copper, brick, forest, and cream.

### 5.8 Toasts

- Parchment slip with a coloured material spine on the left.
- Lucide status icon in a small stamped circle.
- Slide in from the right with a slight rotation, then settle.
- Variants: `toast-success`, `toast-error`, `toast-warning`, `toast-info`.
- Close control is always present and keyboard reachable.

### 5.9 Empty states

- `.empty-state-box` — recessed paper well with a dashed edge.
- `.empty-state-icon` — circular brass/paper medallion containing a Lucide icon.
- `EmptyState` maps legacy emoji props to Lucide icons internally; pages should
  pass a Lucide component directly when possible.

### 5.10 Skeletons and tables

- Skeletons are warm paper bars with a slow brass shimmer; no blue-grey shimmer.
- `.custom-table` sits on a paper panel with a hardware header and stitched rows.
- Action buttons in tables use the same tactile icon-button treatment.

### 5.11 Photo mounts

- `.photo-slot-card` — cream photo mount with a thicker bottom border.
- Cover badge is a brass plate; hover overlay is a dark wood wash with brass buttons.
- Avatars use a local inline-SVG fallback (`src/utils/defaultAvatar.js`),
  never a remote placeholder service.

---

## 6. Module themes

| Route | Wrapper | Board material | Accents |
| --- | --- | --- | --- |
| Landing | `.landing-page-container` | Parchment hero on walnut | Brass, brick, forest, teal feature tiles |
| Login / Register | `.auth-page-container` | Parchment card on walnut | Brass hardware |
| Dashboard | standard viewport | Parchment cards | Brass, teal, brick |
| Discover | `.discover-page-container` | Dark leather | Brass, cream |
| Connections | `.connections-page-container` | Dark leather | Brass, sage verified marks |
| Plans | `.plans-page-container` | Cork | Mustard, brick |
| Circles | `.circles-page-wrapper` | Forest felt | Ivory, copper, brass |
| Pulse | `.pulse-page-wrapper` | Terracotta paper | Cream, brick, brass |
| Radar | `.radar-page-container` | Teal enamel | Brass, sand cards |
| Chat | `.chat-layout-wrapper` | Cream paper | Olive, tan, copper |
| Profile / Edit | `.profile-page-container` | Parchment | Brass, brick |
| Directory | `.directory-page-container` | Parchment, brass spine | Brass |
| Notifications | `.notifications-page-container` | Parchment, terracotta spine | Terracotta, brass |
| Settings | `.settings-page-container` | Parchment, olive spine | Olive, brass |
| Admin | `.admin-page-container` | Gunmetal + steel | Safety orange, steel, brass |
| Onboarding | `.onboarding-page-container` | Parchment sheet | Brass, brick, forest |
| 404 / Error | `.not-found-card` / `.error-boundary-card` | Parchment | Brass, brick |

Dark modules (`.discover-page-container`, `.connections-page-container`,
`.circles-page-wrapper`, `.radar-page-container`, `.admin-page-container`) remap
`--text-primary`, `--text-secondary`, `--text-muted`, `--primary`, and semantic
accents to their dark-surface equivalents. Light cards nested inside those
modules reset back to ink tokens so contrast stays AA.

---

## 7. Motion and interaction

| Interaction | Behaviour |
| --- | --- |
| Button hover | Lift 2px, slight counter-rotation, deeper edge |
| Button press | Drop 1px, inset shadow, no hover lift |
| Card hover | Lift/straighten; photo mounts settle toward 0° |
| Link hover | Ink underline thickens and darkens |
| Toggle | Knob snaps with spring easing |
| Modal | Backdrop fades; sheet scales from 94% with spring |
| Drawer | Unfurls downward |
| Toast | Slides in from right with a 1° tilt |
| Match | Ticket stamps in; seal and photo mounts land separately |
| Page enter | `fadeUp` over 350ms |

Guidelines:

- Keep interactive transitions in the **150–350ms** band.
- Animate `transform`, `opacity`, `box-shadow`, and colour — not layout properties.
- Never animate more than one large surface at a time.
- All motion is disabled or reduced under `prefers-reduced-motion: reduce`,
  including hover lifts.

---

## 8. Accessibility

- **Contrast:** body ink on parchment is 12.9:1; secondary ink 8.5:1;
  muted ink 5.5:1; primary brown 5.9:1; gold ink 5.2:1; brick 4.9:1.
  Dark-board cream is 13.7:1; muted cream 5.7:1; brass on leather 6.2:1.
- **Focus:** global `:focus-visible` uses a 3px mustard outline with 3px offset.
  Dark boards switch to a brighter brass outline (`#f1c477`).
- **Targets:** controls are at least 26–38px tall; primary actions 38–46px.
- **Labels:** every input has a visible label or accessible name; icon-only
  buttons keep `aria-label`/`title` from the existing JSX.
- **Keyboard:** drawers, modals, toasts, and menus remain keyboard operable;
  no hover-only information.
- **Motion:** `prefers-reduced-motion` shortens all animation to 0.01ms and
  removes hover transforms.
- **Colour meaning:** status is always paired with text or a Lucide icon, never
  colour alone.

### Contrast guardrails

- Bright brass (`--brass-light`, `#d7ad6a`) is for **dark boards only**.
  On parchment use `--accent-amber` / `--primary` / `--brass-dark` instead.
- On Radar sand cards, use the darker contextual overrides
  (`#8d4f2c` copper, `#8f3226` brick).
- On Admin steel panels, use `#6f4f12` gold and `#8f3226` brick; the dark
  stat-card variants use the brighter dark-surface tokens.
- On terracotta and forest boards, use cream/ivory type; brass alone is not
  sufficient for small text.

---

## 9. Iconography and content

- **Icons:** Lucide React only. Keep existing icon imports and sizes.
- **Emoji:** not used as UI decoration. Exceptions that are **data, not display**:
  - emoji-prefixed option IDs in `LOOKING_FOR_OPTIONS` / `EditProfilePage`
    (persisted values — never change them);
  - the `🎲 [` message-format parser in `ChatPage`;
  - `newInterestEmoji` in `AdminPage` (API form data);
  - the internal emoji→Lucide lookup map in `EmptyState`.
- **Copy:** warm, direct, student-facing. No hype, no “AI magic”, no neon slang.
- **Numbers:** use mono or tabular figures for counts, percentages, and timestamps.
- **Handwriting:** Caveat only for short sticky-note asides, never instructions.

---

## 10. Forbidden patterns

Do **not** introduce:

- neon, glow-cyan, electric blue, purple, violet, indigo, magenta, fuchsia;
- blue-purple “AI” gradients;
- glassmorphism, frosted panels, `backdrop-filter`, translucent blur;
- dark cyber / terminal styling, grid-line sci-fi backgrounds;
- pure black `#000` or pure white `#fff` as large surfaces;
- emoji as decorative UI;
- external image URLs or placeholder services (Unsplash, Pexels, etc.);
- a second light source (bottom highlights, top shadows);
- new heavy UI libraries, CSS frameworks, or icon packs;
- page-specific colours that bypass the token system.

`--bg-glass` exists only as an opaque legacy alias and must not be used to
reintroduce transparency.

---

## 11. Responsive behaviour

Breakpoints are defined in `base.css` and the bottom of `pages.css`:

- **≤ 1100px** — nav links condense; multi-column boards reduce to two columns.
- **≤ 900px** — Chat becomes a single column; sidebars stack; Circles grids wrap.
- **≤ 720px** — page boards lose outer padding; headers stack; tables scroll.
- **≤ 640px** — mobile drawer navigation; single-column cards; full-width actions.
- **≤ 440px** — tighter viewport padding and smaller icon buttons.

Rules:

- Boards keep their material and edge treatment at every size.
- Horizontal chip rows scroll rather than wrap into many lines.
- Never shrink body text below 0.82rem; use layout changes instead.
- Touch targets stay at least 38px on mobile.

---

## 12. Adding or changing UI

1. **Reuse first.** Check `components.css` for an existing control.
2. **Pick the material.** Choose the module board and the card material.
3. **Use tokens.** If a role is missing, add a token to `tokens.css`.
4. **Keep the light source.** Top-left highlight, bottom-right shadow.
5. **Scope overrides.** Prefix page-specific rules with the page wrapper.
6. **Preserve behaviour.** Do not rename routes, fields, socket events, API
   payloads, or state values.
7. **Check contrast.** Bright metal on paper is usually a failure.
8. **Check reduced motion.** Any new transform needs a reduced-motion fallback.
9. **Build.**

```powershell
cd frontend
npm run build
```

Expected: successful Vite build; the only warning is the existing chunk-size
warning for the main JS bundle.

### Review checklist

- [ ] Routes and links unchanged.
- [ ] API calls, payloads, and response handling unchanged.
- [ ] Socket event names and handlers unchanged.
- [ ] Form field names and persisted option IDs unchanged.
- [ ] No forbidden colours, glass, or external images.
- [ ] Lucide icons only; no decorative emoji.
- [ ] Focus visible on paper and on dark boards.
- [ ] Text contrast ≥ 4.5:1 for body, ≥ 3:1 for large text.
- [ ] Hover, active, disabled, loading, empty, and error states styled.
- [ ] Mobile layout checked at 375px, 768px, and 1280px.
- [ ] `prefers-reduced-motion` respected.
- [ ] `npm run build` passes.

---

## 13. Verification commands

```powershell
# forbidden visual techniques
Select-String -Path frontend/src/styles/*.css -Pattern 'backdrop-filter|blur\('

# forbidden colour families / external images
Select-String -Path frontend/src -Include *.jsx,*.css -Pattern 'unsplash|pexels|placehold|violet|indigo|purple|fuchsia|neon'

# build
cd frontend; npm run build
```

The design system is intentionally boring to extend: choose a material, use the
tokens, keep the light coming from the top-left, and let the content be the
loudest thing on the desk.
