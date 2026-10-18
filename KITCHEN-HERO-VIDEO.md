# Kitchens hero: RIMI video

Only `kitchens.html` changes visually. Existing hero content, navigation, buttons,
all 26 catalog cards and filters remain intact. No new dependencies.

## Media

`assets/videos/kitchens-rimi-desktop.mp4`: original supplied horizontal H.264,
1280 × 720, 50 fps, 27.660 s, 6,049,366 bytes.
`assets/videos/kitchens-rimi-mobile.mp4`: original supplied vertical H.264,
540 × 960, 25 fps, 27.640 s, 1,459,874 bytes.
Both files are silent and already have the MP4 moov atom before mdat (fast start).
The supplied videos are copied byte for byte, without transcoding.
Posters are WebP frames at 4 seconds from the corresponding supplied videos.

The standalone controller chooses one source at <=767px / >767px. Crossing the
breakpoint loads the appropriate replacement and restores the current time.
It pauses offscreen, in hidden tabs and on pagehide; resumes on visibility and
pageshow. Reduced motion unloads the video and leaves the responsive poster.
With JavaScript disabled, loading errors or rejected autoplay, the poster stays
visible. Native muted/inline/loop playback has no controls. The shared video
controller excludes this component so it cannot race the responsive controller.

## Framing

Video and picture use cover and centered positioning. Existing hero dimensions
reserve height before media loads. A portrait tablet using the horizontal film
has a 640px hero to preserve the central brand introduction.

Calculated cover windows (these are geometry checks, not browser screenshots):

| Viewport | Hero height | Source | Visible source x | Visible source y |
|---|---:|---|---|---|
| 1920 × 1080 | 1015.2 | desktop | 0–1280 | 21.6–698.4 |
| 1440 × 900 | 846 | desktop | 27.2–1252.8 | 0–720 |
| 768 × 1024 | 640 | desktop | 208–1072 | 0–720 |
| 390 × 844 | 717.4 | mobile | 9.1–530.9 | 0–960 |
| 375 × 812 | 690.2 | mobile | 9.2–530.8 | 0–960 |

The centered opening RIMI mark remains within these windows. Cover necessarily
crops the outer edges where source and hero aspect ratios differ. The mobile
film's prepared blurred padding remains part of the original video.

## Validation and publishing

Run `node --check assets/kitchen-hero-video.js` and `node --test tests/*.test.cjs`.
36 tests pass, including 12 responsive hero tests and existing filter, gallery,
page transition and homepage video regressions. Both full videos decode through
FFmpeg with no reported errors. Kitchens HTML local URLs resolve.

The existing GitHub Pages workflow recursively copies assets, so no workflow,
domain, DNS or routing changes are needed. There is no separate application
bundle/build command for this static HTML project.

Real viewport screenshots, iOS Safari/Android Chrome autoplay and perceptual
smoothness have not been verified on physical devices in this environment.
Before final visual acceptance, open the published Kitchens page at the five
sizes above, watch the introduction and one full loop, rotate a phone, check the
menu/catalog link and enable reduced motion to inspect the static poster.
