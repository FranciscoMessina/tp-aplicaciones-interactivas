# Design

TechStore's public site is styled as a **hardware datasheet**: the shop is a component catalog, each product is a part with a part number, each category is a row in an ordering table, and the home hero is the top view of a 24-pin DIP chip. The admin panel and its auth pages are described at the end.

## Tokens (`frontend/src/index.css`)

| Token | Value | Role |
| --- | --- | --- |
| `--paper` | `#f3f4f1` | Page ground |
| `--sheet` | `#fbfbf9` | Framed surfaces (sheet, table, cards, form) |
| `--ink` | `#101317` | Text, 1px rules, 3px heading bars, the closing band |
| `--muted` | `#565c66` | Secondary text, field labels (≥5.5:1 on paper) |
| `--rule` | `#c7cac9` | Inner hairlines between rows/cells |
| `--marker` | `#d9f24a` | The only colour: highlighter behind active nav, price, primary action, hover sweeps |
| `--ok` / `--bad` | `#0f7a49` / `#b8342a` | Stock status |
| `--display` | Archivo Variable (self-hosted, `wdth` axis) | All text |
| `--mono` | Martian Mono Variable (self-hosted) | Data only: part numbers, prices, counts, rulers, coordinates |

## Type

- Titles: Archivo, weight 850, `font-stretch: 72–75%`, tight leading (0.92–0.98), tracking −0.01 to −0.02em. Card names use 85% width and weight 800.
- Body: Archivo at 100% width, weight 400–600. Labels are 12–13px, weight 700, in `--muted`.
- Mono is never decoration. Use it only for values a visitor reads as data.

## Structure

- Square corners everywhere. Elevation comes from rules, never from shadows.
- Sections open with a 3px `--ink` bar above the heading (`.information-heading`, `.information-bottom-cta`). The home's product section is the exception: `.section-heading` is a solid ink band attached to the top of the grid, like a table header, so the title doesn't fight the circuit background. The band uses paper text, `#a9aeb5` for the subtitle, and a marker link.
- Grids share hairlines: the container draws the top/left rule and each cell draws its right/bottom rule (`.products-grid`, `.catalog-filters`, `.business-detail-grid`, `.product-detail`).
- Figures carry crop marks on two opposite corners (`.product-image::before/::after`).
- Home: the hero is a DIP-24 package seen from above, in black epoxy (`--ink` ground, paper text), with tin-coloured pin legs (`#b9bec4`) along the top (24–13) and bottom (1–12) edges, numbered inside the outline, plus the notch on the left edge and the pin-1 dimple. The last words of the h1 ("se enchufa.") are set in `--marker`. A 72px gap (48px on mobile) separates it from the ordering table (`.order-table`), whose last row, "Todo el catálogo", is the primary action and is filled with the highlighter.
- Ink grounds are used for the home chip, the home's product-section header (`.section-heading`) and one closing band per page (`.contact-section` on the home page, `.contact-aside` on contact). On ink, the marker becomes the focus and link colour.

## Background

`body` carries a 320px tile of printed-circuit traces (45° bends ending in vias) in `#d6d9d6` on `--paper` (SVG data URI in `index.css`). On four of the traces a short highlighter pulse travels in about 2.5s and then rests, on 14–22s cycles with staggered starts, so a signal passes only now and then. With `prefers-reduced-motion` the pulses are removed. Sheets, tables, cards and the header stay solid on top.

## Motion

- One grammar: a left-to-right highlighter sweep (`background-size` transition, `cubic-bezier(0.16, 1, 0.3, 1)`) on nav links, ordering rows, card titles and the primary button (which sweeps ink over marker).
- Signature: a probe. Moving the mouse over the chip lights up, with the highlighter, the nearest pin and the pin opposite it (mouse only).
- `prefers-reduced-motion` turns off every transition, the pin transition and the loading pulse.

## Browser surfaces

`::selection` uses the marker, the scrollbar and caret use ink, and focus is a 2px ink outline (marker on ink grounds).

## Admin panel (`frontend/src/Admin.css`)

The panel is the same brand in a tool's tone: same tokens and fonts, but no circuit background, no condensed display titles and no highlighter sweeps.

- Shell: a fixed 248px `--ink` sidebar (sections grouped as Catálogo, Atención and Comercio, with the account, "Ver sitio" and "Cerrar sesión" at the bottom) and the content on `--paper`, max 1200px. Below 900px the sidebar becomes a top bar with a menu button.
- The highlighter marks only the active section and what needs attention: the pending-enquiries count in the nav, the "Pendiente" status and the pending figure on the summary.
- Surfaces are `--sheet` panels with a 1px `--rule` border and `#e1e3df` inner hairlines. Square corners, no shadows except on the dialog and the toast.
- Titles are Archivo 28px, weight 800, 85% width. Controls are 38px tall. Primary buttons are ink with paper text; secondary buttons are white with a `--rule` border.
- Mono is used only for prices, stock and summary figures.
- Enquiries form an inbox: a list with a status filter and the detail beside it (on mobile, separate screens).
- Action results show as a floating ink toast in the bottom-right corner, so the content never shifts.
- Auth pages (login, registro, recuperar and restablecer contraseña) sit outside the public layout as the entrance to the panel. On the left is a 400px ink column with the brand, what the panel manages and "Volver a la tienda". On the right is the form on paper, max 400px, using the panel's fields and buttons. Below 900px the column shrinks to a top bar.
