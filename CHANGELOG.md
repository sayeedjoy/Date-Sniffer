# Changelog

All notable changes to Date Sniffer will be documented in this file.

## [1.0.0] - 2025-10-17

### 🎉 Initial Release

#### Features
- ✨ Extract post dates from TikTok videos and LinkedIn posts
- 🔄 Automatic date detection when visiting TikTok/LinkedIn posts
- 📋 Display dates in multiple formats (UTC, Local, ISO 8601, Unix timestamp)
- 🟢 Green dot indicator when date is detected
- 🌓 Dark mode support with saved preferences
- ⚡ Clean, modern UI with responsive design

#### Technical
- 🛡️ Production-ready error handling
- 🚫 No console errors in production
- 🎯 Fixed LinkedIn date extraction (bit shift correction)
- 🔧 Handles extension context invalidation gracefully
- 📦 Built with Next.js and React

#### Security & Privacy
- 🔒 No data collection or storage
- 🎯 Only works on TikTok and LinkedIn URLs
- ✅ Minimal permissions required

## [1.1.0] - 2025-12-10

### ✨ UI/UX
- 🌗 Migrated popup to Tailwind + shadcn theme with unified cards for manual/auto dates
- 🖼️ Refined popup layout, typography, and alignment; fixed narrow popup width in Chrome
- 🧭 Removed timezone switcher (UTC/local already shown in details)

### 🔄 Detection & Behavior
- 🖼️ Added TikTok `/photo/{id}` auto/manual date extraction
- ✅ Improved manual paste validation/reset flows to prevent broken states

### 🔧 Technical
- 🧩 Added shadcn-style UI primitives (Button/Input/Card/Badge/Switch) and tailwind config
- 📦 Updated build pipeline for Tailwind/PostCSS assets while keeping MV3 compliance

