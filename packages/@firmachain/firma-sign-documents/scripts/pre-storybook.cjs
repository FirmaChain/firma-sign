#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define paths
const srcDir = path.join(__dirname, '..', 'src');
const pdfWorkerPath = path.join(srcDir, 'pdf-worker.ts');
const configurePdfPath = path.join(srcDir, 'configure-pdf.ts');

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

// Check if configure-pdf.ts exists (if needed for CDN fallback)
if (!fs.existsSync(configurePdfPath)) {
    console.log('⚠️  configure-pdf.ts not found. Creating it...');
    
    const configurePdfContent = `// Configure PDF.js before react-pdf initializes
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker immediately on module load
const workerUrl = \`https://unpkg.com/pdfjs-dist@\${pdfjsLib.version}/build/pdf.worker.min.js\`;

console.log('[PDF Configuration] Configuring PDF.js worker:', workerUrl);

// Configure the worker globally
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// Export for use if needed
export { pdfjsLib };
`;
    
    fs.writeFileSync(configurePdfPath, configurePdfContent);
    console.log('✅ Created configure-pdf.ts');
} else {
    console.log('✅ configure-pdf.ts exists');
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