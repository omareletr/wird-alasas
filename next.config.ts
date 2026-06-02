import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

const nextConfig: NextConfig = {
  // Do NOT set `output: "export"` — @netlify/plugin-nextjs deploys the full
  // server build (needed for API routes, SSR, and Supabase server auth).
  ...(isCapacitorBuild
    ? {
        output: "export",
        images: {
          unoptimized: true,
        },
      }
    : {}),
};

export default withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production" || isCapacitorBuild,
})(nextConfig);
