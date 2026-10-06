const fs = require('fs');
const path = require('path');

// Build script for registration feature
console.log('Building registration feature...');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy TypeScript files to dist
const srcDir = __dirname;
const files = fs.readdirSync(srcDir);

files.forEach(file => {
  if (file.endsWith('.ts') || file.endsWith('.tsx') || file === 'package.json') {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(distDir, file);
    
    if (fs.statSync(srcPath).isFile()) {
      const content = fs.readFileSync(srcPath, 'utf8');
      fs.writeFileSync(destPath, content);
      console.log(`Copied ${file} to dist/`);
    }
  }
});

console.log('Registration feature build completed!');