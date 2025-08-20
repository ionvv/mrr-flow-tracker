const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  try {
    console.log('🏗️  Building browser bundles with esbuild...');

    // Ensure dist directory exists
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist');
    }

    // Development build
    await esbuild.build({
      entryPoints: ['src/browser.ts'],
      bundle: true,
      outfile: 'dist/tracker.js',
      format: 'iife',
      target: 'es2018',
      sourcemap: true,
      define: {
        'process.env.NODE_ENV': '"development"'
      }
    });

    // Production build (minified)
    await esbuild.build({
      entryPoints: ['src/browser.ts'],
      bundle: true,
      outfile: 'dist/tracker.min.js',
      format: 'iife',
      target: 'es2018',
      minify: true,
      sourcemap: false,
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      drop: ['console', 'debugger'],
      mangleProps: /^_/,
    });

    console.log('✅ Browser builds complete!');

    // Show file sizes
    const devSize = fs.statSync('dist/tracker.js').size;
    const prodSize = fs.statSync('dist/tracker.min.js').size;
    
    console.log(`📊 Development: ${(devSize / 1024).toFixed(1)}KB`);
    console.log(`📊 Production: ${(prodSize / 1024).toFixed(1)}KB`);
    console.log(`📊 Estimated gzipped: ~${(prodSize * 0.3 / 1024).toFixed(1)}KB`);

    // Check if we're under 2KB target
    const gzipEstimate = prodSize * 0.3;
    if (gzipEstimate < 2048) {
      console.log('🎉 Under 2KB gzipped target!');
    } else {
      console.log('⚠️  Over 2KB gzipped target');
    }

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();