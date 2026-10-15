import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The browser talks only to http://localhost:5174.
// Every request that starts with /api is forwarded to Spring Boot on 8080,
// so the login cookie stays on ONE address (no CORS problems).
const backend = {
  "/api": {
    target: "http://localhost:8080",
    changeOrigin: true
  }
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true, proxy: backend },
  preview: { port: 5174, strictPort: true, proxy: backend }
});
