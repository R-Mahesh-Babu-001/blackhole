import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    watch: {
      /*
        BlackHole contains Python files for the backend.

        Vite does not need to watch our Python virtual
        environment, and Windows may lock python.exe.
      */
      ignored: [
        "**/.venv/**",
        "**/__pycache__/**",
      ],
    },
  },
});