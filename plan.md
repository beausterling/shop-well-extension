# Shop Well Chrome Extension - Project Plan

## 📋 Project Overview

**Mission**: Create a Chrome extension that analyzes Amazon/Walmart products and provides wellness-friendly shopping suggestions for users managing chronic conditions, using Chrome's Built-in AI entirely on-device.

**Target Users**: Individuals with POTS, ME/CFS, or Celiac Disease seeking informed shopping decisions
**Core Technology**: Chrome MV3 Extension + Chrome Built-in AI (Gemini Nano)
**Privacy Approach**: 100% local processing, no external servers

---

## 🎯 Chrome Built-in AI Challenge Requirements

- [x] **New Project**: Original concept for 2025 challenge
- [x] **Chrome Built-in AI**: Will use Summarizer + Prompt APIs
- [ ] **Demonstration Video**: < 3 minutes showing functionality
- [ ] **Public GitHub Repository**: With open source license
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

### 🚧 Phase 2: Chrome Built-in AI Integration (IN PROGRESS)
- [ ] **Chrome AI Feature Detection**: Check API availability
- [ ] **Summarizer API Implementation**: Extract structured facts from product data
- [ ] **Prompt API Implementation**: Generate wellness verdicts
- [ ] **AI Input Optimization**: Text length limits and formatting
- [ ] **JSON Output Validation**: Structured AI responses
- [ ] **Error Handling**: Graceful fallbacks when AI unavailable
- [ ] **Condition-Specific Prompts**: POTS, ME/CFS, Celiac logic
- [ ] **Enhanced Allergen Detection**: AI-powered ingredient analysis
- [ ] **Performance Optimization**: Caching and request limiting

**AI Integration Architecture**:
```javascript
// Summarizer Input: Raw product data → Structured facts JSON
{
  sodium_mg: number,
  compression_mmhg: string,
  gluten_free_claim: boolean,
  // ... condition-relevant facts
}

// Prompt Input: Facts + condition + allergies → Verdict JSON
{
  verdict: "helpful" | "mixed" | "not_ideal",
  bullets: [string, string, string],
  caveat: string
}
```

### 📱 Phase 3: Overlay UI & UX (PENDING)
- [ ] **Floating Panel Component**: Right-side overlay design
- [ ] **Verdict Display**: Emoji badges (✅⚠️❌) with condition context
- [ ] **Bullet Points**: 2-3 key insights from AI analysis
- [ ] **Caveat Section**: Important warnings and limitations
- [ ] **Accessibility Features**: ARIA labels, keyboard navigation
- [ ] **Responsive Design**: Various screen sizes and zoom levels
- [ ] **Show/Hide Animations**: Smooth panel transitions
- [ ] **Close Functionality**: X button and Alt+W toggle
- [ ] **Auto-show Logic**: Respect user preferences
- [ ] **Focus Management**: Proper tab order and screen readers

**UI Specifications**:
- Max width: 320px
- Position: Fixed right side
- z-index: 999999 (above site content)
- Color scheme: Accessible contrast ratios
- Typography: System fonts for consistency

### 🧠 Phase 4: Multi-Condition Intelligence (PENDING)
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
**Phase 1**: ✅ Complete (6 hours)
**Phase 2**: 🚧 In Progress (Est. 8 hours)
**Phase 3**: 📅 Planned (6 hours)
**Phase 4**: 📅 Planned (8 hours)
**Phase 5**: 📅 Planned (4 hours)
**Phase 6**: 📅 Planned (6 hours)

**Total Estimated**: 42 hours for complete MVP to production

---

## 🎯 Chrome Built-in AI Challenge Submission

### Required Components
- [ ] **Working Extension**: Demonstrates AI-powered wellness analysis
- [ ] **Video Demo**: Shows real-world usage on Amazon/Walmart
- [ ] **GitHub Repository**: Open source with clear documentation
- [ ] **Problem Statement**: Wellness-friendly shopping for chronic conditions
- [ ] **API Documentation**: How Summarizer + Prompt APIs are used
- [ ] **Installation Guide**: Step-by-step setup instructions

### Unique Value Proposition
- **On-device AI**: Privacy-preserving health-related analysis
- **Chronic Condition Focus**: Underserved user community
- **Real-world Application**: Practical shopping assistance
- **Comprehensive Safety**: Allergen detection + medical compliance
- **Scalable Architecture**: Extensible to more conditions/sites

---

**Last Updated**: Phase 1 Complete - Ready for Chrome AI Integration
**Repository**: https://github.com/beausterling/shop-well-extension
**License**: MIT