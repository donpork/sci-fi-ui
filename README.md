# sci-fi-ui

Interactive sci-fi glass UI: WebGL cell shaders (p5/WebGL), a resizable grid overlay, and live glass/lighting controls.

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer (see `.nvmrc` if you use nvm)

## Setup

From the project root:

```bash
npm install
```

## Run (Node / npm scripts)

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload (default: http://localhost:5173/) |
| `npm start` | Same as `npm run dev` |
| `npm run build` | Typecheck and production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run unit tests (Vitest) |

Example:

```bash
npm run dev
```

Open the URL printed in the terminal (usually http://localhost:5173/).

## Production build

`npm run build` emits static files under `dist/` with base path `/sci-fi-ui/` for GitHub Pages–style hosting. Preview locally with:

```bash
npm run preview
```

## Stack

- React 19 + TypeScript
- Vite 8
- p5 (WebGL) for the shader canvas
- Vitest for grid/layout unit tests
