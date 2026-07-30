import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://llewellyn.vdm.io",
  output: "static",
  trailingSlash: "always",
  build: {
    assets: "_assets",
  },
  vite: {
    build: {
      cssMinify: "lightningcss",
    },
  },
});
