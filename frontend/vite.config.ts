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
    // Configure HMR with explicit settings
    hmr: {
      clientPort: 5173,
      port: 5173,
      protocol: 'ws',
      host: 'localhost',
      overlay: false, // Disable the error overlay
    },
    // Enable CORS for direct API requests
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:8000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
    // Prevent port conflicts
    strictPort: false,
    // Listen on all addresses
    host: true,
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
