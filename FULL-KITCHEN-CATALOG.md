# Complete RIMI 2024 kitchen catalog

The 18 entries in the modern catalog contents and 8 in the classic catalog contents are represented by 26 cards. This is 25 model families plus the separately listed Miami variant with curved fronts. Repeated finishes and photo angles do not create duplicate cards.

The original ten cards, images and anchor IDs are retained verbatim. Sixteen missing entries are added in source table-of-contents order. All dropdown values track actual card indices used by the existing filter script. Counts are 26 total, 18 modern and 8 classic.

New image provenance, native image dimensions, PDF pages, embedded image xrefs and responsive asset paths are recorded in `RIMI-CATALOG-SOURCES.json`. Sources are the two user-supplied RIMI 2024 catalogs. No generated images or invented product specifications are used. Short descriptions summarize the source text and the photographed model.

Every added photo has 640, 960 and 1280 px WebP versions, a responsive `sizes` attribute, native lazy loading and async decoding. Photo dimensions reserve space. All images contain only the source photograph, without PDF page text or page numbers. Filtering, the dropdown, main navigation and the existing homepage gallery keep their original behavior.

Validation: `node --test tests/*.test.cjs`; fixture checks compare the full source contents against all 26 card IDs and collection assignments, verify dropdown order and counts, and exercise both collection filtering and selecting every card. Image decoding is checked separately with Pillow. Published page, assets and browser rendering are checked after deployment.
