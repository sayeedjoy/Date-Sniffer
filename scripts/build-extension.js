/* eslint-disable */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const outDir = path.join(root, 'out');
const distDir = path.join(root, 'dist');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copy(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  ensureDir(destDir);
  for (const entry of fs.readdirSync(srcDir)) {
    const src = path.join(srcDir, entry);
    const dest = path.join(destDir, entry);
    const stat = fs.statSync(src);
    if (stat.isDirectory()) copyDir(src, dest);
    else copy(src, dest);
  }
}

function run() {
  ensureDir(distDir);

  // Copy exported Next.js site into popup directory
  const popupDir = path.join(distDir, 'popup');
  ensureDir(popupDir);
  copyDir(outDir, popupDir);

  // Post-process HTML to externalize inline scripts (MV3 forbids inline JS)
  const htmlFiles = [];
  (function collectHtml(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) collectHtml(full);
      else if (entry.endsWith('.html')) htmlFiles.push(full);
    }
  })(popupDir);

  const inlineDir = path.join(popupDir, '_inline');
  ensureDir(inlineDir);
  let inlineCounter = 0;
  for (const htmlPath of htmlFiles) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    // Replace executable inline scripts only (skip type="application/json")
    html = html.replace(/<script(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/g, (match, attrs, code) => {
      const typeMatch = /type=["']([^"']+)["']/i.exec(attrs || '');
      const type = typeMatch ? typeMatch[1] : '';
      if (type && type.toLowerCase() === 'application/json') return match; // keep JSON data inline
      const fileName = `inline-${++inlineCounter}.js`;
      const filePath = path.join(inlineDir, fileName);
      fs.writeFileSync(filePath, code);
      const relPath = path.relative(path.dirname(htmlPath), filePath).replace(/\\/g, '/');
      return `<script src="${relPath}"></script>`;
    });
    fs.writeFileSync(htmlPath, html);
  }

  // Copy extension assets
  for (const file of ['manifest.json', 'background.js']) {
    copy(path.join(root, file), path.join(distDir, file));
  }
  copyDir(path.join(root, 'icons'), path.join(distDir, 'icons'));
  copyDir(path.join(root, 'content-scripts'), path.join(distDir, 'content-scripts'));

  // Adjust manifest default_popup path if needed (we already set to popup/index.html later)
  const manifestPath = path.join(root, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.action = manifest.action || {};
  manifest.action.default_popup = 'popup/index.html';
  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('Built extension to dist/');
}

run();


