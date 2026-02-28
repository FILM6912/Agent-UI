import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  // Langflow server URL - change this to match your Langflow instance
  const langflowTarget = env.LANGFLOW_URL || 'http://192.168.99.1:7860';

  return {
    server: {
      port: 5173,
      host: "0.0.0.0",
      watch: {
        ignored: ["**/server/**"],
      },
      proxy: {
        // '/api/files': {
        //   target: 'http://127.0.0.1:8000',
        //   changeOrigin: true,
        //   secure: false,
        //   configure: (proxy, _options) => {
        //     proxy.on('error', (err, _req, _res) => {
        //       console.log('proxy error', err);
        //     });
        //     proxy.on('proxyReq', (proxyReq, req, _res) => {
        //       console.log('Sending Request to the Target:', req.method, req.url);
        //     });
        //     proxy.on('proxyRes', (proxyRes, req, _res) => {
        //       console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
        //     });
        //   },
        // },
        // // Langflow iframe reverse proxy - serves the main HTML page
        '/__langflow__': {
          target: langflowTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/__langflow__/, '') || '/',
        },
        // Langflow API - used by Langflow's own frontend JS inside the iframe
        '/api/v1': {
          target: langflowTarget,
          changeOrigin: true,
          secure: false,
        },
        // Langflow API v2 (MCP servers, etc.)
        '/api/v2': {
          target: langflowTarget,
          changeOrigin: true,
          secure: false,
        },
        // Langflow built assets (JS/CSS bundles) - safe in dev mode as
        // Vite serves our app's assets via its module system, not /assets/
        '/assets': {
          target: langflowTarget,
          changeOrigin: true,
          secure: false,
        },
        // Langflow health check - needed for iframe connectivity check
        '/health_check': {
          target: langflowTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base: "./", // Important for Electron
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
