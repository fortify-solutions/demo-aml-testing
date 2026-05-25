# Design System — AML / Fortify Combined App

A portable spec for re-skinning another app to match this one. Source of truth is `target/aml-ui/src/theme.js`; this document is a faithful extraction plus the unwritten rules followed by the existing pages.

> **Stack assumed:** MUI v7 + React. The theme uses MUI's custom `app` namespace (`theme.app.*`) for all non-MUI-native tokens. If porting to a non-MUI stack, treat the tokens below as CSS variables.

---

## 1. Design philosophy

1. **Quiet, dense, business SaaS.** Calm surfaces, generous whitespace inside panels, tight rhythm between rows. No marketing flourish.
2. **Semantic colour only.** Green / amber / red / blue / purple carry meaning (status, sentiment, family). Never decorative — never pick a colour because it "looks nice".
3. **Two typefaces, two roles.** Sans-serif (`IBM Plex Sans`) for prose, UI labels, buttons, headers. Mono (`IBM Plex Mono`) for *every number, identifier, rule ID, code snippet, table cell that contains data*. Tabular nums always on.
4. **Flat, not skeuomorphic.** `boxShadow: none` on Paper and Buttons by default; structure comes from 1px subtle borders (`#eaecf0`) and background-tone shifts, not drop shadows. The only allowed shadow is on dialogs/menus (`shadow.md`).
5. **Square-ish corners.** 4px base radius. Paper gets +2, dialogs +4. Pills/badges use 4 or pill-shape (999) only where MUI does so by default.
6. **No italics, ever.** Emphasis is done by weight (500/600) and colour, not slant.
7. **Desktop-first, no mobile.** Don't add responsive breakpoints you don't need.
8. **Density tier.** Target row heights ~32–40px. Buttons `md` = 32px tall. Sliders and tab strips compact (tab `minHeight: 36–40`).

---

## 2. Color tokens

All hex values are literal — these are the brand colours, not placeholders.

### Brand palette (MUI roles)

| Role | 50 | lighter | light | main | dark | contrastText |
|---|---|---|---|---|---|---|
| **primary** (forest) | `#ecf5f3` | `#e7f3f0` | `#355f5a` | `#183936` | `#102c2a` | `#ffffff` |
| **secondary** (sage) | — | `#f1f7f6` | `#d9eeea` | `#6fa79b` | `#3f6b64` | `#173530` |
| **success** | `#eef8f2` | `#eef8f2` | `#b7ddc0` | `#2f7d55` | `#20543b` | `#ffffff` |
| **warning** | `#fff7e7` | `#fff7e7` | `#f1d39a` | `#c58a17` | `#83580f` | `#ffffff` |
| **error**   | `#fdf0ef` | `#fdf0ef` | `#edb2ae` | `#c65a55` | `#8b3330` | `#ffffff` |
| **info**    | `#eef5fb` | `#eef5fb` | `#c5d6ea` | `#4d739e` | `#2e4966` | `#ffffff` |

Primary is a *deep forest teal*, not navy — the CLAUDE.md "navy blue" line is stale.

### Neutrals

```
grey.50  #fafbf9    text.primary   #101828
grey.100 #f6f7f4    text.secondary #475467
grey.200 #ecefe8    text.disabled  #98a2b3
grey.300 #dfe4db    divider        #eaecf0
grey.400 #c4ccc1
grey.500 #98a2b3    background.default #f5f5f6  (page)
grey.600 #667085    background.paper   #ffffff
grey.700 #475467
grey.800 #344054
grey.900 #101828
```

### Status pills / family tags (`theme.app.status.*`)

| | bg | fg | border |
|---|---|---|---|
| green  | `rgba(64,149,0,.08)` | `#233f0f` | `#1b4a02` |
| yellow | `#fff7e7` | `#9c6a13` | `#f1d39a` |
| red    | `#fdf0ef` | `#b54745` | `#efb3af` |
| blue   | `#eef5fb` | `#375c84` | `#c5d6ea` |
| gray   | `#f6f7f7` | `#667085` | `#d0d5dd` |
| purple | `#f4f0ff` | `#6941c6` | `#d9c7ff` |

Use these for typology/family/severity chips — never raw `palette.error.main` etc. on backgrounds, the contrast is wrong.

### Surface / border / nav (`theme.app.*`)

```
surface.page          #f5f5f6    border.subtle  #eaecf0
surface.panel         #ffffff    border.strong  #d0d5dd
surface.muted         #f8f9fb
surface.hover         #f8faf9    nav.bg         #ffffff
surface.hoverStrong   rgba(0,0,0,.03)   nav.text     #344054
surface.selected      #edf4f1    nav.icon       #667085
surface.elevated      #fcfdfb    nav.hoverBg    #f8faf9
                                 nav.activeBg   #e0f3f1
                                 nav.activeText #183936
                                 nav.border     #eaecf0
shadow.sm  none
shadow.md  0px 12px 32px rgba(16,24,40,0.12)
```

### Charts / analytics

Heatmap scale: `#ffffbf → #fee08b → #fdae61 → #fc8d59 → #d73027` (low → high).
Selected (DataGrid row, callout, etc.): `alpha('#00a99d', 0.08)`, hover `0.12`, border = `secondary.main`.

---

## 3. Typography

### Type families

```
body: 'IBM Plex Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
data: 'IBM Plex Mono', ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace
serif: 'Inria Serif' — loaded but reserved (no current usage)
```

Load from Google Fonts:
```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inria+Serif:wght@400&display=swap');
```

### Type scale (`theme.app.typography.*`)

| name | font-size | line-height | typical use |
|---|---|---|---|
| `xs` | 0.75rem (12px) | 18px | uppercase eyebrows, table headers, table-row caption |
| `sm` | 0.8125rem (13px) | 20px | secondary body, captions next to KPIs |
| `md` | 0.875rem (14px) | 20px | default body, controls, buttons |
| `lg` | 1.125rem (18px) | 28px | section titles, h6 |
| `xl` | 1.5rem (24px) | 32px | KPI values, page titles, h4 |

Body is **14px**, not the MUI default 16px. Pages feel compact.

### Named typography roles (`theme.app.typographyRoles.*`)

Always reach for these instead of hand-rolling weight+size+colour.

```
pageTitle      lg / 500 / -0.01em tracking / text.primary
sectionTitle   1rem / 600 / -0.01em / text.primary
cardTitle      md / 500 / text.primary
kpiLabel       sm / 500 / text.secondary
kpiValue       xl / 500 / -0.02em / text.primary
tableHeader    xs / 500 / text.secondary
controlLabel   md / 500 / text.primary
navLabel       md / 400 / grey.800
breadcrumb     md / 400 / text.secondary
breadcrumbCurrent md / 600 / text.primary
data           md / mono / tabular-nums / text.primary
dataSm         sm / mono / tabular-nums
dataXs         xs / mono / tabular-nums
```

### Uppercase "eyebrow" pattern

Above any KPI value, section, or column group:

```jsx
<Typography
  variant="caption"
  color="text.secondary"
  sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
>
  Rules adopted
</Typography>
```

Letter-spacing `0.08em` for eyebrows; `0.06em` for inline column labels in row cards.

---

## 4. Spacing, radii, density

- **MUI spacing unit = 8px.** Use `sx={{ p: 1.5 }}` = 12px, `p: 2` = 16px, `p: 3` = 24px. Anything more granular is a smell.
- **Page padding** = `px: 3, pt: 2, pb: 3` (24/16/24).
- **Paper interior** = `p: 2` typically; `p: 1.5` for dense row-cards; `p: 3` for landing cards.
- **Stack gaps** = `spacing={1}` between dense rows, `spacing={2}` between sections.
- **Radius:** base 4, Paper 6 (`+2`), Dialog 8 (`+4`), Menu 6. Pills: 4 or full-pill where MUI defaults to it. Slider/marks borderRadius: 999.
- **Borders:** always `1px solid theme.app.border.subtle` for separation. Use `border.strong` only for input hover/focus.

---

## 5. Components — house style

### Button (`components/ui/Button`)

Custom wrapper exposing 7 variants × 4 sizes:

- **variants:** `primary` (contained, primary.main), `secondary` (contained, neutral), `outline`, `text`, `danger`, `ghost`, `tab`
- **sizes:** `xs`, `sm`, `md` (default), `lg` — affects padding and icon size (`theme.app.iconSize`)
- `textTransform: 'none'`, `fontWeight: 500`, no shadow (`boxShadow: none`, including hover).
- Icons via `startIcon` / `endIcon`, always from **`lucide-react`** at `theme.app.iconSize.{size}` (12 / 14 / 16 / 18 / 20).

Rule: **never use a raw `<button>` or MUI `<Button>` directly** in new code — go through `components/ui/Button`.

### Paper

```js
borderRadius: 6,           // base 4 + 2
backgroundImage: 'none',   // disable MUI dark-mode tint
outlined: borderColor: app.border.subtle, boxShadow: 'none'
```

Pattern for a tonal card with a vertical accent stripe (used for Distill step rows):
```js
{
  p: 0,
  border: `1px solid theme.app.nav.border`,
  borderLeft: `4px solid ${tone.accent}`,
  borderRadius: 1.5,           // 12px (note: this is sx-spacing, not pixels — equivalent to 12px when borderRadius theme base is 4)
  opacity: adopted ? 1 : 0.55, // greyed-out state
}
```

### Inputs (`MuiOutlinedInput`)

- White background, 1px subtle border.
- Focus = `box-shadow: 0 0 0 3px alpha(primary, 0.12)` + 1px primary.light outline. **No blue Material default ring.**
- Default padding `12px Y` (`8px Y` for size=small).

### Tabs

- 2px primary indicator with `borderRadius: 999`.
- `minHeight: 40` (`36` allowed for compact analytics tabs).
- Non-selected = `text.secondary`, selected = `primary.dark`, no underline-on-hover.
- `textTransform: 'none'`.

### Toggle buttons

- Selected bg = `surface.muted`, text = `primary.dark`.
- Hover (when selected) = `surface.selected`.
- Group sits in a single border, internal toggles have `border: 0`.

### Tables / DataGrid

- **Header row:** sans, `xs` size, weight 500, `text.secondary`, `fontVariantNumeric: normal`.
- **Body cells:** **mono**, `tabular-nums`. This propagates to nested Typography / Chip / Link inside cells via `fontFamily: inherit`.
- Container = 1px subtle border, no shadow, white bg, radius 8 (`base + 4`).

### Dialog / Menu

- Radius 8 / 6.
- 1px subtle border + `shadow.md`. (Only place shadows are used.)
- MenuItem: `borderRadius: 2`, internal margin `0.25 / 0.75` for breathing room between items.

---

## 6. Iconography

- **Library:** `lucide-react` only. Pixel sizes from `theme.app.iconSize`:
  ```
  xxs 12   xs 14   sm 16   md 18   lg 20
  ```
- **Colours** from `theme.app.iconColor`: `default`, `muted`, `disabled`, `primary`, `secondary`, `success`, `warning`, `error`, `customColumn` (`warning.main` — used for user-customised column headers).
- Don't mix in Material Icons or emoji.

---

## 7. Page layout patterns

### Page header (`components/ui/PageHeaderShell`)

Every top-level screen wraps with:
```jsx
<PageHeaderShell
  title="Rule Distillation"
  actions={<Stack direction="row" spacing={1}>…</Stack>}
/>
```

Two layouts:
- `stacked` (default): title row + optional `navigation` (tab strip) row below.
- `split`: title left, page-mode nav (e.g. ToggleButtonGroup) right.

Title uses `pageTitle` typography role.

### Body shell

```jsx
<Box sx={{ height: '100%', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
  <PageHeaderShell … />
  <Box sx={{ px: 3, pt: 2, pb: 1.5 }}>{/* intro + KPI strip */}</Box>
  <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>{/* main content scrolls */}</Box>
</Box>
```

**Only the main content scrolls.** Header + KPI strip stay anchored. Use this for every full-page screen.

### KPI strip

Horizontal `<Stack direction="row" spacing={3}>` of `eyebrow / kpiValue` pairs, separated by vertical `<Divider orientation="vertical" flexItem />`. Numbers always in mono via the `kpiValue` role — tabular-nums means digits line up vertically.

### Callouts (`theme.app.analytics.callout.{success|warning|error|info}`)

Tonal banner pattern:
```js
{ bg: alpha(palette.X.main, 0.06), border: palette.X.light, title: palette.X.dark }
```

---

## 8. Charts / visualisations

- **Inline SVG sparklines** preferred over a chart library when the shape is simple (Distill's coverage curve is hand-rolled SVG).
- Curve stroke: `secondary.main` (`#6fa79b`), 1px; fill: same colour at 12% opacity.
- Reference markers (recommended / threshold): dashed `warning.dark` (`#c58a17`), 0.4 strokeWidth.
- Cursor / current-position: solid `primary.main` (`#183936`).
- For heatmaps use the 5-step yellow→red ramp from `theme.app.analytics.heatmap.scale`.

---

## 9. Voice rules (relevant to UI strings)

- No italics — emphasise with weight, colour, or layout.
- Sentence case for buttons and section titles ("Keep top 31 rules", not "Keep Top 31 Rules").
- UPPER CASE only for eyebrows and short tags ("CORE", "SURVIVOR", "+ INCIDENTS").
- Numbers: locale `en-GB` (`12,345`, not `12 345` or `12.345`).
- Percentages: 1 decimal place by default (`95.0%`); 0 dp for "vs full" comparisons (`72%`).
- "—" (em dash) for missing values, not `0` or `N/A`.

---

## 10. Porting checklist

To restyle another MUI app to this one:

1. **Replace `theme.js`** with the file at `target/aml-ui/src/theme.js`. The non-standard `app` namespace lives at `theme.app.*` — if the target app doesn't use it, either add it to module augmentation, or copy the tokens into the app's existing scheme.
2. **Add the fonts** — `@import` at the top of global CSS (see §3).
3. **Reskin globals** — body `font-family`, body bg, body text colour, `::selection` background.
4. **Switch icon library** to `lucide-react`. Find/replace common Material icons (Add → Plus, Delete → Trash, etc.).
5. **Strip default shadows** on Paper, Card, Button. Add 1px `border.subtle` instead.
6. **Wrap buttons** in (or port over) `components/ui/Button` so every CTA picks up the variant system + lucide icons + sizing.
7. **Eradicate italics** — search the codebase for `italic`, `fontStyle`, `<em>`, `<i>`. Replace with weight/colour change.
8. **Apply mono to data** — any cell that holds a number, ID, or hash should use the `data` / `dataSm` / `dataXs` role (or in tables, rely on the `MuiTableCell.body` override which sets `fontFamily: data` automatically).
9. **Page shells** — wrap every page in the `PageHeaderShell + scrolling Box` pattern from §7.
10. **Status / family chips** — use `theme.app.status.{green|yellow|red|blue|gray|purple}` tuples instead of one-off colours.

---

## 11. Quick reference — copy-paste theme skeleton

If you can only take one thing, take `target/aml-ui/src/theme.js` verbatim, plus the Google Fonts import. Everything else in this document follows from those two files + lucide-react + the 10-step checklist above.
