# Enquiries and kitchen model pages

## Visitor flow

Every meaningful content section on the 12 existing routes has a context-aware
contact action. Existing navigation actions remain available. Decorative banners
and purely informational notes do not gain duplicate buttons.

A shared native dialog collects name, phone, topic, optional notes and messenger.
It opens with the model/section preselected and keeps a draft in page memory.
The next step previews the exact message. WhatsApp opens the studio contact with
encoded text. Telegram offers copy-text and open-chat actions separately. If the
clipboard API is unavailable, the text stays selected for manual copying.

The visitor must send the message in their messenger. The site does not claim
that an enquiry was delivered or a visit confirmed. No server handler, form
service, database or persistent personal-data storage is added. Tests never send
an actual message to the studio.

The floating contact control stays at the lower right and offers project enquiry,
showroom appointment, direct WhatsApp/Telegram and phone. The existing theme
control moves to the lower left to avoid overlap. Main header/drawer stay intact.

## Kitchen details

All 26 catalog cards link to static `kitchen-<slug>.html` pages, which work without
JavaScript. Existing `kitchens.html#model-<slug>` targets remain valid. The five
homepage gallery model links also open the new details pages. Catalog filters,
selector, photographs and all 15 interactive gallery markers remain unchanged.

Descriptions/features are paraphrased from the supplied RIMI 2024 modern and
classic catalogs. `KITCHEN-MODELS.json` records each source PDF page, printed
spread pages, photograph and approved model name. No prices or availability
claims are fabricated. The cost/project/appointment actions carry the model
name into the enquiry form and prepared message.

## Maintaining the component

Shared styling: `assets/contact-tools.css`. Interaction and message assembly:
`assets/contact-tools.js`. Embedded markup source: `components/contact-tools.html`.
Run `python scripts/sync-contact-component.py` after changing this template.
The template is embedded in all 38 HTML pages so no extra HTML fetch is needed.
Bump the CSS/JS query version in HTML after future asset edits to avoid stale
browser caches. Buttons reuse the existing `ml-button` stylesheet.

Model page layout: `assets/kitchen-model.css`. Edit model text in its static page
and keep `KITCHEN-MODELS.json` provenance in sync. The image retains its aspect
ratio at full width; only the current model image loads on a details page.

## Checks

- `node --check assets/contact-tools.js`
- `node --check assets/premium-motion.js`
- `node --test tests/*.test.cjs` (51 tests)
- HTML/asset/anchor audit: 1,812 local references, none missing.
- Existing header/drawer compare: unchanged on all 12 existing routes.
- Image decode audit: all referenced images decode.
- Existing GitHub Pages staging copies all 38 root HTML pages and assets;
  no workflow, DNS, domain or routing configuration changes are required.

Native dialog supplies focus trapping, background inertness and Escape handling.
The controller restores focus/scroll on close, accepts a complete outside gesture
for backdrop dismissal, and closes transient UI on pagehide. The tray supports
Escape/outside click and exposes its expanded state. Mobile fields use 16px text,
a single-column layout, safe-area spacing and constrained scrolling. Reduced
motion adds no animation. Unsupported dialog/disabled JavaScript keep native
links to Contacts, where the existing messenger/phone links remain available.
