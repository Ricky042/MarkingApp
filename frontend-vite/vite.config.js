import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path' // We still need this for the alias
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
    plugins: [
        react(), 
        tailwindcss(),
        viteStaticCopy({
            targets: [
                {
                    // --- THE SIMPLE, DIRECT PATH ---
                    // This tells the plugin to start from the project root.
                    src: './node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
                    dest: ''
                }
            ]
        })
    ],
    // Let's go back to the __dirname version that you said worked for your alias
    resolve: { 
        alias: { 
            "@": path.resolve(__dirname, "./src"), 
        } 
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ""),
        },
      },
    },
})