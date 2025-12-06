import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, type Plugin } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom plugin to fix unprocessed environment variable placeholders in HTML
function fixAnalyticsEndpoint(): Plugin {
  return {
    name: "fix-analytics-endpoint",
    transformIndexHtml(html) {
      const analyticsEndpoint = process.env.VITE_ANALYTICS_ENDPOINT || "";
      
      // If analytics endpoint is not set, remove analytics script tags
      if (!analyticsEndpoint) {
        // Remove script tags that reference the analytics endpoint
        html = html.replace(
          /<script[^>]*%VITE_ANALYTICS_ENDPOINT%[^>]*>[\s\S]*?<\/script>/gi,
          ""
        );
        // Also remove any script tags with src containing the placeholder
        html = html.replace(
          /<script[^>]*src=["'][^"']*%VITE_ANALYTICS_ENDPOINT%[^"']*["'][^>]*><\/script>/gi,
          ""
        );
      }
      
      // Replace any remaining placeholders with actual value
      return html.replace(/%VITE_ANALYTICS_ENDPOINT%/g, analyticsEndpoint);
    },
  };
}

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  fixAnalyticsEndpoint(),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(__dirname),
  root: path.resolve(__dirname, "client"),
  publicDir: path.resolve(__dirname, "client", "public"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
