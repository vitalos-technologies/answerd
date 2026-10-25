import type { NextConfig } from "next";
import { LEAF_CATEGORIES } from "./lib/categories";
import { SITE_PATHS, SITE_URL } from "./lib/site";

const categories = LEAF_CATEGORIES.map((c) => c.slug).join("|");

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // The website lives in marketing-site/; its URLs here go there. The prototype's own front door is the hub.
  async redirects() {
    return [
      { source: "/", destination: "/hub", permanent: false },
      ...SITE_PATHS.map(([source, path]) => ({ source, destination: SITE_URL + path, permanent: false })),
      { source: `/:category(${categories})`, destination: `${SITE_URL}/:category`, permanent: false },
      { source: `/:category(${categories})/:area`, destination: `${SITE_URL}/:category/:area`, permanent: false },
    ];
  },
};

export default nextConfig;
