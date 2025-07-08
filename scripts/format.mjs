#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🎨 Running additional formatting tasks...');

try {
	// Format root level files
	console.log('📝 Formatting root configuration files...');
	execSync('prettier --write "*.{js,json,md,yaml,yml}" ".*rc.js"', { stdio: 'inherit' });
	
	console.log('✅ All files formatted successfully!');
} catch (error) {
	console.error('❌ Error during formatting:', error.message);
	process.exit(1);
} 