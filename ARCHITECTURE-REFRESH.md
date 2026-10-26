# Architecture and design refresh, 2026-10-26

Only `architecture-design.html` and its new page-scoped stylesheet are changed.
The header, drawer, existing enquiry dialog, floating contact component and all
shared scripts remain byte-for-byte unchanged. No dependencies, hosting settings,
DNS, routes, other pages or existing assets are changed.

## Layout

- Editorial split hero: a real Moscow facade photograph beside the existing title
  and description; one primary enquiry action plus a quiet approach anchor.
- One consistent content width (up to 1320px), 72px desktop / 44px mobile section
  spacing, with compact architecture/interior directions.
- Existing introduction and three principles are combined into one grid.
- Gallery fills both columns: one wide living-room frame and two smaller images,
  with distinct photos and accurate captions. Original duplicate stock photos are
  no longer referenced by this page.
- Main-content enquiry actions reduced from seven to three, with the same form
  context attributes; the final section has one primary button and a text link to
  Kitchens. Footer reserves clearance for fixed contact/theme controls.
- The original before/after images, pointer/keyboard comparison controls and
  relevant IDs are preserved. All previous section anchor URLs still resolve.

## Images

Four Pexels photographs, downloaded from their official free-download links.
Source IDs/authors/license URLs and generated image dimensions are recorded in
`ARCHITECTURE-IMAGE-SOURCES.json`. The facade is by Sasha Tonik, listed by the
source as Moscow, Russia. Three contemporary interior photographs are by Max
Vakhtbovych. No claim is made that the interiors are in Russia or that any of these
references are MARI LIMAR projects. Visible reference labels and source credits
are retained on the page. No AI image generation or semantic photo editing is used.

Files are served locally as WebP at multiple widths with actual `srcset` width
values and layout-appropriate `sizes`. Explicit dimensions and aspect ratios
reserve media space. Only the hero image loads eagerly; gallery images stay lazy.
Original photos are resized/compressed without stretching or adding objects.

## Verification

Compared the header, drawer, shared form and floating contact markup against the
current original. Confirmed exactly three main enquiry triggers and all seven
existing section anchors. New image variants decode with dimensions matching the
HTML descriptors. Existing JavaScript is unchanged and passes syntax checks.
The existing GitHub Pages workflow copies the new assets without modification.

Browser review and final deployment availability are checked separately after
publishing. Physical iOS/Android testing is not available in this environment.
