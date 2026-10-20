---
version: 1
slug: "frontend-src-pages-homepage-tsx"
primary_target: "frontend/src/pages/HomePage.tsx"
related_targets: ["frontend/src/pages/CatalogPage.tsx","frontend/src/pages/ProductDetailPage.tsx","frontend/src/pages/BusinessInfoPage.tsx","frontend/src/pages/ContactPage.tsx"]
---

## Scope

Public site of TechStore (home, catálogo, detalle de producto, nosotros, contacto, header/footer). Mode: Persuade on home, Operate on catálogo/detalle/contacto. Admin and auth pages keep their own styling. All Spanish copy preserved verbatim; only data-derived labels may be added.

## Direction contract

THESIS: The shop as a component datasheet. Each product is a part with a part number, each category is a row in an ordering table, the home hero is the top view of a DIP-24 chip. It refuses the dark gaming hero over a bento of tiles.

OWN-WORLD: Paper ground #F3F4F1, ink #101317. Rules are 1px hairlines, with 3px bars at the head of each sheet. One colour only: a chartreuse highlighter #D9F24A behind prices, the primary action and hover. Archivo at 75% width and heavy weight for titles, 100% width for text. Martian Mono only for data: part numbers, prices, counts, coordinates. Square corners, hairline tables, crop marks around figures.

STORY: The visitor reads what the shop sells, scans the ordering table (count and lowest price per category), opens a part, sends an enquiry.

FIRST VIEWPORT: Home has a full-width DIP-24 package: pin legs on the top and bottom edges, the notch on the left, the pin-1 dot. The condensed heavy h1 sits top-left at about 116px, with the subcopy below it. The part marking sits bottom-right (TECHSTORE, product count, category count). The bottom pins land on the ordering table, whose last row, "Todo el catálogo", is marked in highlighter and is the primary action. Revised 2026-10-19: the user rejected the drawing-sheet ruler, zones and title block as reading architectural rather than technological.

FORM: pinned by the user ("Hardware spec-sheet"), not rolled. seed: none (unavailable). Signature interaction: a pin probe; the pointer lights up the nearest pin pair and shows a PIN readout. Motion grammar: a highlighter sweep from left to right on row and button hover.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
