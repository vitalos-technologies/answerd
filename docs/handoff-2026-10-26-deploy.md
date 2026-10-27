# Handoff: deploy to vitalos.co.uk (26 Oct 2026)

Tracking issue: https://github.com/vitalos-technologies/answerd-prototype/issues/1

## Update, 27 Oct 2026: deploys now go through GitHub Actions

`.github/workflows/deploy.yml` is now the normal way to deploy. The steps below are the fallback.
- **After CI passes on `main`:** it deploys whichever app changed since the last successful deploy. An app deploys only if its own CI job passed; a held-back app fails the run, and the next green run deploys it.
- **By hand:** Actions → Deploy → Run workflow, then pick `both`, `prototype` or `website`.
- **Each job:**
  1. checks that the Cloudflare credentials exist, without printing them;
  2. runs `pnpm install --frozen-lockfile`;
  3. runs the app's own `pnpm deploy:cf:prod`. The prototype's version sets `NEXT_PUBLIC_SITE_URL=https://answerd.vitalos.co.uk`.
- **Overlap:** each app has its own concurrency group (`deploy-prototype`, `deploy-website`), and a running deploy is never cancelled.

| Name | Kind | Purpose |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | secret | Workers edit rights, with the vitalos.co.uk zone under Zone Resources |
| `CLOUDFLARE_ACCOUNT_ID` | variable **or** secret | The account that owns vitalos.co.uk. The workflow reads `vars` first, then `secrets` |
| `ANSWERD_API_URL_PROTOTYPE` | variable, optional | Turns API mode on for the production prototype. Leave unset (mock mode); never staging |
| `ANSWERD_API_URL_SITE` | variable, optional | The same for the production website (unset means the static fallback data) |
| `GITHUB_TOKEN` | built in | Reads `@vitalos-technologies/answerd-client` from GitHub Packages once it's a dependency |

Manual deploys from a session or a laptop (`pnpm deploy:cf:prod`, below) still work and deploy the same build.

## Goal

Move both projects off temporary `workers.dev` addresses onto the vitalos.co.uk zone (DNS is on Cloudflare):

| Project | Folder | Worker name | Target | Command |
| --- | --- | --- | --- | --- |
| Website | `marketing-site/` | `answerd-site` | https://answerd.vitalos.co.uk | `cd marketing-site && pnpm deploy:cf:prod` |
| Prototype | repo root | `answerd-prototype` | https://answerd-demo.vitalos.co.uk | `pnpm deploy:cf:prod` |

The prototype is on a one-level subdomain (`answerd-demo`) because the free Universal SSL certificate doesn't cover deeper names. Deploy the website first: the prototype redirects its old web URLs to it.

## State

- `main` is clean and pushed. All 165 spec IDs are built, and the prototype's 270 Playwright tests pass (`pnpm build && pnpm test:e2e`).
- The website (`marketing-site/`) is the only Answerd website, app first. The prototype has no website pages: `/` opens `/hub`. Old web URLs redirect to `SITE_URL` (`lib/site.ts`, `next.config.ts`), and the hub marks W-01 to W-12 and W-20 to W-27 "On the website".
- `pnpm deploy:cf:prod` in the root sets `NEXT_PUBLIC_SITE_URL=https://answerd.vitalos.co.uk` at build time. Other builds fall back to the temporary website address.
- Production configs:
  - `wrangler.production.jsonc`: `routes: [{ pattern: "answerd-demo.vitalos.co.uk", custom_domain: true }]`
  - `marketing-site/wrangler.production.jsonc`: the same for `answerd.vitalos.co.uk`
- Temporary deploys (they predate this handoff and stop working unless the user claimed them):
  - Website: https://answerd-site.descriptive-santanaraptor.workers.dev
  - Prototype: https://answerd-prototype.hickory-cub.workers.dev

## Credentials

- The user moved `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from the setup script to the environment's Environment variables.
- Check that they're set without printing values:
  `for v in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID; do [ -n "${!v}" ] && echo "$v set" || echo "$v missing"; done`
- Then check the account with `npx wrangler whoami`.
- If either is missing, stop and tell the user. The variables must be under Environment variables (or Network secrets), not the setup script, and the session must be new.
- Never print, log, commit or post a key. The repo is public, so keep keys out of issue #1 too.
- Don't use `wrangler deploy --temporary` for this. It ignores the account and can't use custom domains.

## Steps

1. Run `pnpm install` in the repo root and in `marketing-site/`.
2. Website: `cd marketing-site && pnpm deploy:cf:prod`.
3. Prototype: `pnpm deploy:cf:prod` in the root.
4. If `opennextjs-cloudflare deploy` doesn't pass `--config` through, run `npx wrangler deploy --config wrangler.production.jsonc` after the build, in the same folder.
5. Verify in a real browser (Playwright; Chromium is preinstalled). A plain `curl` may get a Cloudflare challenge.
   - Website: `/`, `/plumbers/croydon`, `/b/swift-plumbing-heating` (with the Continue in the app dialog), `/claim`, `/billing`.
   - Prototype:
     - `/` redirects to `/hub`;
     - `/b/swift-plumbing-heating` redirects to `https://answerd.vitalos.co.uk/b/swift-plumbing-heating`;
     - `/admin/super` works as persona Temitope A. (Super admin): on `/hub`, pick the persona, then Admin;
     - optionally, run journeys J9 and J10 against the live URL: `BASE_URL=https://answerd-demo.vitalos.co.uk npx playwright test j9 j10`.
6. Update issue #1:
   - tick the done boxes by editing the body with `gh api -X PATCH repos/vitalos-technologies/answerd-prototype/issues/1 -F body=@file`;
   - add a short comment with the two live links.
   GraphQL isn't available here; use REST through `gh api`.
7. Give the user both links.

## Likely problems

| Symptom | Cause and fix |
| --- | --- |
| Authentication error, or the route or custom domain is refused | The token needs the "Edit Cloudflare Workers" template with the **vitalos.co.uk** zone under Zone Resources, in the account that owns the zone. The user fixes this in Cloudflare; don't work around it. |
| "Hostname already has externally managed DNS records" | A DNS record for `answerd` or `answerd-demo` already exists. Ask the user before deleting anything in DNS. |
| Old styles after a code change | Run `rm -rf .next .open-next` and rebuild. |
| Wrangler picks a temporary account | Delete `~/.config/.wrangler/wrangler-temporary-account.toml`. It won't exist in a fresh container. |

## Still to do before public launch (website)

- `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` for the `/b/[slug]` universal links
- App Store and Google Play URLs and badge artwork
- Final legal text
