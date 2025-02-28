const fs = require('fs');
const path = require('path');

// Function to recursively list directories
function listDirectoryContents(dir, indent = '') {
  console.log(`${indent}Directory: ${dir}`);
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        console.log(`${indent}  📁 ${item}`);
        // Only go one level deep to avoid too much output
        if (indent.length < 2) {
          listDirectoryContents(itemPath, indent + '    ');
        }
      } else {
        console.log(`${indent}  📄 ${item} (${stats.size} bytes)`);
      }
    });
  } catch (err) {
    console.error(`${indent}Error reading directory ${dir}: ${err.message}`);
  }
}

// Check current directory
console.log('Current working directory:', process.cwd());

// Check if frontend/build exists
const buildPath = path.join(__dirname, 'frontend', 'build');
if (fs.existsSync(buildPath)) {
  console.log(`\n✅ Frontend build directory exists at: ${buildPath}`);
  listDirectoryContents(buildPath);
} else {
  console.log(`\n❌ Frontend build directory DOES NOT exist at: ${buildPath}`);
}

// Check backend directory
const backendPath = path.join(__dirname, 'backend');
if (fs.existsSync(backendPath)) {
  console.log(`\n✅ Backend directory exists at: ${backendPath}`);
  listDirectoryContents(backendPath, '  ');
} else {
  console.log(`\n❌ Backend directory DOES NOT exist at: ${backendPath}`);
}

// List root directory
console.log('\nRoot directory contents:');
listDirectoryContents(__dirname);