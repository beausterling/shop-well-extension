# Shop Well Chrome Extension - Project Plan

## 📋 Project Overview

**Mission**: Create a Chrome extension that analyzes Amazon/Walmart products and provides wellness-friendly shopping suggestions for users managing chronic conditions, using Chrome's Built-in AI entirely on-device.

**Target Users**: Individuals with POTS, ME/CFS, or Celiac Disease seeking informed shopping decisions
**Core Technology**: Chrome MV3 Extension + Chrome Built-in AI (Gemini Nano)
**Privacy Approach**: 100% local processing, no external servers

---

## 🎯 Chrome Built-in AI Challenge Requirements

- [x] **New Project**: Original concept for 2025 challenge
- [x] **Chrome Built-in AI**: Implemented Summarizer + Prompt APIs
- [ ] **Demonstration Video**: < 3 minutes showing functionality
- [x] **Public GitHub Repository**: With open source license
- [ ] **Working Application**: Accessible for judging
- [ ] **Text Description**: Features, APIs used, problem solved
- [ ] **Feedback Submission**: Development experience with APIs

---

## 🚀 Development Phases

### ✅ Phase 0: Environment & Scaffolding (COMPLETED)
- [x] **Project Structure**: Organized folder hierarchy
- [x] **Chrome MV3 Manifest**: Proper permissions and configuration
- [x] **Background Service Worker**: Keyboard shortcut handling
- [x] **Content Script Foundation**: Main app initialization
- [x] **Options Page**: User settings interface
- [x] **Build System**: Automated extension packaging (`scripts/build.mjs`)
- [x] **Documentation**: README.md and CLAUDE.md
- [x] **Version Control**: GitHub repository with proper .gitignore

### ✅ Phase 1: Parsers & Data Model (COMPLETED)
- [x] **DOM Utilities**: Resilient element extraction (`utils/dom.js`)
- [x] **Amazon Parser**: Product data extraction with fallback selectors
- [x] **Walmart Parser**: Site-specific parsing implementation
- [x] **Allergen Support**: 9 major allergens monitoring system
- [x] **Data Normalization**: Consistent product data structure
- [x] **Options Enhancement**: Allergen selection UI
- [x] **Basic Safety Features**: Pattern-based allergen detection
- [x] **Console Debugging**: Comprehensive logging system
- [x] **ES Module Support**: Modern JavaScript architecture

**Data Extraction Points**:
- [x] Product title, bullets, description
- [x] Ingredients (critical for allergen detection)
- [x] Price information
- [x] Sample reviews (5 max for sentiment)
- [x] Site-specific metadata

### ✅ Phase 2: Chrome Built-in AI Integration (COMPLETED)
- [x] **Chrome AI Feature Detection**: Comprehensive capability checking (`ai/detector.js`)
- [x] **Summarizer API Implementation**: Structured fact extraction with fallbacks
- [x] **Prompt API Implementation**: Wellness verdict generation
- [x] **AI Input Optimization**: Text truncation and formatting for API limits
- [x] **JSON Output Validation**: Robust parsing with error handling
- [x] **Error Handling**: Graceful degradation when AI unavailable
- [x] **Condition-Specific Prompts**: POTS, ME/CFS, Celiac + custom conditions
- [x] **Enhanced Allergen Detection**: AI-powered ingredient analysis
- [x] **Custom User Inputs**: Flexible condition and allergen management
- [x] **Console Output System**: Comprehensive analysis display for debugging

**Implemented AI Pipeline**:
```javascript
// Parse Product → AI Summarizer → AI Prompt → Display Results

// Summarizer extracts structured facts:
{
  high_sodium: boolean,
  compression_garment: boolean,
  gluten_free: boolean,
  allergen_warnings: string[],
  dietary_claims: string[],
  lightweight: boolean,
  ease_of_use: boolean
}

// Prompt generates wellness verdict:
{
  verdict: "helpful" | "mixed" | "not_ideal",
  bullets: ["insight 1", "insight 2", "insight 3"],
  caveat: "important warning",
  allergen_alert: boolean
}
```

**Key Features Implemented**:
- **Custom Conditions**: Users can enter any health condition (IBS, Fibromyalgia, etc.)
- **Custom Allergies**: Unlimited custom allergen addition (coconut, sulfites, corn)
- **AI Fallbacks**: Works on Chrome versions without AI support
- **Safety Priority**: Auto "not_ideal" verdict for user allergens
- **Medical Compliance**: "May help" language, no medical claims

### ✅ Phase 3: Overlay UI & UX (COMPLETED)
- [x] **Panel Component**: Functional `ui/panel.js` with complete AI verdict integration
- [x] **Verdict Display**: Beautiful AI results with emoji badges (✅⚠️❌)
- [x] **Dynamic Content**: Full display of AI bullets, caveats, and condition info
- [x] **Allergen Alerts**: Visual warnings for detected allergens with styling
- [x] **Accessibility Features**: ARIA labels, keyboard navigation, screen reader support
- [x] **Responsive Design**: Mobile-friendly design with various zoom level support
- [x] **Show/Hide Animations**: Smooth slide transitions with Ctrl+Shift+S toggle
- [x] **Auto-show Integration**: Connected to existing autoshow user setting
- [x] **Error State UI**: Complete error handling when AI unavailable or parsing fails
- [x] **Welcome Wizard**: Professional 4-step onboarding with Chrome AI setup
- [x] **Enhanced Options**: AI status indicators and one-click setup assistance
- [x] **Cross-Platform Support**: Mac (Cmd+Shift+S) and Windows (Ctrl+Shift+S) shortcuts

**UI Specifications**:
- Max width: 320px
- Position: Fixed right side
- z-index: 999999 (above site content)
- Color scheme: Accessible contrast ratios
- Typography: System fonts for consistency

### 🧠 Phase 4: Multi-Condition Intelligence (CURRENT PRIORITY)
- [ ] **POTS Condition Logic**: Compression wear, sodium, volume support
- [ ] **ME/CFS Condition Logic**: Energy conservation, ergonomics, gentle materials
- [ ] **Celiac Disease Logic**: Gluten-free certification, cross-contamination
- [ ] **Medical Compliance**: "May help" language, no medical claims
- [ ] **Copy Validation**: 60-word limit enforcement
- [ ] **Safety Warnings**: Clear allergen alerts
- [ ] **Condition Switching**: Dynamic analysis updates
- [ ] **Edge Case Handling**: Insufficient data scenarios

**Condition-Specific Criteria**:

**POTS (Postural Orthostatic Tachycardia Syndrome)**:
- ✅ Helpful: 20-30 mmHg graduated compression, 500mg+ sodium
- ⚠️ Mixed: Moderate sodium with high sugar, sizing concerns
- ❌ Not Ideal: No compression specs, excessive sugar

**ME/CFS (Myalgic Encephalomyelitis/Chronic Fatigue Syndrome)**:
- ✅ Helpful: Low-effort products, energy-conserving design
- ⚠️ Mixed: Moderate weight items, unclear ergonomics
- ❌ Not Ideal: Heavy/bulky items requiring significant exertion

**Celiac Disease**:
- ✅ Helpful: Certified gluten-free, clear labeling
- ⚠️ Mixed: Unclear ingredients, potential cross-contamination
- ❌ Not Ideal: Contains gluten, shared facilities

### 🔧 Phase 5: Stability & Performance (PENDING)
- [ ] **Error Boundaries**: Graceful failure handling
- [ ] **Selector Resilience**: Adapt to website DOM changes
- [ ] **Performance Profiling**: Load time optimization
- [ ] **Memory Management**: Prevent extension memory leaks
- [ ] **Rate Limiting**: AI API request throttling
- [ ] **Cache Implementation**: Avoid redundant AI calls
- [ ] **Fallback Mechanisms**: Basic analysis when AI fails
- [ ] **Edge Case Testing**: Unusual product page layouts
- [ ] **Browser Compatibility**: Chrome version requirements
- [ ] **Extension Lifecycle**: Proper startup/shutdown

### 📦 Phase 6: Production & Distribution (PENDING)
- [ ] **Demo Video Creation**: 3-minute showcase for challenge
- [ ] **User Documentation**: Installation and usage guides
- [ ] **Developer Documentation**: Architecture and contribution guide
- [ ] **Production Build**: Optimized and minified code
- [ ] **Chrome Web Store**: Submission preparation
- [ ] **Privacy Policy**: Compliance documentation
- [ ] **Terms of Service**: Legal framework
- [ ] **Support Documentation**: FAQ and troubleshooting
- [ ] **Analytics Planning**: Privacy-compliant usage insights
- [ ] **Feedback Collection**: User experience improvement

---

## 🔬 Testing Strategy

### ✅ Phase 1 Testing (COMPLETED)
- [x] **Extension Loading**: Chrome installation without errors
- [x] **Site Detection**: Amazon/Walmart PDP recognition
- [x] **Data Extraction**: Console logging verification
- [x] **Allergen Detection**: Basic pattern matching
- [x] **Settings Persistence**: Option page functionality
- [x] **Keyboard Shortcuts**: Alt+W trigger response

### 🧪 Phase 2+ Testing (PLANNED)
- [ ] **Chrome AI Availability**: Feature detection on Chrome 128+
- [ ] **AI Response Quality**: Fact extraction accuracy
- [ ] **Verdict Consistency**: Reliable condition analysis
- [ ] **Performance Benchmarks**: Analysis speed targets
- [ ] **UI Responsiveness**: Panel load times <800ms
- [ ] **Accessibility Compliance**: Screen reader compatibility
- [ ] **Cross-Product Testing**: Various product types
- [ ] **Error Recovery**: Graceful handling of edge cases

**Test Product Categories**:
- [ ] Compression socks (POTS condition)
- [ ] Electrolyte supplements (POTS condition)
- [ ] Ergonomic accessories (ME/CFS condition)
- [ ] Gluten-free foods (Celiac condition)
- [ ] Products with major allergens
- [ ] Products with missing data

---

## 🏆 Success Metrics

### Technical Milestones
- [x] **MVP Functionality**: Basic parsing and allergen detection
- [ ] **AI Integration**: Chrome Built-in AI working end-to-end
- [ ] **User Experience**: Intuitive panel interface
- [ ] **Performance**: <800ms analysis time
- [ ] **Accessibility**: WCAG 2.1 AA compliance
- [ ] **Reliability**: 95%+ successful product analysis

### Challenge Deliverables
- [x] **Open Source Repository**: GitHub with MIT license
- [ ] **Demonstration Video**: <3 minutes showing key features
- [ ] **Working Application**: Installable Chrome extension
- [ ] **Documentation**: Clear installation and usage instructions
- [ ] **API Usage Description**: Summarizer + Prompt API implementation

### User Impact Goals
- [ ] **Safety**: Accurate allergen detection and warnings
- [ ] **Utility**: Helpful wellness insights for chronic conditions
- [ ] **Privacy**: Zero external data transmission
- [ ] **Adoption**: Positive user feedback and engagement

---

## 🛠️ Technical Architecture

### Current Stack
- **Extension Framework**: Chrome MV3 with ES modules
- **Storage**: chrome.storage.local (user preferences)
- **UI**: Vanilla HTML/CSS/JavaScript
- **Build**: Custom Node.js script
- **AI**: Chrome Built-in AI (Summarizer + Prompt APIs)

### Key Dependencies
- **Chrome 128+**: Required for Built-in AI features
- **Permissions**: storage, scripting, activeTab
- **Host Access**: Amazon.com and Walmart.com only

### Security & Privacy
- [x] **Local Processing**: No external API calls
- [x] **Minimal Permissions**: Only required Chrome APIs
- [x] **Data Isolation**: User data never leaves device
- [ ] **Content Security**: Secure AI input sanitization

---

## 📈 Development Timeline

**Phase 0**: ✅ Complete (4 hours)
**Phase 1**: ✅ Complete (6 hours) - Parsers & Data Model
**Phase 2**: ✅ Complete (8 hours) - Chrome AI Integration
**Phase 3**: ✅ Complete (12 hours) - UI Panel & UX Implementation
**Phase 4**: 📅 Planned (8 hours) - Multi-Condition Logic
**Phase 5**: 📅 Planned (4 hours) - Stability & Performance
**Phase 6**: 📅 Planned (6 hours) - Production & Distribution

**Progress**: 30/42 hours complete (71%) - UI/UX and Chrome AI integration implemented

---

## 🎯 Chrome Built-in AI Challenge Submission

### Required Components
- [x] **Working Extension**: AI-powered wellness analysis functional (Phase 2 complete)
- [ ] **Video Demo**: Shows real-world usage on Amazon/Walmart
- [x] **GitHub Repository**: Open source with comprehensive documentation
- [x] **Problem Statement**: Wellness-friendly shopping for chronic conditions
- [x] **API Documentation**: Summarizer + Prompt APIs implemented and documented
- [x] **Installation Guide**: Step-by-step setup instructions in README

### Unique Value Proposition
- **On-device AI**: Privacy-preserving health-related analysis
- **Chronic Condition Focus**: Underserved user community
- **Real-world Application**: Practical shopping assistance
- **Comprehensive Safety**: Allergen detection + medical compliance
- **Scalable Architecture**: Extensible to more conditions/sites

---

---

## 🚀 Current Status & Next Steps

### ✅ **Recently Completed (Phase 2)**
- Chrome Built-in AI fully integrated with Summarizer + Prompt APIs
- Custom condition and allergen management system
- Comprehensive console-based analysis output
- Robust error handling and fallback systems
- Enhanced options page with intuitive custom inputs

### 🎯 **Immediate Next Priority (Phase 3)**
1. **Update UI Panel Component** (`src/content/ui/panel.js`):
   - Replace placeholder with dynamic AI verdict display
   - Show emoji badges, bullets, and caveats from AI analysis
   - Add allergen alert styling and warnings

2. **Integrate Panel with Content Script**:
   - Pass AI verdict data to panel.update() method
   - Connect auto-show logic to AI analysis results
   - Handle loading states and error scenarios

3. **Enhance User Experience**:
   - Smooth show/hide animations on Alt+W
   - Accessible design with proper ARIA labels
   - Mobile-responsive layout for different screen sizes

### 📋 **Ready for Demo**
- Extension fully functional with Chrome AI (when available)
- Works with graceful fallbacks on older Chrome versions
- Supports any custom health condition and unlimited allergies
- Comprehensive analysis displayed in browser console
- Ready for UI panel to make analysis visible to end users

---

**Last Updated**: Phase 2 Complete - Chrome AI Integration Implemented
**Repository**: https://github.com/beausterling/shop-well-extension
**License**: MIT