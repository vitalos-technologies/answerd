// OpenNext config for Cloudflare Workers. The site is fully prerendered, so the
// incremental cache is read straight from the Worker's static assets (no R2 or KV needed).
import { defineCloudflareConfig } from "@opennextjs/cloudflare"
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache"

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
})
