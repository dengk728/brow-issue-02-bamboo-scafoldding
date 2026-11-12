# Issue 02 — second map mockup

Run `node server.cjs` in this folder, then open http://127.0.0.1:4174.
Requires Node.js; no install or build step. Use the server rather than opening index.html directly.

The background/scaffold and content use the new map resource exports at their original 9585.61 × 13247.62 coordinates. Popups are intentionally deferred.

All 28 live SVG text blocks and 8 additional blocks transcribed from outlined glyphs are now native HTML in assets/text.html. Body text uses Avenir 10pt / 11pt leading; a local Avenir or licensed webfont is needed for exact typography. Illustrator letter fragments and empty word-space spans have been consolidated. The image-only artwork.svg contains no text. All 15 external image links have been restored from the supplied image resource folder, preserving their original transforms and dimensions. Together with the four embedded images, all 19 exported images are present. image-manifest.json records the source mapping.

## Navigation

- Scroll vertically within a section. When the camera center passes the bottom boundary, it animates to the next section's top. Scroll above the top to return to the previous section.
- Hold and drag to pan inside the current box, including touch. Dragging does not change sections.
- Arrows / Page Up / Page Down, Home / End and the controls navigate sections.
- Explore map (or M) opens the overview. Select an invisible section hit area or use the chapter navigation to enter it; Escape returns.
- Reduced motion is respected. Transition gestures are locked while travelling to prevent trackpad momentum skipping sections.

## Layout source and assumptions

`pages.js` contains independently configurable x, y, w, h for every section. All 12 sections exactly match the corrected placeholder SVG, in exported reading order. Width and height vary independently, including chapter title boxes and tall content sections. Section titles are navigation labels inferred from nearby content, not changes to the original editorial artwork.

The overview box overlays are navigation controls only; placeholder labels are hidden in reading mode. assets/placeholders.svg is retained as the coordinate reference.


Reading scale matches version 1: min(1, viewport width × .85 / 480). Section navigation translates the camera without changing scale. The optional overview alone zooms out.



Section arrival aligns the box top at 96 CSS pixels from the screen top (82 on narrow screens), with horizontal centering and fixed reading scale. Explore map shows no placeholder outlines, fills, or number labels. All 1,211 editorial glyph paths were removed from the artwork. Original source photographs and diagrams remain images, including any lettering printed inside those source images.

