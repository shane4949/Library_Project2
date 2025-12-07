import path from "path" // 👈 Add this line
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: { // 👈 Add this section
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})