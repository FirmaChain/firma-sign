#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define paths
const srcDir = path.join(__dirname, '..', 'src');
const pdfWorkerPath = path.join(srcDir, 'pdf-worker.ts');

console.log('🔍 Checking pre-storybook requirements...');

// Check if pdf-worker.ts exists
if (!fs.existsSync(pdfWorkerPath)) {
    console.log('⚠️  pdf-worker.ts not found. Creating it...');
    
    const pdfWorkerContent = `import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
// Use the Vite approach for modern bundlers
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

export { pdfjs };
`;
    
    fs.writeFileSync(pdfWorkerPath, pdfWorkerContent);
    console.log('✅ Created pdf-worker.ts');
} else {
    console.log('✅ pdf-worker.ts exists');
}

// Check if dist directory exists (needed for some imports)
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
    console.log('📦 Building package to ensure all dependencies are ready...');
    try {
        execSync('pnpm build', { 
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit' 
        });
        console.log('✅ Build completed');
    } catch (error) {
        console.warn('⚠️  Build failed, but continuing with Storybook...');
    }
}

console.log('✨ Pre-storybook checks complete!');