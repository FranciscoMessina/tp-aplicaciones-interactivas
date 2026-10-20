# Design

TechStore's public site is styled as a **hardware datasheet**: the shop is a component catalog, each product is a part with a part number, each category is a row in an ordering table, and the home hero is the top view of a 24-pin DIP chip. The admin and auth pages keep their own styling and are not covered here.

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
- Sections open with a 3px `--ink` bar above the heading (`.section-heading`, `.information-heading`, `.information-bottom-cta`).
- Grids share hairlines: the container draws the top/left rule and each cell draws its right/bottom rule (`.products-grid`, `.catalog-filters`, `.business-detail-grid`, `.product-detail`).
- Figures carry crop marks on two opposite corners (`.product-image::before/::after`).
- Home: the hero is a DIP-24 package seen from above, in black epoxy (`--ink` ground, paper text), with tin-coloured pin legs (`#b9bec4`) along the top (24–13) and bottom (1–12) edges, numbered inside the outline, plus the notch on the left edge and the pin-1 dimple. The last words of the h1 ("se enchufa.") are set in `--marker`. A 72px gap (48px on mobile) separates it from the ordering table (`.order-table`), whose last row, "Todo el catálogo", is the primary action and is filled with the highlighter.
- Ink grounds are used for the home chip and one closing band per page (`.contact-section` on the home page, `.contact-aside` on contact). Inside it, the marker becomes the focus and link colour.

## Background

`body` carries a 320px tile of printed-circuit traces (45° bends ending in vias) in `#d6d9d6` on `--paper` (SVG data URI in `index.css`). On four of the traces a short highlighter pulse travels in about 2.5s and then rests, on 14–22s cycles with staggered starts, so a signal passes only now and then. With `prefers-reduced-motion` the pulses are removed. Sheets, tables, cards and the header stay solid on top.

## Motion

- One grammar: a left-to-right highlighter sweep (`background-size` transition, `cubic-bezier(0.16, 1, 0.3, 1)`) on nav links, ordering rows, card titles and the primary button (which sweeps ink over marker).
- Signature: a probe. Moving the mouse over the chip lights up, with the highlighter, the nearest pin and the pin opposite it (mouse only).
- `prefers-reduced-motion` turns off every transition, the pin transition and the loading pulse.

## Browser surfaces

`::selection` uses the marker, the scrollbar and caret use ink, and focus is a 2px ink outline (marker on ink grounds).
