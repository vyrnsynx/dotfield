// @ts-check
import { defineConfig } from "astro/config";
import { site } from "./src/data/site.ts";

export default defineConfig({
  site: site.metadata.origin,
  output: "static",
  compressHTML: true,
  trailingSlash: "always",
  build: {
    inlineStylesheets: "auto",
  },
  image: {
    layout: "constrained",
    responsiveStyles: true,
    objectFit: "contain",
    breakpoints: [640, 960, 1280],
    service: {
      entrypoint: "./src/image-service.mjs",
      config: {
        limitInputPixels: false,
        png: {
          compressionLevel: 9,
          effort: 10,
          palette: false,
          adaptiveFiltering: true,
        },
        jpeg: {
          quality: 92,
          mozjpeg: true,
          chromaSubsampling: "4:4:4",
        },
        webp: {
          quality: 90,
          effort: 6,
          smartSubsample: true,
        },
      },
    },
  },
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      theme: "github-light",
      wrap: false,
    },
  },
});
