# TexasHoldem Ops Workflow

## Branch Flow
1. Work on `feat/*` branch.
2. Open PR to `main`.
3. Merge only after local playtest + quick sanity check.

## Deploy Flow (Cloudflare static assets)
1. Keep static assets under `src/`.
2. `wrangler.jsonc` must keep:
   - `assets.directory = "./src"`
3. Cloudflare project should run deploy from this repo/branch.
4. After merge, confirm latest deployment points to same commit SHA.

## Rollback
1. In Cloudflare dashboard, open project deployments.
2. Promote previous successful deployment.
3. Re-open issue, patch on new `feat/*` branch, redeploy.

## Safety Checklist Per Release
- No secrets in source/commit history.
- `_headers` exists and CSP/frame protections are active.
- Controls and keyboard shortcuts still work in current browser.
- Next hand/replay/skin switch all function after deployment.
