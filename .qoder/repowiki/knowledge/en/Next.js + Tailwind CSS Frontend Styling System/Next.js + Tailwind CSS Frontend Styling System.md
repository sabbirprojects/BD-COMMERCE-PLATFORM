---
kind: frontend_style
name: Next.js + Tailwind CSS Frontend Styling System
category: frontend_style
scope:
    - '**'
source_files:
    - apps/web/tailwind.config.ts
    - apps/web/postcss.config.mjs
    - apps/web/src/app/globals.css
    - apps/web/src/app/layout.tsx
    - apps/web/src/app/page.tsx
    - apps/web/package.json
    - apps/web/next.config.mjs
---

## What system/approach is used

The frontend lives in `apps/web`, a Next.js 15 App Router application (React 19) styled with **Tailwind CSS 3.4** and the **Autoprefixer** PostCSS plugin. There is no component library, CSS-in-JS runtime, or design-token framework beyond Tailwind's built-in utilities and a small custom color extension. Icons come from `lucide-react`.

## Key files and packages

- `apps/web/package.json` — declares `next`, `react`, `react-dom`, `tailwindcss@3.4.17`, `autoprefixer`, `postcss`, and `lucide-react` as dependencies.
- `apps/web/tailwind.config.ts` — Tailwind configuration extending the default theme with a single custom palette.
- `apps/web/postcss.config.mjs` — PostCSS pipeline wiring `tailwindcss` then `autoprefixer`.
- `apps/web/src/app/globals.css` — Global stylesheet importing Tailwind layers and defining CSS custom properties for light/dark backgrounds.
- `apps/web/src/app/layout.tsx` — Root layout applying the global font stack and selection color.
- `apps/web/src/app/page.tsx` — Landing page demonstrating the styling conventions.
- `apps/web/next.config.mjs` — Minimal Next config enabling `reactStrictMode` and permissive remote image patterns.

## Architecture and conventions

### Tailwind content scanning
`tailwind.config.ts` scans three directories for class usage: `./src/pages/**/*.{js,ts,jsx,tsx,mdx}`, `./src/components/**/*.{...}`, and `./src/app/**/*.{...}`. This covers both legacy Pages Router and the current App Router structure.

### Design tokens
There is one custom token set under `theme.extend.colors.brand`, providing an emerald-based scale from `brand-50` (`#ecfdf5`) through `brand-900` (`#064e5b`). The landing page uses this via `bg-brand-500`, `text-emerald-500`, etc. No other custom colors, spacing scales, typography scales, or breakpoints are added — the defaults are used.

### CSS custom properties for theming
`globals.css` defines two CSS variables on `:root`:
- `--background`: `#f8fafc` (light), `#090d16` (dark)
- `--foreground`: `#0f172a` (light), `#f8fafc` (dark)

A `prefers-color-scheme: dark` media query swaps these values. The `body` rule applies `color: var(--foreground)` and `background: var(--background)`. Components use Tailwind's `dark:` variant (e.g., `dark:text-white`, `dark:border-slate-800`) rather than reading these variables directly.

### Typography
The body font stack is the OS-native cascade: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`. No custom fonts are loaded.

### Responsive strategy
Responsive styles use Tailwind's default breakpoint scale (`sm:`, `md:`, `lg:`, etc.) inline on components. Examples from `page.tsx` include `grid-cols-1 md:grid-cols-3`, `text-4xl md:text-5xl`, and `flex flex-col sm:flex-row`. No custom breakpoints are configured.

### Dark mode
Dark mode is applied via Tailwind's `dark:` utility classes throughout components (e.g., `dark:text-slate-400`, `dark:bg-slate-900/60`). It is not enabled via `mode: 'class'`; instead it follows the browser's `prefers-color-scheme` setting, which works because the root `<html>` has no explicit `class="dark"` but the CSS variable swap handles the base background/foreground.

### Iconography
Icons are imported from `lucide-react` and rendered as React components; no SVG sprites or icon font is used.

### Component organization
At this stage there is no dedicated `components/` directory with reusable UI primitives — the only page is `src/app/page.tsx`, which renders everything inline using Tailwind utility classes. The `pages/` and `components/` paths in `tailwind.config.ts` content globs are present for future growth but currently unused.

## Conventions and constraints

- **Utility-first styling**: All visual presentation is expressed as Tailwind utility classes directly on JSX elements; no BEM, CSS modules, or SCSS files exist in `apps/web`.
- **Brand colors go through the `brand-*` palette**: Custom brand hues are defined only in `tailwind.config.ts` under `colors.brand` and referenced via `brand-*` utilities.
- **Dark-mode variants**: Component styles that differ between light and dark modes use Tailwind's `dark:` prefix rather than separate CSS rules.
- **Base colors use semantic Tailwind palettes**: Slate (`slate-900`, `slate-600`, `slate-400`, `slate-200`, `slate-100`, `slate-500`) and emerald (`emerald-500`, `emerald-600`, `emerald-400`) are used consistently across the landing page.
- **No custom plugins**: `tailwind.config.ts` sets `plugins: []`; no third-party Tailwind plugins (e.g., forms, typography, aspect-ratio) are installed.
- **PostCSS chain is fixed**: `postcss.config.mjs` runs `tailwindcss` first, then `autoprefixer`; no other processors are registered.
- **Remote images allowed from any host**: `next.config.mjs` sets `images.remotePatterns` to allow all `https://` hosts — this is a security/performance policy decision reflected in the build config.