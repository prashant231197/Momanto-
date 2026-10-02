const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, 'pages/api');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const original = content;
  
  // Replace all variations of localhost:5000
  content = content.replace(/http:\/\/localhost:5000/g, 'http://127.0.0.1:5000');
  content = content.replace(/http:\/\/localhost:5001/g, 'http://127.0.0.1:5001');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`⏭️  No change needed: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.ts')) {
      fixFile(fullPath);
    }
  });
}

console.log('🔧 Fixing localhost URLs in pages/api...');
walkDir(API_DIR);
console.log('✅ Done! All files fixed.');
