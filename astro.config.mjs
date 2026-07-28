import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://llewellynvdm.github.io",
  base: "/profile",
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
