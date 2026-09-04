# AGENTS.md

Conventions for this repo. Read before editing anything.

## What this is

A static site: one hub page plus a folder per subsite. Free-forever hosting on
GitHub Pages, so the constraints below are load-bearing, not stylistic.

## Hard rules

- **No build step.** No bundler, no framework, no npm install to view the site.
  Open an `index.html` and it works.
- **No backend, no API keys.** Every tool runs client-side. Nothing is uploaded.
  If an idea needs a server or a paid API, it does not belong here as-is.
- **No CDN dependencies.** Third-party libraries get vendored into
  `<subsite>/vendor/` with their license intact. A dead CDN must never be able to
  break a page.
- **Vanilla everything.** Plain HTML, CSS and ES5-compatible JS in an IIFE.
- **Ship it, then improve it.** A live narrow tool beats an unpublished broad one.

## Layout

```
index.html          hub — one card per subsite
assets/style.css    shared shell: tokens, cards, panels, dark mode
<subsite>/
  index.html        self-contained page
  vendor/           vendored third-party libs, if any
.nojekyll           GitHub Pages serves files as-is
```

## Planning

- For QR features or limits, read `qr/docs/roadmap.md`.
- QR brainstorming starts in
  `C:\D\Obsidian\First Vault\Notes\File-to-QR-Code-Conversion.md`; move settled
  decisions into the roadmap so the repo remains authoritative.

## Adding a subsite

1. `mkdir <name>`, write `<name>/index.html`.
2. Link `../assets/style.css`. Copy the `.crumb`, `header.site` and
   `footer.site` blocks from `qr/index.html` so the shell stays consistent.
3. Page-specific CSS goes in a `<style>` block on that page — do not grow
   `assets/style.css` for one page's needs.
4. Add a card to the grid in `index.html` (and delete the matching `.soon`
   placeholder if there is one).
5. Commit. Pages redeploys on its own.

## Styling

Use the CSS custom properties in `assets/style.css` (`--ink`, `--bg`, `--panel`,
`--line`, `--accent`, `--muted`). Never hard-code a color that has a token —
dark mode is driven entirely by those tokens under
`@media (prefers-color-scheme: dark)`.

The one deliberate exception: QR output stays pure `#000` on `#fff` regardless of
theme, because scanners need the contrast.

## SEO

Each subsite needs a `<title>` and `<meta name="description">` written for the
search query a real person would type. These pages earn their traffic from
search; the copy is the product.

## Honesty in the UI

State real limits in the interface rather than failing mysteriously. The QR page
shows a live byte counter against the true capacity and explains the ~2 KB
ceiling instead of silently truncating. Hold new tools to that bar.

## Testing

No test framework. Before committing a change to a subsite, serve the repo and
exercise the page in a browser — the happy path plus at least one boundary or
error case. `file://` will not work; use a local server.

## Commits

Imperative subject line, body explaining why. Do not commit `node_modules`,
build output, or agent scratch files.
