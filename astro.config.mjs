// @ts-check
import { defineConfig } from "astro/config";
import { site } from "./src/data/site.ts";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: site.metadata.origin,
  output: "static",
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
  compressHTML: true,
  trailingSlash: "always",
  build: {
    inlineStylesheets: "auto",
  },
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      theme: "github-light",
      wrap: false,
    },
  },
});
