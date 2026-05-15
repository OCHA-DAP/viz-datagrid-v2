# HDX Data Grid

A data availability visualization for the [Humanitarian Data Exchange (HDX)](https://data.humdata.org) platform. Displays the completeness of core humanitarian datasets across locations with a Humanitarian Response Plan, organized by category and sub-category.

## Stack

- **D3.js v7** — data loading and grouping
- **Vanilla JS (ES modules)** — no bundler required
- **Sass** — compiled to CSS
- **HDX Design System** — color tokens, typography (Merriweather + Roboto), spacing

## Data source

Data is pulled from Google Sheets CSV exports at runtime. Three sheets are used:

- Main data (categories, sub-categories, dates)
- Dataset counts per location
- Global aggregated counts

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Builds the project, starts a local server at `http://localhost:3000`, and watches for SCSS and HTML changes.

## Build

```bash
npm run build
```

Compiles SCSS, copies HTML, JS, and assets into `dist/`.

## Deploy

```bash
npm run deploy
```

Builds and publishes the `dist/` folder to the `gh-pages` branch. Ensure the repository's GitHub Pages setting is pointed at the `gh-pages` branch.

## Project structure

```
src/
  index.html
  js/
    main.js           # data loading, rendering, UI setup
    charts/
      globalBar.js    # overview bar chart
      countryBar.js   # per-country bar chart
  scss/
    styles.scss       # main stylesheet
    _variables.scss   # HDX color, type, spacing tokens (SCSS)
    _tokens.scss      # HDX CSS custom properties (:root)
    _fonts.scss       # Humanitarian Icons font
    _grid.scss        # container and country card grid
  assets/
    flags/            # country flag images (ISO3 filenames)
    fonts/            # Humanitarian Icons v02 font files
    icons/            # HDX SVG icons
dist/                 # compiled output (git-ignored)
```
