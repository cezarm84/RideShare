import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from 'path';
import dns from 'node:dns';

// Disable DNS address reordering for consistent localhost resolution
dns.setDefaultResultOrder('verbatim');

// https://vite.dev/config/
export default defineConfig({
  server: {
    // Completely disable HMR to avoid WebSocket issues
    hmr: false,
    // Enable CORS for direct API requests
    cors: true,
    // Prevent port conflicts
    strictPort: false,
  },
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
