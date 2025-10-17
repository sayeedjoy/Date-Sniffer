# 📦 Release Guide - Date Sniffer

## Quick Release Steps

### 1️⃣ Build & Package

```bash
# Build the extension
npm run build:extension

# Create release package
npm run package:release
```

This creates: `release/date-sniffer-v1.0.zip`

---

## 2️⃣ Create GitHub Release

### Option A: Using GitHub Website (Recommended)

1. **Go to your repository** on GitHub
   - Navigate to: `https://github.com/YOUR_USERNAME/Date-Sniffer`

2. **Click on "Releases"** (right sidebar)
   - Or go to: `https://github.com/YOUR_USERNAME/Date-Sniffer/releases`

3. **Click "Draft a new release"** or "Create a new release"

4. **Fill in the release form:**

   **Tag version:**
   ```
   v1.0.0
   ```
   
   **Release title:**
   ```
   Date Sniffer v1.0.0 - Initial Release
   ```
   
   **Description:** (Copy from CHANGELOG.md)
   ```markdown
   ## 🎉 Initial Release
   
   Date Sniffer is a Chrome extension to extract post dates from TikTok videos and LinkedIn posts.
   
   ### ✨ Features
   - Extract dates from TikTok videos and LinkedIn posts
   - Automatic detection when visiting supported sites
   - Multiple date formats (UTC, Local, ISO 8601, Unix)
   - Green indicator when date is found
   - Dark mode support
   - Clean, modern UI
   
   ### 📥 Installation
   1. Download `date-sniffer-v1.0.zip` below
   2. Extract the ZIP file
   3. Open Chrome and go to `chrome://extensions/`
   4. Enable "Developer mode"
   5. Click "Load unpacked"
   6. Select the extracted folder
   
   ### 🔒 Privacy
   - No data collection
   - Only works on TikTok and LinkedIn
   - Minimal permissions required
   
   ---
   
   **Full Changelog**: https://github.com/YOUR_USERNAME/Date-Sniffer/blob/main/CHANGELOG.md
   ```

5. **Upload the release file:**
   - Click "Attach binaries by dropping them here or selecting them"
   - Upload: `release/date-sniffer-v1.0.zip`

6. **Select release type:**
   - ✅ Check "Set as the latest release"
   - ⬜ Leave "Set as a pre-release" unchecked

7. **Click "Publish release"** 🚀

---

### Option B: Using GitHub CLI (Advanced)

```bash
# Install GitHub CLI if not installed
# Visit: https://cli.github.com/

# Login to GitHub
gh auth login

# Create release with file
gh release create v1.0.0 \
  release/date-sniffer-v1.0.zip \
  --title "Date Sniffer v1.0.0 - Initial Release" \
  --notes-file CHANGELOG.md
```

---

## 3️⃣ After Publishing

### Update README with Release Badge

Add to the top of `README.md`:

```markdown
# Date Sniffer

[![GitHub release](https://img.shields.io/github/v/release/YOUR_USERNAME/Date-Sniffer)](https://github.com/YOUR_USERNAME/Date-Sniffer/releases)
[![License](https://img.shields.io/github/license/YOUR_USERNAME/Date-Sniffer)](LICENSE)
```

### Share Your Release

- Share the release URL: `https://github.com/YOUR_USERNAME/Date-Sniffer/releases/tag/v1.0.0`
- Users can download and install the extension directly

---

## 🔄 For Future Releases

1. **Update version** in `manifest.json`:
   ```json
   {
     "version": "1.1.0"
   }
   ```

2. **Update CHANGELOG.md** with new features

3. **Build and package**:
   ```bash
   npm run build:extension
   npm run package:release
   ```

4. **Create new GitHub release** with new tag (e.g., `v1.1.0`)

---

## 📝 Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

---

## 🎯 Chrome Web Store (Optional)

To publish on Chrome Web Store:

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Pay one-time $5 developer fee
3. Upload the `release/date-sniffer-v1.0.zip` file
4. Fill in store listing details
5. Submit for review

This makes your extension searchable and installable directly from Chrome Web Store!

---

## ❓ Need Help?

- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [Chrome Extension Publishing Guide](https://developer.chrome.com/docs/webstore/publish/)

