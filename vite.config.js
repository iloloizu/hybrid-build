import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Builds to one self-contained dist/index.html, so the same file can still be
// published as a Claude artifact or opened straight from disk.
export default defineConfig({
  plugins: [viteSingleFile()],
  build: { target: "es2020" },
  test: { environment: "node" }
});
