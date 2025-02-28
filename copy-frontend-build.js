const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

// Function to copy directory recursively
function copyDirectory(source, destination) {
  // Create destination directory if it doesn't exist
  ensureDirectoryExists(destination);
  
  // Get all files and directories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  // Copy each entry
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy directory
      copyDirectory(sourcePath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied: ${sourcePath} -> ${destPath}`);
    }
  }
}

// Main function
function main() {
  console.log('Starting frontend build copy process...');
  
  // Define paths
  const rootDir = process.cwd();
  const frontendBuildDir = path.join(rootDir, 'frontend', 'build');
  const publicDir = path.join(rootDir, 'public');
  const backendPublicDir = path.join(rootDir, 'backend', 'public');
  
  // Check if frontend build directory exists
  if (!fs.existsSync(frontendBuildDir)) {
    console.log(`❌ Frontend build directory not found at: ${frontendBuildDir}`);
    console.log('Attempting to build frontend...');
    
    try {
      // Try to build frontend
      execSync('cd frontend && npm run build', { stdio: 'inherit' });
      console.log('✅ Frontend build completed successfully.');
    } catch (error) {
      console.error('❌ Failed to build frontend:', error.message);
      process.exit(1);
    }
  }
  
  // Check again if frontend build directory exists after build attempt
  if (!fs.existsSync(frontendBuildDir)) {
    console.error('❌ Frontend build directory still not found after build attempt.');
    process.exit(1);
  }
  
  console.log(`✅ Frontend build directory found at: ${frontendBuildDir}`);
  
  // Copy to public directory
  console.log(`Copying frontend build to public directory: ${publicDir}`);
  copyDirectory(frontendBuildDir, publicDir);
  
  // Copy to backend public directory
  console.log(`Copying frontend build to backend public directory: ${backendPublicDir}`);
  copyDirectory(frontendBuildDir, backendPublicDir);
  
  console.log('✅ Copy process completed successfully.');
  
  // List the directories to verify
  console.log('\nVerifying directories:');
  console.log(`Frontend build directory: ${fs.existsSync(frontendBuildDir) ? '✅ Exists' : '❌ Missing'}`);
  console.log(`Public directory: ${fs.existsSync(publicDir) ? '✅ Exists' : '❌ Missing'}`);
  console.log(`Backend public directory: ${fs.existsSync(backendPublicDir) ? '✅ Exists' : '❌ Missing'}`);
  
  // Check for index.html in each directory
  const frontendIndexPath = path.join(frontendBuildDir, 'index.html');
  const publicIndexPath = path.join(publicDir, 'index.html');
  const backendPublicIndexPath = path.join(backendPublicDir, 'index.html');
  
  console.log(`\nChecking for index.html files:`);
  console.log(`Frontend build index.html: ${fs.existsSync(frontendIndexPath) ? '✅ Exists' : '❌ Missing'}`);
  console.log(`Public index.html: ${fs.existsSync(publicIndexPath) ? '✅ Exists' : '❌ Missing'}`);
  console.log(`Backend public index.html: ${fs.existsSync(backendPublicIndexPath) ? '✅ Exists' : '❌ Missing'}`);
}

// Run the main function
main();