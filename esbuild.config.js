// esbuild.config.js - Enhanced minification
const esbuild = require('esbuild');
const fs = require('fs');

async function build() {
  try {
    console.log('🏗️  Building browser bundles with esbuild...');

    // Ensure dist directory exists
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist');
    }

    // Development build (unminified)
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

    // Production build (heavily minified)
    await esbuild.build({
      entryPoints: ['src/browser.ts'],
      bundle: true,
      outfile: 'dist/tracker.min.js',
      format: 'iife',
      target: 'es2018',
      minify: true,              // Enable minification
      sourcemap: false,
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      drop: ['console', 'debugger'],  // Remove console.log and debugger
      keepNames: false,               // Allow name mangling
      treeShaking: true,             // Remove unused code
      legalComments: 'none',         // Remove comments
      mangleProps: /^_/,             // Mangle private properties starting with _
      
      // Advanced minification options
      minifyWhitespace: true,
      minifyIdentifiers: true,
      minifySyntax: true,
    });

    console.log('✅ Browser builds complete!');

    // Show detailed file sizes
    const devSize = fs.statSync('dist/tracker.js').size;
    const prodSize = fs.statSync('dist/tracker.min.js').size;
    const compressionRatio = ((devSize - prodSize) / devSize * 100).toFixed(1);
    
    console.log(`📊 Development: ${(devSize / 1024).toFixed(1)}KB`);
    console.log(`📊 Production: ${(prodSize / 1024).toFixed(1)}KB`);
    console.log(`📊 Compression: ${compressionRatio}% smaller`);
    console.log(`📊 Estimated gzipped: ~${(prodSize * 0.25 / 1024).toFixed(1)}KB`);

    // Check if we're under 2KB target
    const gzipEstimate = prodSize * 0.25;
    if (gzipEstimate < 2048) {
      console.log('🎉 Under 2KB gzipped target!');
    } else {
      console.log(`⚠️  Over 2KB gzipped target by ${((gzipEstimate - 2048) / 1024).toFixed(1)}KB`);
    }

    // Show comparison with competitors
    console.log('\n📈 Size comparison:');
    console.log(`   MRRFlow: ~${(gzipEstimate / 1024).toFixed(1)}KB gzipped`);
    console.log('   Google Analytics: ~45KB gzipped');
    console.log('   Plausible: ~1.4KB gzipped');
    console.log('   Mixpanel: ~25KB gzipped');

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();