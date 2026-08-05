import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Vite serves the window's contents, so Tauri has to know where to find it:
// the port is fixed and `strictPort` makes a clash fail loudly rather than
// quietly move the app somewhere `devUrl` is not looking. Keep the port in
// step with `devUrl` in src-tauri/tauri.conf.json.
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", {}]],
      },
    }),
    tailwindcss(),
  ],
  // Rust errors are the interesting ones during a Tauri dev run; don't wipe
  // them off the terminal.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
})
