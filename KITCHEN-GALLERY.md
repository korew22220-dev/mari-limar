# Approved kitchen gallery integration

Branch: `feature/kitchen-gallery`. Do not merge or run the production Pages workflow without approval.

## Scope

Only the static gallery inside `#kitchens.ml-kitchen-selection` on `index.html` is replaced. The existing heading, section order, navigation, video, other homepage sections and all catalog pages remain unchanged. `kitchens.html` already has filters and additional collections; this integration does not duplicate the homepage carousel there. The gallery initializer supports scoped instances if reuse is later requested.

The source is the supplied `MARI_LIMAR_kitchens_positions_from_screenshots(2).html`. All fifteen marker coordinates and full descriptions are copied verbatim into static HTML. The five original repository WebP images are each 1492 × 842. The frame retains that exact ratio and shows the complete image without scale animation or cropping, so percentage coordinates keep their original meaning. The demo's image zoom was omitted because it would move photographed details underneath fixed markers. No photo reveal mask is added.

## Files

- `index.html`: server-readable gallery content, fixed marker coordinates and asset includes.
- `assets/kitchen-gallery.css`: isolated `kg-` styles adapted from the approved demo; same fonts, palette, thin lines, circular controls and shared model-link buttons. On small screens the card appears beneath the photo for readable text and unobstructed points.
- `assets/kitchen-gallery.js`: dependency-free progressive enhancement, native horizontal scroll and scroll snap, 4700 ms autoplay, arrows/swipes, keyboard arrows, all card close paths, Escape and independent pause reasons. No coordinate editor, export UI or persisted coordinate overrides.
- `tests/kitchen-gallery.test.cjs`: coordinate/asset/link assertions and deterministic event/timer boundary tests.

Images, model links and native scrolling remain available if JavaScript fails. Interactive controls appear only after initialization. Autoplay is disabled for reduced motion, offscreen/hidden pages, hover, card interaction, keyboard focus, touch/scroll gestures or explicit Pause. Closing a card does not cancel other pause reasons. The public Pages workflow triggers only on `main`, which is unchanged.

## Validation

Run `node --test tests/*.test.cjs` (16 tests including existing premium-motion tests). Separate source comparison verified every marker title, full description and percentage against the attachment. All five model anchors and image files exist. The homepage outside this component and its asset includes is byte-identical to the base revision.

These are source and deterministic event/timer checks, not a browser rendering or physical touch-device test. Managed browser preview was unavailable in this environment. Before approving production, inspect the private preview at desktop, tablet and phone widths, swipe all five models, open all 15 points, select card text, test each close method, hover/leave, background the tab, leave/reenter the viewport, and enable reduced motion. Confirm the page has no horizontal overflow.

## Preview and publishing

The supplied private preview link is a separate test Site. Open `/#kitchens` to jump to the component. It does not change GitHub Pages. The GitHub branch contains the production-ready source changes for review; merging and production deployment require separate approval.
