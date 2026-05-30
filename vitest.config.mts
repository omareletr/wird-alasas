import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  css: {
    postcss: {},
  },
  test: {
    environment: "jsdom",
    css: false,
  },
});
