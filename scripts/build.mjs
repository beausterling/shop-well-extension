#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const distDir = path.join(projectRoot, 'dist');

async function cleanDist() {
  try {
    await fs.rm(distDir, { recursive: true, force: true });
    console.log('✓ Cleaned dist directory');
  } catch (error) {
    // Directory might not exist, which is fine
  }
}

async function createDistDir() {
  await fs.mkdir(distDir, { recursive: true });
  console.log('✓ Created dist directory');
}

async function bundleContentScript() {
  console.log('📦 Bundling content script with esbuild...');

  try {
    await esbuild.build({
      entryPoints: [path.join(srcDir, 'content/content.js')],
      bundle: true,
      outfile: path.join(distDir, 'content/content.js'),
      format: 'iife', // Immediately Invoked Function Expression for content scripts
      target: 'chrome114', // Target Chrome 114+ for extension compatibility
      platform: 'browser',
      minify: false, // Keep readable for development
      sourcemap: false,
      logLevel: 'info'
    });

    console.log('✓ Content script bundled successfully');
  } catch (error) {
    console.error('✗ Content script bundling failed:', error);
    throw error;
  }
}

async function bundleBackgroundScript() {
  console.log('📦 Bundling background script with esbuild...');

  try {
    await esbuild.build({
      entryPoints: [path.join(srcDir, 'background.js')],
      bundle: true,
      outfile: path.join(distDir, 'background.js'),
      format: 'iife', // Immediately Invoked Function Expression for service workers
      target: 'chrome114', // Target Chrome 114+ for extension compatibility
      platform: 'browser',
      minify: false, // Keep readable for development
      sourcemap: false,
      logLevel: 'info'
    });

    console.log('✓ Background script bundled successfully');
  } catch (error) {
    console.error('✗ Background script bundling failed:', error);
    throw error;
  }
}

async function copyFiles(source, destination) {
  const entries = await fs.readdir(source, { withFileTypes: true });

  await fs.mkdir(destination, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyFiles(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function copyFilesSelectively() {
  console.log('📁 Copying extension files...');

  // Note: background.js is now bundled by bundleBackgroundScript(), not copied

  // Copy manifest
  await fs.copyFile(
    path.join(srcDir, 'manifest.json'),
    path.join(distDir, 'manifest.json')
  );

  // Copy side panel (entire directory)
  await copyFiles(
    path.join(srcDir, 'sidepanel'),
    path.join(distDir, 'sidepanel')
  );

  // Copy test panel (entire directory)
  await copyFiles(
    path.join(srcDir, 'test-panel'),
    path.join(distDir, 'test-panel')
  );

  // Copy options page
  await copyFiles(
    path.join(srcDir, 'options'),
    path.join(distDir, 'options')
  );

  // Copy welcome page
  await copyFiles(
    path.join(srcDir, 'welcome'),
    path.join(distDir, 'welcome')
  );

  // Copy content/ui (needed for design-tokens.css used by welcome page)
  await copyFiles(
    path.join(srcDir, 'content/ui'),
    path.join(distDir, 'content/ui')
  );

  console.log('✓ Extension files copied');
}

async function validateManifest() {
  const manifestPath = path.join(distDir, 'manifest.json');
  const manifestContent = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  // Basic validation
  if (manifest.manifest_version !== 3) {
    throw new Error('Invalid manifest version');
  }

  if (!manifest.permissions || !manifest.host_permissions) {
    throw new Error('Missing required permissions');
  }

  if (!manifest.side_panel) {
    throw new Error('Missing side_panel configuration');
  }

  console.log('✓ Manifest validation passed');
}

async function copyAssets() {
  // Copy assets folder from project root to dist
  const assetsDir = path.join(projectRoot, 'assets');
  const destAssetsDir = path.join(distDir, 'assets');

  try {
    await copyFiles(assetsDir, destAssetsDir);
    console.log('✓ Copied assets folder');
  } catch (error) {
    console.error('⚠️  Warning: Could not copy assets folder:', error.message);
  }
}

async function createIcon() {
  // Create a simple placeholder icon for development if icon doesn't exist
  const iconDir = path.join(distDir, 'assets');
  await fs.mkdir(iconDir, { recursive: true });

  // Check if icon already exists (from assets folder)
  const iconPath = path.join(iconDir, 'icon128.png');
  try {
    await fs.access(iconPath);
    // Icon exists, no need to create placeholder
  } catch {
    // Icon doesn't exist, create placeholder
    await fs.writeFile(iconPath, '# Placeholder icon file\n# Replace with actual 128x128 PNG icon');
    console.log('✓ Created placeholder icon');
  }
}

async function generatePackageInfo() {
  const manifest = JSON.parse(await fs.readFile(path.join(distDir, 'manifest.json'), 'utf8'));

  const packageInfo = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    buildTime: new Date().toISOString(),
    files: await getFileList(distDir),
    architecture: 'Side Panel (Chrome MV3)',
    aiAPIs: ['LanguageModel (Prompt API)', 'Summarizer API']
  };

  await fs.writeFile(
    path.join(distDir, 'package-info.json'),
    JSON.stringify(packageInfo, null, 2)
  );

  console.log('✓ Generated package info');
}

async function getFileList(dir, prefix = '') {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(prefix, entry.name);

    if (entry.isDirectory()) {
      files.push(...await getFileList(fullPath, relativePath));
    } else {
      const stats = await fs.stat(fullPath);
      files.push({
        path: relativePath,
        size: stats.size
      });
    }
  }

  return files;
}

async function build() {
  console.log('🚀 Building Shop Well extension...\n');

  try {
    // Clean and prepare
    await cleanDist();
    await createDistDir();

    // Bundle scripts with esbuild
    await bundleContentScript();
    await bundleBackgroundScript();

    // Copy other files
    await copyFilesSelectively();

    // Copy assets folder (includes SHOP-WELL.png and other brand assets)
    await copyAssets();

    // Create placeholder icon if needed
    await createIcon();

    // Validate manifest
    await validateManifest();

    // Generate package info
    await generatePackageInfo();

    console.log('\n✅ Build completed successfully!');
    console.log(`📦 Extension built in: ${distDir}`);
    console.log('\n📝 Next steps:');
    console.log('1. Open Chrome and go to chrome://extensions/');
    console.log('2. Enable "Developer mode"');
    console.log('3. Click "Load unpacked" and select the dist folder');
    console.log('4. Test the extension on Amazon or Walmart product pages');
    console.log('5. Press Option+Shift+W (Mac) or Alt+Shift+W (Windows/Linux) to open the side panel');

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Check if this script is being run directly
if (process.argv[1] === __filename) {
  build();
}

export { build };
