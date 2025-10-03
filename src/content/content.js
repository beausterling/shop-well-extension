// Shop Well Content Script

import { AmazonParser } from './parsers/amazon.js';
import { WalmartParser } from './parsers/walmart.js';
import { checkAIAvailability, logAICapabilities, canUseAIAnalysis } from './ai/detector.js';
import { summarizeProduct, createFallbackFacts } from './ai/summarize.js';
import { generateVerdict, createFallbackVerdict } from './ai/prompt.js';
import { ShopWellPanel } from './ui/panel.js';

// Main application class
class ShopWellApp {
  constructor() {
    this.panel = null;
    this.parser = null;
    this.settings = {};
    this.isAnalyzing = false;
    this.aiCapabilities = null;
  }

  async init() {
    console.log('Shop Well initializing...');

    try {
      // Load user settings including custom conditions and allergies
      this.settings = await chrome.storage.local.get([
        'condition', 'customCondition', 'autoshow', 'allergies', 'customAllergies'
      ]);
      this.settings.condition = this.settings.condition || 'POTS';
      this.settings.customCondition = this.settings.customCondition || '';
      this.settings.autoshow = this.settings.autoshow !== false;
      this.settings.allergies = this.settings.allergies || [];
      this.settings.customAllergies = this.settings.customAllergies || [];

      // Check AI capabilities
      this.aiCapabilities = await checkAIAvailability();
      logAICapabilities(this.aiCapabilities);

      // Detect current site and check if it's a product page
      if (!this.detectSiteAndParser()) {
        console.log('Shop Well: Not a supported product page');
        return;
      }

      console.log(`Shop Well: Detected ${this.parser.name || 'Unknown'} product page`);

      // Initialize UI panel (will be implemented in Phase 3)
      await this.initializePanel();

      // Auto-show analysis if enabled
      if (this.settings.autoshow) {
        await this.analyzeAndShow();
      }

      // Listen for keyboard shortcuts and messages
      this.setupEventListeners();

    } catch (error) {
      console.error('Shop Well initialization failed:', error);
    }
  }

  detectSiteAndParser() {
    if (AmazonParser.isPDP()) {
      this.parser = AmazonParser;
      console.log('Shop Well: Amazon PDP detected');
      return true;
    } else if (WalmartParser.isPDP()) {
      this.parser = WalmartParser;
      console.log('Shop Well: Walmart PDP detected');
      return true;
    }

    return false;
  }

  async initializePanel() {
    console.log('Shop Well: Initializing UI panel...');

    try {
      this.panel = new ShopWellPanel();
      this.panel.create();

      // Listen for retry events from the panel
      window.addEventListener('shop-well-retry', () => {
        this.analyzeAndShow();
      });

      console.log('Shop Well: Panel initialized successfully');
    } catch (error) {
      console.error('Shop Well: Panel initialization failed:', error);
    }
  }

  async analyzeAndShow() {
    if (this.isAnalyzing) return;

    this.isAnalyzing = true;
    console.log('Shop Well: Starting product analysis...');

    // Show loading state in panel
    if (this.panel) {
      this.panel.showLoading();
    }

    try {
      // Parse product data
      const productData = this.parser.parse();

      if (!productData) {
        console.warn('Shop Well: Failed to parse product data');
        if (this.panel) {
          this.panel.showError('Unable to analyze this product page. Make sure you\'re on a supported product page.');
        }
        return;
      }

      console.log('Shop Well: Product data parsed successfully');

      // Get all allergies (preset + custom)
      const allAllergies = [...this.settings.allergies, ...this.settings.customAllergies];

      // Get actual condition name
      const actualCondition = this.settings.condition === 'custom'
        ? this.settings.customCondition
        : this.settings.condition;

      console.log('Shop Well: Analysis settings:', {
        condition: actualCondition,
        isCustom: this.settings.condition === 'custom',
        allergies: allAllergies,
        aiAvailable: canUseAIAnalysis(this.aiCapabilities)
      });

      // Step 1: Extract structured facts
      let facts;
      if (canUseAIAnalysis(this.aiCapabilities) && this.aiCapabilities.summarizer) {
        console.log('Shop Well: Using AI for fact extraction...');
        facts = await summarizeProduct(productData);
      }

      if (!facts) {
        console.log('Shop Well: Using fallback fact extraction...');
        facts = createFallbackFacts(productData);
      }

      // Step 2: Generate wellness verdict
      let verdict;
      if (canUseAIAnalysis(this.aiCapabilities) && this.aiCapabilities.prompt) {
        console.log('Shop Well: Using AI for verdict generation...');
        verdict = await generateVerdict(
          facts,
          this.settings.condition,
          allAllergies,
          this.settings.customCondition
        );
      }

      if (!verdict) {
        console.log('Shop Well: Using fallback verdict generation...');
        verdict = createFallbackVerdict(facts, allAllergies);
      }

      // Step 3: Display results
      this.displayAnalysisResults(productData, facts, verdict, actualCondition);

      // Step 4: Show results in panel
      if (this.panel) {
        // Check if AI is available to show setup or analysis
        if (!canUseAIAnalysis(this.aiCapabilities)) {
          this.panel.showSetup();
        } else {
          // Prepare analysis data for panel
          const analysisData = {
            ...verdict,
            condition: actualCondition,
            allergen_warnings: facts.allergen_warnings || [],
            confidence: facts.confidence || 'medium'
          };
          this.panel.showAnalysis(analysisData);
        }
      }

      // Legacy allergen check (will be replaced by AI analysis)
      if (productData.ingredients && allAllergies.length > 0) {
        this.checkBasicAllergens(productData.ingredients, allAllergies);
      }

    } catch (error) {
      console.error('Shop Well analysis failed:', error);
      if (this.panel) {
        this.panel.showError('Analysis failed. Please try again or check your Chrome AI settings.');
      }
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Display comprehensive analysis results
   */
  displayAnalysisResults(productData, facts, verdict, condition) {
    console.log('='.repeat(50));
    console.log('🛍️ SHOP WELL ANALYSIS RESULTS');
    console.log('='.repeat(50));

    console.log('📋 Product:', productData.title);
    console.log('🏥 Condition:', condition);
    console.log('🔬 AI Enhanced:', canUseAIAnalysis(this.aiCapabilities));

    console.log('\n📊 EXTRACTED FACTS:');
    Object.entries(facts).forEach(([key, value]) => {
      if (key !== 'summary_text' && value !== false && value !== null && value !== '') {
        console.log(`  • ${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
      }
    });

    console.log('\n🎯 WELLNESS VERDICT:');
    const verdictEmoji = {
      'helpful': '✅',
      'mixed': '⚠️',
      'not_ideal': '❌'
    };

    console.log(`  ${verdictEmoji[verdict.verdict]} ${verdict.verdict.toUpperCase()}`);

    console.log('\n💡 KEY INSIGHTS:');
    verdict.bullets.forEach((bullet, index) => {
      console.log(`  ${index + 1}. ${bullet}`);
    });

    console.log('\n⚠️ IMPORTANT CAVEAT:');
    console.log(`  ${verdict.caveat}`);

    if (verdict.allergen_alert) {
      console.log('\n🚨 ALLERGEN ALERT: This product may contain allergens you specified!');
    }

    console.log('\n💬 DISCLAIMER: This is informational guidance only, not medical advice.');
    console.log('='.repeat(50));
  }

  /**
   * Basic allergen checking (legacy - enhanced AI analysis above)
   * @param {string} ingredients
   * @param {Array} allergies
   */
  checkBasicAllergens(ingredients, allergies) {
    const foundAllergens = [];
    const ingredientsLower = ingredients.toLowerCase();

    for (const allergen of allergies) {
      const allergenPatterns = {
        'peanuts': ['peanut', 'groundnut'],
        'tree-nuts': ['almond', 'walnut', 'pecan', 'cashew', 'hazelnut', 'pistachio', 'macadamia'],
        'milk': ['milk', 'dairy', 'cheese', 'butter', 'cream', 'whey', 'casein', 'lactose'],
        'eggs': ['egg', 'albumin', 'mayonnaise'],
        'wheat': ['wheat', 'flour', 'gluten', 'bread'],
        'soy': ['soy', 'soybean', 'tofu', 'miso', 'tempeh'],
        'fish': ['fish', 'salmon', 'tuna', 'cod', 'halibut'],
        'shellfish': ['shrimp', 'crab', 'lobster', 'shellfish', 'clam', 'oyster', 'scallop'],
        'sesame': ['sesame', 'tahini']
      };

      const patterns = allergenPatterns[allergen] || [allergen.toLowerCase()];
      for (const pattern of patterns) {
        if (ingredientsLower.includes(pattern)) {
          foundAllergens.push(allergen);
          break;
        }
      }
    }

    if (foundAllergens.length > 0) {
      console.warn('Shop Well: LEGACY ALLERGEN CHECK - Found:', foundAllergens);
      console.warn('Shop Well: Note: Enhanced AI analysis above provides more accurate results');
    } else if (allergies.length > 0) {
      console.log('Shop Well: Legacy check - No obvious allergens detected');
    }
  }

  async togglePanel() {
    console.log('Shop Well: Toggle panel requested');

    // Initialize panel if it doesn't exist
    if (!this.panel) {
      await this.initializePanel();
    }

    // If panel is visible, hide it
    if (this.panel && this.panel.isVisible) {
      this.panel.hide();
      return;
    }

    // If panel is not visible, analyze and show
    await this.analyzeAndShow();
  }

  setupEventListeners() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.command === 'toggle-panel') {
        // Handle async togglePanel() call
        this.togglePanel()
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            console.error('Shop Well: Toggle panel failed:', error);
            sendResponse({ success: false, error: error.message });
          });

        // Return true to indicate we will call sendResponse asynchronously
        return true;
      }
    });

    console.log('Shop Well: Event listeners set up');
  }
}

// Initialize when DOM is ready
function initializeShopWell() {
  const app = new ShopWellApp();
  app.init();
}

// Handle different document ready states
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeShopWell);
} else {
  // DOM is already ready
  initializeShopWell();
}