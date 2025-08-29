import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig(({ mode }) => ({
  define: {
    __VERSION__: JSON.stringify(pkg.version)
  },
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
      },
      plugins: [
        {
          name: 'copy-to-api',
          writeBundle() {
            const targetDir = '../api/data'
            
            try {
              mkdirSync(targetDir, { recursive: true })
              
              // Copy specific files
              const filesToCopy = [
                'index.js',
                'index.min.js', 
                'index.iife.js',
              ]

              if (mode === 'development') {
                filesToCopy.push('index.js.map', 'index.min.js.map', 'index.iife.js.map')
              }
              
              filesToCopy.forEach(file => {
                const srcPath = `dist/${file}`
                let fileName = file.replace('index', 'analytics')
                const destPath = `${targetDir}/${fileName}`
                
                if (existsSync(srcPath)) {
                  copyFileSync(srcPath, destPath)
                  console.log(`✅ Copied ${fileName}`)
                }
              })
              
              console.log('🎉 All tracker files copied to API!')
            } catch (error) {
              console.error('❌ Failed to copy files:', error.message)
            }
          }
        }
      ]
    },
    sourcemap: mode === 'development'
  }
}))