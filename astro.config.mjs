// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://verdite.org",
  trailingSlash: "ignore",
  build: { format: "directory" },
});
