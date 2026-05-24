import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 2223,
    host: "0.0.0.0",
    strictPort: false,
    hmr: { clientPort: 443 },
        allowedHosts: true,
  },
});
