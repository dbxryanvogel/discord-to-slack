const fs = require('fs');
const path = require('path');

// Ensure the public directory exists in dist/dashboard
const distPublicDir = path.join(__dirname, 'dist', 'dashboard', 'public');
const srcPublicDir = path.join(__dirname, 'src', 'dashboard', 'public');

// Create the directory if it doesn't exist
if (!fs.existsSync(distPublicDir)) {
    fs.mkdirSync(distPublicDir, { recursive: true });
}

// Copy dashboard.html
const srcFile = path.join(srcPublicDir, 'dashboard.html');
const destFile = path.join(distPublicDir, 'dashboard.html');

if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, destFile);
    console.log('✅ Copied dashboard.html to dist/dashboard/public/');
} else {
    console.error('❌ dashboard.html not found in src/dashboard/public/');
}
