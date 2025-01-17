import path from "path"
import react from "@vitejs/plugin-react"
import {defineConfig} from "vite"
import {NodeGlobalsPolyfillPlugin} from '@esbuild-plugins/node-globals-polyfill'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true
        })
      ]
    }
  },
  define: {
    global: "window",
  },
})
