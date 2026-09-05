# Image-to-ASCII roadmap

Planning for the `/image-to-ascii/` subsite. Once implementation begins, the
shipped page is the source of truth for current behavior.

## Product direction

Build a client-side creative tool for casual users making profile or post art.
Artists are a secondary audience if rendering quality earns their trust.

The product is one continuum rather than three separate tools:

- Low complexity produces simple, recognizable, reusable text.
- Higher complexity produces attractive ASCII artwork.
- Live controls eventually let users explore the space between them.

Strict printable ASCII is the text format. Color is an optional visual layer;
Unicode blocks and Braille are outside the product boundary.

## First publishable release

Ship a narrow monochrome tonal converter with no controls.

### Flow and interface

- Lead with a file picker; convert immediately after selection.
- Show the source and live result side by side, stacked responsively on mobile.
- Before upload, show a portrait example with a **Try example** action.
- After conversion, keep **Choose another image** visible.
- Show filename, pixel dimensions, and file size compactly.
- State beside the uploader that processing is local and nothing is uploaded.
- Show a brief processing state, then recover from invalid or excessive inputs
  with an inline error and an immediately usable uploader.

### Renderer

- Decode raster formats supported by the browser.
- Preserve the full image and its aspect ratio; never stretch or crop it.
- Produce 80 columns by default. Correct rows for the chosen font's character
  aspect ratio and cap extreme output dimensions without changing composition.
- Composite transparency onto white.
- Convert pixels to standard luminance, apply gentle percentile-based contrast
  normalization, and average luminance within each character cell.
- Render dark characters on white with no launch-time inversion.
- Start from all 95 printable ASCII characters. Measure and density-sort them in
  the fixed font, then use an internal density threshold to remove redundant or
  visually noisy options. Tune this experimentally; do not expose it yet.
- Vendor one classic monospace font and its license. Test candidates and choose
  by tonal-rendering quality rather than reputation.
- Scale the preview font down on narrow screens so the complete 80-column image
  remains visible.

### Output

- Display real text, not a raster approximation.
- Download clean `.txt` containing characters only.
- Reset all state on reload.

### Launch quality gate

Test at minimum one portrait, one recognizable object or illustration, and one
landscape. Each output must preserve the subject, proportions, and major tonal
regions. Also test an unreadable file and an extreme aspect ratio through a
local HTTP server.

Add the subsite to the hub only when this bar is met. Use search-oriented title,
description, and page copy centered on "image to ASCII art converter."

## Next increments

Prefer one independently useful improvement per release:

1. Add drag-and-drop input, including replacement by dropping onto the active
   workspace.
2. Export the tightly bounded ASCII result as a high-resolution PNG.
3. Add a simple low-to-high detail slider; keep exact column counts hidden.
4. Add clipboard image paste.
5. Add inversion.
6. Add brightness and contrast controls.
7. Add an eight-color palette based on standard ANSI colors. Map source hue to
   the nearest palette color while character density continues to represent
   brightness.

## Later directions

### Rendering quality

- Add structural glyph matching: choose a character by the shape within a cell,
  not density alone.
- Then compare dithering and edge emphasis experimentally.
- Add artistic rendering presets only after their output is meaningfully
  distinct.
- Add source-derived full color after limited palettes work well.
- Add horizontal and vertical character-overlap controls for visual exports
  only. Overlap cannot be represented faithfully in plain text.

### Controls and formats

- Add named character maps, then custom maps.
- Add font presets after the fixed launch font.
- Add named output-size presets, then custom width, then square, rectangular,
  and circular shapes.
- Add interactive cropping while preserving full-image conversion as default.
- Extend export in this order: PNG, rich HTML, SVG, then a copy button.
- Treat text mode and visual-export mode separately: text remains valid ASCII;
  visual mode may use color, fonts, and overlap.
- Consider persistence and shareable settings only after the editor has enough
  state to justify them. Never persist the user's image unexpectedly.

## Parked

- Animated GIF and video-to-ASCII conversion.
- Real-time visual construction of the render as an experience, not merely a
  loading indicator.
- Camera and image-URL input.
- Server processing, uploads, accounts, paid APIs, and analytics requiring a
  backend.

## Open implementation questions

- Which vendorable classic monospace font yields the best density separation?
- What density threshold removes redundant glyphs without flattening gradients?
- What percentile normalization values work across the launch benchmark?
- What output-dimension and decoded-image limits are safe on mobile browsers?
- Which generated portrait best demonstrates the renderer without flattering it
  unrealistically?
