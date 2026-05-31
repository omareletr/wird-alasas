import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const nextConfig: NextConfig = {
  // Do NOT set `output: "export"` — @netlify/plugin-nextjs deploys the full
  // server build (needed for API routes, SSR, and Supabase server auth).
};

export default withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
})(nextConfig);
