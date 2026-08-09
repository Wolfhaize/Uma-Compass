# Deploying Uma Compass to Cloudflare Pages

This is a static Vite + React app — no backend, no environment variables needed.

## 1. Push to GitHub
```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## 2. Connect Cloudflare Pages
1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Select this repo
3. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
4. Deploy

SPA routing (e.g. `/tournaments/5` resolving on refresh) is handled by `wrangler.jsonc`'s `not_found_handling: single-page-application` setting — don't add a `public/_redirects` file alongside it, the two conflict and Cloudflare will reject the deploy with a redirect-loop error.

## Local check before pushing (optional)
```
npm install
npm run build
npm run preview
```
