# Tomer's Playground

Static site: one hub page plus a folder per subsite. No build step, no framework,
no backend — every tool runs client-side, so hosting is free and permanent.

## Layout

```
index.html          hub page — add a card here for each new subsite
assets/style.css    shared shell (colors, cards, panels, dark mode)
qr/                 subsite: file & text → QR code
  index.html
  vendor/qrcode.js  qrcode-generator (MIT), vendored so there are no CDN deps
.nojekyll           tells GitHub Pages to serve the files as-is
```

## Adding a subsite

1. `mkdir <name>` and write `<name>/index.html`.
2. Link `../assets/style.css` and copy the `.crumb` / `header.site` / `footer.site`
   block from `qr/index.html`.
3. Add a card to the grid in `index.html`.
4. Commit and push — GitHub Pages redeploys on its own.

## Local preview

```
npx serve .
```

## Renaming the site

The name appears in `index.html` (`<title>`, `<h1>`), each subsite's `.crumb`
link text, and this file. It is a find-and-replace, not a refactor.
