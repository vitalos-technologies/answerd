import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // This project lives inside the prototype repo; pin the root so Next doesn't pick the parent lockfile
  turbopack: {
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  outputFileTracingRoot: path.join(__dirname),
  // Store links are read in client components too, so inline them at build time
  env: {
    APP_STORE_URL: process.env.APP_STORE_URL ?? "",
    PLAY_STORE_URL: process.env.PLAY_STORE_URL ?? "",
  },
}

export default nextConfig
