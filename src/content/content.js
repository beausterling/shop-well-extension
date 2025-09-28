// Shop Well Content Script

import { AmazonParser } from './parsers/amazon.js';
import { WalmartParser } from './parsers/walmart.js';

// Main application class
class ShopWellApp {
  constructor() {
    this.panel = null;
    this.parser = null;
    this.settings = {};
    this.isAnalyzing = false;
  }

  async init() {
    console.log('Shop Well initializing...');

    try {
      // Load user settings including allergies
      this.settings = await chrome.storage.local.get(['condition', 'autoshow', 'allergies']);
      this.settings.condition = this.settings.condition || 'POTS';
      this.settings.autoshow = this.settings.autoshow !== false;
      this.settings.allergies = this.settings.allergies || [];

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
    // Placeholder for panel initialization
    // Will be implemented in Phase 3
    console.log('Shop Well: Panel initialization placeholder');
  }

  async analyzeAndShow() {
    if (this.isAnalyzing) return;

    this.isAnalyzing = true;
    console.log('Shop Well: Starting product analysis...');

    try {
      // Parse product data
      const productData = this.parser.parse();

      if (!productData) {
        console.warn('Shop Well: Failed to parse product data');
        return;
      }

      console.log('Shop Well: Product data parsed successfully');
      console.log('Shop Well: Settings:', {
        condition: this.settings.condition,
        allergies: this.settings.allergies,
        allergyCount: this.settings.allergies.length
      });

      // Log what we extracted for debugging
      console.log('Shop Well: Extracted data summary:', {
        title: !!productData.title,
        bulletCount: productData.bullets?.length || 0,
        hasDescription: !!productData.description,
        hasIngredients: !!productData.ingredients,
        hasPrice: !!productData.price,
        reviewCount: productData.reviews?.length || 0
      });

      // Phase 2 placeholder: AI analysis will happen here
      console.log('Shop Well: AI analysis will be implemented in Phase 2');

      // For now, check for obvious allergens in ingredients
      if (productData.ingredients && this.settings.allergies.length > 0) {
        this.checkBasicAllergens(productData.ingredients);
      }

    } catch (error) {
      console.error('Shop Well analysis failed:', error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Basic allergen checking (will be enhanced with AI in Phase 2)
   * @param {string} ingredients
   */
  checkBasicAllergens(ingredients) {
    const foundAllergens = [];
    const ingredientsLower = ingredients.toLowerCase();

    for (const allergen of this.settings.allergies) {
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

      const patterns = allergenPatterns[allergen] || [allergen];
      for (const pattern of patterns) {
        if (ingredientsLower.includes(pattern)) {
          foundAllergens.push(allergen);
          break;
        }
      }
    }

    if (foundAllergens.length > 0) {
      console.warn('Shop Well: ALLERGEN ALERT! Found:', foundAllergens);
      console.warn('Shop Well: Please verify ingredients manually');
    } else if (this.settings.allergies.length > 0) {
      console.log('Shop Well: No obvious allergens detected (basic check)');
    }
  }

  async togglePanel() {
    console.log('Shop Well: Toggle panel requested');

    if (!this.panel) {
      await this.analyzeAndShow();
    }

    // Toggle logic will be implemented in Phase 3
    console.log('Shop Well: Panel toggle placeholder');
  }

  setupEventListeners() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.command === 'toggle-panel') {
        this.togglePanel();
        sendResponse({ success: true });
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