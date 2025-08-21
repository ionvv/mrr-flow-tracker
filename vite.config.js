import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/browser.ts'),
      name: 'MRRFlowTracker',
      fileName: (format) => {
        if (format === 'es') return 'index.js'
        if (format === 'umd') return 'index.min.js'
        if (format === 'iife') return 'index.iife.js'
        return `index.${format}.js`
      },
      formats: ['es', 'umd', 'iife']
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    },
    sourcemap: true
  }
})