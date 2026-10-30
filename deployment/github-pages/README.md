# GitHub Pages Deployment

This directory contains configuration, scripts, and documentation for deploying the CodeAtlas static frontend to GitHub Pages.

## Live Production Target
- **Live URL**: `https://koushik-2006.github.io/CodeAtlas-AI-Codebase-Intelligence-Platform/`
- **Output Directory**: `frontend/out`
- **Base Path**: `/CodeAtlas-AI-Codebase-Intelligence-Platform`

## Local Production Build

To test the GitHub Pages static export build locally:

```bash
cd frontend
npm run build:pages
```

This script:
1. Reads `process.env.GITHUB_REPOSITORY` or defaults to `koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform`.
2. Sets Next.js `output: 'export'` with `trailingSlash: true` and `images.unoptimized: true`.
3. Pre-renders all client pages while isolating backend API routes to prevent static bundling failures.
4. Generates `.nojekyll` to disable Jekyll processing on GitHub Pages.
5. Generates `404.html` fallback for client-side single-page app (SPA) routing.
6. Runs secret leak checks on the output directory.

## GitHub Actions Automated Pipeline

The deployment workflow is automated via `.github/workflows/deploy-pages.yml`.
When changes are pushed to `main`, GitHub Actions:
- Installs dependencies with `npm ci` inside `frontend/`.
- Executes linting and TypeScript checks.
- Runs core unit, security, and auth test suites.
- Generates the static export bundle.
- Deploys to GitHub Pages environment.

