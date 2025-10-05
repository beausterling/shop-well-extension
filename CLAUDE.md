# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Claude, you are an expert google chrome extension developer. 

## Build & Development Commands

```bash
# Install dependencies (first time only)
npm install

# Build the extension (always run after code changes)
npm run build

# Install in Chrome for testing
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the dist/ folder

# Test extension functionality
# Visit Amazon or Walmart product pages and press Option+Shift+W (Mac) or Alt+Shift+W (Windows/Linux)
# The side panel will open showing wellness analysis
# Check browser console for diagnostic messages
```

## Project Architecture

### Chrome Extension MV3 Structure (Side Panel Architecture)
- **Background Service Worker** (`background.js`): Handles keyboard shortcuts, side panel management, and message routing
- **Content Script** (`content/content.js`): Extracts product data from Amazon/Walmart pages (bundled with esbuild)
- **Side Panel** (`sidepanel/`): Chrome AI-powered analysis UI with all AI logic (LanguageModel + Summarizer APIs)
- **Options Page** (`options/`): User settings for health conditions and allergen preferences
- **Welcome Page** (`welcome/`): Onboarding flow for new users

### Core Components

**Parser System** (`content/parsers/`):
- Site-specific parsers (AmazonParser, WalmartParser) with resilient DOM selectors
- Unified data extraction: title, bullets, description, ingredients, price, reviews
- Fallback selector arrays to handle website DOM changes
- ES modules bundled with esbuild for browser compatibility

**Message Flow Architecture**:
1. User presses `Option+Shift+W` (Mac) or `Alt+Shift+W` (Windows/Linux) keyboard shortcut
2. Background worker opens side panel for current tab
3. Background sends `extract-product-data` command to content script
4. Content script uses parser to extract product data from page DOM
5. Content script returns data to background worker
6. Background forwards data to side panel with `analyze-product` message
7. Side panel runs AI analysis (Summarizer → Prompt API) and displays results

**Side Panel AI Processing** (`sidepanel/sidepanel.js`):
- Chrome AI availability detection (`window.ai.languageModel`, `window.ai.summarizer`)
- Product fact extraction using Summarizer API
- Wellness verdict generation using Prompt API (LanguageModel)
- Multi-language support with auto-detection
- Fallback analysis when AI unavailable

**DOM Utilities** (`content/utils/dom.js`):
- `getText()` and `getTextArray()` with multiple fallback selectors
- `extractPrice()` and `extractIngredients()` for specialized extraction
- Text cleaning/normalization for AI processing
- Null-safe operations with console logging

### Settings & Storage Schema
Chrome storage.local contains:
```javascript
{
  condition: 'POTS' | 'ME/CFS' | 'Celiac Disease',
  allergies: ['peanuts', 'milk', 'soy'], // 9 major allergens supported
  autoshow: boolean
}
```

### Development Phases

**Phase 1 (Current - Completed)**: Product parsers with allergen support
**Phase 2 (Next)**: Chrome Built-in AI integration (Summarizer + Prompt APIs)
**Phase 3**: Floating overlay UI panel
**Phase 4**: Multi-condition wellness logic
**Phase 5**: Stability and performance optimization
**Phase 6**: Documentation and packaging

## Chrome Built-in AI Integration (Active)

The extension uses Chrome's on-device AI APIs in the side panel:
- **Summarizer API** (`window.ai.summarizer`): Extract structured facts from product data
- **Prompt API** (`window.ai.languageModel`): Generate wellness verdicts based on health conditions
- All processing happens locally on-device (no external servers, complete privacy)

**IMPORTANT**: AI APIs are only available in extension contexts (side panel, popup, options), NOT in content scripts.

Enable Chrome AI flags for development:
- `chrome://flags/#optimization-guide-on-device-model` → Enabled
- `chrome://flags/#prompt-api-for-gemini-nano` → Enabled
- `chrome://flags/#summarization-api-for-gemini-nano` → Enabled

After enabling flags:
1. Restart Chrome completely (Cmd+Q on Mac, quit fully on Windows)
2. Wait 2-3 minutes for AI models to download (~2GB+)
3. Check status at `chrome://on-device-internals` (Model Status tab)
4. Verify "Foundational model state: Ready" and APIs show version numbers

## Key Technical Constraints

**Browser Compatibility**: Chrome 114+ (for Side Panel API), Chrome 128+ recommended (for AI APIs)
**Content Security**: Content scripts bundled with esbuild (ES modules → IIFE), strict CSP
**Site Targeting**: Amazon.com and Walmart.com product detail pages only
**AI Access**: Chrome Built-in AI only accessible in side panel (not content scripts)
**Data Processing**: 100% local processing, no external API calls, all data stays on-device
**Medical Compliance**: Informational only, no medical advice language

## Debugging & Console Output

Extension logs extensively to browser console:
- Initialization status and detected sites
- Parser extraction success/failure for each data field
- Basic allergen detection warnings
- User settings and configuration state

## File Dependencies

- **Manifest type**: ES modules (`"type": "module"`)
- **Import paths**: Relative imports from content/ directory
- **Build output**: All files copied to dist/ for Chrome loading
- **Icon placeholder**: 128x128 PNG required in assets/

## Chrome Extension Permissions

- `storage`: User preferences persistence
- `scripting` + `activeTab`: Content script execution on product pages
- `sidePanel`: Chrome Side Panel API access for AI-powered UI
- `tabs`: Tab management for side panel context
- `host_permissions`: Amazon.com and Walmart.com access only
- `commands`: Option+Shift+W keyboard shortcut (Mac uses Option key, Windows/Linux use Alt key)