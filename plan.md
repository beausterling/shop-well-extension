# Shop Well - Project Plan & Context

## 📋 Project Overview

**Mission**: Chrome extension that analyzes Amazon/Walmart products for people with chronic conditions (POTS, ME/CFS, Celiac Disease) using Chrome Built-in AI (Gemini Nano).

**Core Value**: 100% private, on-device AI analysis for wellness-friendly shopping decisions.

**Tech Stack**:
- Chrome MV3 Extension with Side Panel API
- Chrome Built-in AI (Summarizer + Prompt APIs)
- esbuild bundler for ES modules
- Nature-inspired wellness design system
- Netlify-hosted landing page (separate from extension)

**Repository**: https://github.com/beausterling/shop-well-extension
**Branch**: `functional-mvp` (active development)
**License**: MIT

---

## ✅ What's Complete

### Extension Core Functionality
- ✅ **Chrome Built-in AI Integration**: Summarizer + Prompt APIs working
- ✅ **Side Panel Architecture**: AI accessible in extension context (not content scripts)
- ✅ **Product Parsers**: Amazon & Walmart data extraction with fallbacks
- ✅ **Allergen Detection**: 9 major allergens monitored
- ✅ **Message Flow**: Content script → Background → Side Panel → AI Analysis
- ✅ **esbuild Bundling**: ES modules converted to IIFE for browser compatibility
- ✅ **Keyboard Shortcuts**:
  - Option+Shift+W (Mac) / Alt+Shift+W (Windows/Linux) - Main analysis
  - Command+Shift+S (Mac) / Ctrl+Shift+S (Windows/Linux) - Test UI panel

### Design System (WCAG AA Compliant)
- ✅ **Brand Colors**: Fresh Leaf Green (#6BAF7A), Sky Blue (#65AEDD), Warm Terracotta (#D38B6D), Golden Honey (#F2C94C)
- ✅ **Design Tokens**: Comprehensive CSS custom properties
- ✅ **All Pages Redesigned**: Side panel, welcome, options, test panel
- ✅ **Accessibility**: Focus management, keyboard navigation, 4.5:1+ contrast ratios
- ✅ **Animations**: Smooth transitions, fade-ins, loading spinners

### Landing Page (NEW - COMPLETED)
- ✅ **Marketing Website**: Complete landing page separate from extension
  - `landing/index.html` - Hero, features, FAQ, CTA
  - `landing/about.html` - Personal story & mission
  - `landing/styles.css` - Full design system (1,034 lines)
  - `landing/script.js` - Interactive features (mobile menu, smooth scrolling)
  - `landing/netlify.toml` - Deployment configuration
  - `landing/README.md` - Deployment guide
- ✅ **Branding Assets**:
  - Navbar icon (150×162px character portrait)
  - Hero image with rounded corners (SHOP-WELL.png)
  - Multiple backups and variants
- ✅ **Deployment Ready**:
  - Configured for Netlify
  - Custom domain: shopwell-extension.com (Namecheap)
  - SEO optimized, WCAG AA accessible
  - Mobile-first responsive design
- ✅ **Committed & Pushed**: All files in GitHub, ready to deploy

### Development Tools
- ✅ **Test UI Panel**: Standalone environment for rapid UI development (Command+Shift+S)
- ✅ **Build System**: Automated bundling + asset copying
- ✅ **Multi-Product Listing Support**: Search page detection + badge injection (implemented, needs testing)

---

## 🎯 What's Working Right Now

**Extension Functionality**:
1. User clicks extension icon → Side panel opens
2. Content script extracts product data (Amazon/Walmart)
3. Background routes data to side panel
4. Side panel runs AI analysis using Chrome Built-in AI
5. Results display in wellness-branded UI

**AI Analysis**:
- Summarizer API extracts facts from product data
- Prompt API generates condition-specific wellness verdicts
- Allergen detection with visual warnings
- Graceful fallback when AI unavailable

**Known Limitation**: Keyboard shortcut (Option+Shift+W) doesn't work due to Chrome security restriction - user must click extension icon or product badges instead.

---

## ⚠️ What Needs Work (NEXT PRIORITIES)

### Priority 1: UI Refinements
- **Welcome Page**: Improve onboarding flow
  - Clearer instructions for enabling Chrome AI
  - Better visual feedback during setup
  - Streamline 4-step wizard to 2-3 steps
- **Side Panel**: Polish analysis display
  - Improve loading states
  - Better error messaging
  - Enhanced verdict visualization
- **Design Consistency**: Minor tweaks across all pages
  - Spacing adjustments
  - Animation timing
  - Icon consistency

### Priority 2: Onboarding Flow
- Simplify first-time user experience
- Add Chrome AI enablement guide
- Create inline help/tooltips
- Add "quick start" mode

### Priority 3: Testing & Stability
- End-to-end workflow verification
- Multi-product listing badges (search pages) - code complete, needs testing
- Edge case handling (missing ingredients, unclear product data)
- Performance optimization (badge injection speed)

### Priority 4: Polish for Demo
- Create 3-minute demo video
- Refine copy for medical compliance
- Add Chrome Web Store submission materials
- Documentation cleanup

---

## 🛠️ Technical Architecture

### Message Flow
```
User Action → Extension Icon Click
  → Background opens Side Panel
  → Background requests data from Content Script
  → Content Script extracts product data (parsers)
  → Content Script returns data to Background
  → Background forwards to Side Panel
  → Side Panel runs AI analysis (Summarizer + Prompt APIs)
  → Side Panel displays results in UI
```

### File Structure
```
shop-well/
├── landing/              # Marketing website (Netlify)
│   ├── index.html
│   ├── about.html
│   ├── styles.css
│   ├── script.js
│   ├── netlify.toml
│   └── assets/
├── src/                  # Chrome extension
│   ├── manifest.json
│   ├── background.js
│   ├── sidepanel/        # AI + UI logic
│   ├── content/          # Product parsers
│   ├── options/          # Settings page
│   ├── welcome/          # Onboarding
│   └── test-panel/       # Dev tools
├── scripts/
│   └── build.mjs         # esbuild bundler
└── dist/                 # Built extension
```

### Chrome Built-in AI Notes
- **CRITICAL**: AI APIs only work in extension contexts (side panel, popup, options, background)
- **NOT accessible**: Content scripts cannot use `window.ai.*`
- **API Methods**: Use `.availability()` not `.capabilities()`
- **Availability States**: Accept both `'readily'` and `'available'` as ready
- **Language Spec**: Must include `expectedOutputs` parameter with language

---

## 📦 Landing Page Deployment Guide

### Quick Deploy to Netlify
1. Go to [app.netlify.com](https://app.netlify.com)
2. "Add new site" → "Import from GitHub"
3. Select: `shop-well-extension` repo
4. **Base directory**: `landing`
5. **Build command**: (leave empty)
6. **Publish directory**: `.`
7. Deploy!

### Custom Domain (shopwell-extension.com)
**In Netlify**:
- Add domain: `shopwell-extension.com`
- Get DNS records (A + CNAME)

**In Namecheap**:
- A Record: `@` → Netlify IP
- CNAME Record: `www` → `[site].netlify.app`
- Wait 10-60 minutes for DNS propagation

### Auto-Deploy
Every push to `functional-mvp` branch auto-deploys landing page via Netlify.

---

## 🚀 Immediate Next Steps

### For Next Agent Working on UI/UX:

**1. Review Current State**
- Load extension in Chrome
- Test side panel functionality
- Check welcome page flow
- Review all UI states in test panel (Command+Shift+S)

**2. Welcome Page Improvements**
- Simplify onboarding from 4 steps to 2-3
- Add clearer Chrome AI setup instructions
- Improve visual hierarchy
- Add progress indicators

**3. Side Panel Refinements**
- Polish loading states
- Enhance verdict display (larger, more visual)
- Improve error messages
- Add "retry" functionality

**4. Design Consistency**
- Audit spacing across all pages
- Standardize button sizes
- Verify emoji rendering
- Check animation timings

**5. Testing**
- End-to-end user flow
- Multi-product listing badges (search pages)
- Error handling edge cases
- Performance on slow connections

### Build & Test Commands
```bash
# Build extension
npm run build

# Load in Chrome
# 1. chrome://extensions/
# 2. Enable "Developer mode"
# 3. "Load unpacked" → select dist/ folder

# Test UI states
# Press Command+Shift+S (Mac) or Ctrl+Shift+S (Windows/Linux)
# Toggle states with buttons or keys 1-5

# Test main functionality
# Click extension icon (NOT keyboard shortcut)
# Visit Amazon/Walmart product page
# Check side panel for analysis
```

---

## 📊 Progress Summary

**Completion**: ~85% complete
- ✅ Core AI functionality working
- ✅ Design system complete
- ✅ Landing page complete
- ⚠️ UI polish needed
- ⚠️ Onboarding flow needs work
- ⚠️ Testing incomplete

**Current Branch**: `functional-mvp`
**Last Major Commit**: Landing page creation + rounded corner assets
**Ready For**: UI/UX refinements and user testing

---

**Last Updated**: Landing page completed and pushed to GitHub
**Next Focus**: Welcome page, onboarding flow, side panel UI polish
