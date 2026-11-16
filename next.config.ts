import type { NextConfig } from "next";

// configure-pages sets PAGES_BASE_PATH (for example "/elisa-advent").
// Omit it when unset or empty so basePath is never "".
const pagesBasePath = process.env.PAGES_BASE_PATH;

const nextConfig: NextConfig = {
  output: "export",
  ...(pagesBasePath ? { basePath: pagesBasePath } : {}),
  experimental: {
    agentFeedback: true,
  },
  // "PPR cannot be enabled in export mode" — cacheComponents turns PPR on.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
