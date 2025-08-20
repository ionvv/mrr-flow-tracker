// esbuild.watch.js - Real-time development with watch mode
const esbuild = require('esbuild');
const fs = require('fs');

async function watch() {
  console.log('👀 Starting watch mode for real-time development...');
  console.log('📁 Output: dist/tracker.js (updates on file changes)');
  console.log('🚀 Press Ctrl+C to stop\n');

  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  // Create development build context with watch
  const ctx = await esbuild.context({
    entryPoints: ['src/browser.ts'],
    bundle: true,
    outfile: 'dist/tracker.js',
    format: 'iife',
    target: 'es2018',
    sourcemap: true,
    define: {
      'process.env.NODE_ENV': '"development"'
    },
    // Watch-specific options
    logLevel: 'info',
    plugins: [
      {
        name: 'rebuild-notify',
        setup(build) {
          build.onEnd(result => {
            if (result.errors.length === 0) {
              const now = new Date().toLocaleTimeString();
              const size = fs.statSync('dist/tracker.js').size;
              console.log(`✅ [${now}] Built successfully - ${(size / 1024).toFixed(1)}KB`);
            } else {
              console.log(`❌ [${new Date().toLocaleTimeString()}] Build failed`);
            }
          });
        },
      },
    ],
  });

  // Start watching
  await ctx.watch();

  // Keep process alive
  process.on('SIGINT', async () => {
    console.log('\n👋 Stopping watch mode...');
    await ctx.dispose();
    process.exit(0);
  });
}

watch().catch(err => {
  console.error('❌ Watch failed:', err);
  process.exit(1);
});