import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/sci-fi-ui/" : "/",
  plugins: [react()],
}));
