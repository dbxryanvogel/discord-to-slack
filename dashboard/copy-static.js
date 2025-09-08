const fs = require('fs');
const path = require('path');

// Ensure the public directory exists in dist
const distPublicDir = path.join(__dirname, 'dist', 'public');
const srcPublicDir = path.join(__dirname, 'public');

// Create the directory if it doesn't exist
if (!fs.existsSync(distPublicDir)) {
    fs.mkdirSync(distPublicDir, { recursive: true });
}

// Copy all files from public to dist/public
if (fs.existsSync(srcPublicDir)) {
    const files = fs.readdirSync(srcPublicDir);
    files.forEach(file => {
        const srcFile = path.join(srcPublicDir, file);
        const destFile = path.join(distPublicDir, file);
        fs.copyFileSync(srcFile, destFile);
        console.log(`✅ Copied ${file} to dist/public/`);
    });
} else {
    console.log('❌ Public directory not found');
}
