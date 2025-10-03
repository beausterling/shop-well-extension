# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Claude, you are an expert google chrome extension developer. 

## Build & Development Commands

```bash
# Build the extension (always run after code changes)
node scripts/build.mjs

# Install in Chrome for testing
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the dist/ folder

# Test extension functionality
# Visit Amazon or Walmart product pages and press Alt+W
# Check browser console for "Shop Well initializing..." messages
```

## Project Architecture

### Chrome Extension MV3 Structure
- **Background Service Worker** (`background.js`): Handles keyboard shortcuts and extension lifecycle
- **Content Scripts** (`content/content.js`): Main app logic, runs on Amazon/Walmart pages
- **Options Page** (`options/`): User settings for health conditions and allergen preferences

### Core Components

**Parser System** (`content/parsers/`):
- Site-specific parsers (AmazonParser, WalmartParser) with resilient DOM selectors
- Unified data extraction: title, bullets, description, ingredients, price, reviews
- Fallback selector arrays to handle website DOM changes
- ES module imports with `"type": "module"` in manifest

**Data Flow Pipeline**:
1. `ShopWellApp.detectSiteAndParser()` - Identifies Amazon/Walmart PDPs
2. `Parser.parse()` - Extracts structured product data
3. `ShopWellApp.analyzeAndShow()` - Processes data for wellness analysis
4. Basic allergen pattern matching (Phase 2 will add Chrome AI integration)

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

## Chrome Built-in AI Integration (Phase 2)

The extension is designed for Chrome's on-device AI APIs:
- **Summarizer API**: Extract structured facts from product data
- **Prompt API**: Generate wellness verdicts based on health conditions
- All processing happens locally (no external servers)

Enable Chrome AI flags for development:
- `chrome://flags/#optimization-guide-on-device-model`
- `chrome://flags/#prompt-api-for-gemini-nano`
- `chrome://flags/#summarization-api-for-gemini-nano`

## Key Technical Constraints

**Browser Compatibility**: Chrome 128+ required for AI APIs
**Content Security**: ES modules in content scripts, strict permission model
**Site Targeting**: Amazon.com and Walmart.com product detail pages only
**Data Processing**: All user data stays local, no external API calls
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
- `scripting` + `activeTab`: Content script injection
- `host_permissions`: Amazon.com and Walmart.com access only
- `commands`: Alt+W keyboard shortcut registration