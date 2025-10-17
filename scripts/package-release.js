/* eslint-disable */
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const root = process.cwd();
const distDir = path.join(root, 'dist');
const releaseDir = path.join(root, 'release');

// Read version from manifest
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const version = manifest.version;

// Ensure release directory exists
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

const outputPath = path.join(releaseDir, `date-sniffer-v${version}.zip`);

// Create output stream
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

output.on('close', () => {
  console.log(`\n✅ Release package created successfully!`);
  console.log(`📦 File: ${outputPath}`);
  console.log(`📊 Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\n🚀 Ready to upload to GitHub Releases!`);
});

archive.on('error', (err) => {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add the entire dist directory
archive.directory(distDir, false);

// Finalize the archive
archive.finalize();

