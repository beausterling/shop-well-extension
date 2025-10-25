// Shop Well Content Script
// Simplified: Only extracts product data from Amazon/Walmart pages
// AI analysis now happens in the side panel

import { AmazonParser } from './parsers/amazon.js';
import { WalmartParser } from './parsers/walmart.js';

class ProductExtractor {
  constructor() {
    this.parser = null;
    this.isProductPage = false;
    this.pageType = null; // 'pdp' or 'listing'
    this.listingProducts = []; // Array of products on listing page
  }

  init() {
    console.log('Shop Well: Content script initializing...');

    // Detect if we're on a product page or listing page
    this.isProductPage = this.detectProductPage();

    if (this.pageType === 'pdp') {
      console.log(`Shop Well: Detected ${this.parser.name || 'product'} detail page`);
      // Set up message listener for PDP
      this.setupMessageListener();
    } else if (this.pageType === 'listing') {
      console.log(`Shop Well: Detected ${this.parser.name || 'search'} listing page`);
      // Initialize listing mode with badges
      this.initListingMode();
    } else {
      console.log('Shop Well: Not a supported page type');
    }
  }

  detectProductPage() {
    console.log('Shop Well: detectProductPage() called for URL:', window.location.href);

    // Check for Product Detail Page (PDP) first
    console.log('Shop Well: Checking AmazonParser.isPDP()...');
    if (AmazonParser.isPDP()) {
      this.parser = AmazonParser;
      this.pageType = 'pdp';
      console.log('Shop Well: Detected Amazon PDP');
      return true;
    }

    console.log('Shop Well: Checking WalmartParser.isPDP()...');
    if (WalmartParser.isPDP()) {
      this.parser = WalmartParser;
      this.pageType = 'pdp';
      console.log('Shop Well: Detected Walmart PDP');
      return true;
    }

    // Check for Search/Listing Page
    console.log('Shop Well: Checking AmazonParser.isSearchPage()...');
    if (AmazonParser.isSearchPage()) {
      this.parser = AmazonParser;
      this.pageType = 'listing';
      console.log('Shop Well: Detected Amazon search page');
      return true;
    }

    console.log('Shop Well: Checking WalmartParser.isSearchPage()...');
    if (WalmartParser.isSearchPage()) {
      this.parser = WalmartParser;
      this.pageType = 'listing';
      console.log('Shop Well: Detected Walmart search page');
      return true;
    }

    console.log('Shop Well: No supported page type detected');
    return false;
  }

  extractProductData() {
    if (!this.parser || !this.isProductPage) {
      console.warn('Shop Well: Cannot extract data - not on a product page');
      return null;
    }

    console.log('Shop Well: Extracting product data...');

    try {
      const productData = this.parser.parse();

      if (!productData) {
        console.warn('Shop Well: Parser returned no data');
        return null;
      }

      console.log('Shop Well: Product data extracted successfully:', {
        title: productData.title?.substring(0, 50) + '...',
        hasIngredients: !!productData.ingredients,
        bulletCount: productData.bullets?.length || 0,
        price: productData.price
      });

      return productData;

    } catch (error) {
      console.error('Shop Well: Product extraction failed:', error);
      return null;
    }
  }

  initListingMode() {
    // Extract all products from search results
    this.listingProducts = this.parser.extractSearchProducts();
    console.log(`Shop Well: Found ${this.listingProducts.length} products on listing page`);

    if (this.listingProducts.length === 0) {
      console.warn('Shop Well: No products found on listing page');
      return;
    }

    // Import and initialize badge overlay
    // Note: We'll dynamically inject the overlay UI
    this.injectListingBadges();

    // Setup message listener for badge clicks
    this.setupListingMessageListener();
  }

  injectListingBadges() {
    console.log('Shop Well: Injecting product badges...');

    // We'll create this functionality in listing-overlay.js
    // For now, create a simple badge injector inline
    this.listingProducts.forEach((product, index) => {
      try {
        // Find the product card element
        let cardSelector;
        if (product.source === 'amazon_search') {
          cardSelector = `[data-asin="${product.id}"]`;
        } else if (product.source === 'walmart_search') {
          cardSelector = `[data-item-id="${product.id}"]`;
        }

        const card = document.querySelector(cardSelector);
        if (!card) {
          console.warn(`Shop Well: Could not find card for product ${product.id}`);
          return;
        }

        // Make card position relative for absolute badge positioning
        card.style.position = 'relative';

        // Create badge element
        const badge = document.createElement('div');
        badge.className = 'shop-well-badge';
        badge.setAttribute('data-product-index', index);
        badge.innerHTML = '🌿 Analyze';

        // Add click handler
        badge.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.handleBadgeClick(product);
        });

        // Inject badge into card
        card.appendChild(badge);

      } catch (error) {
        console.error(`Shop Well: Failed to inject badge for product ${product.id}:`, error);
      }
    });

    // Inject badge styles
    this.injectBadgeStyles();

    console.log(`Shop Well: Injected ${this.listingProducts.length} badges`);
  }

  injectBadgeStyles() {
    // Check if styles already injected
    if (document.getElementById('shop-well-badge-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'shop-well-badge-styles';
    style.textContent = `
      .shop-well-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 1000;
        background: linear-gradient(135deg, #6BAF7A, #65AEDD);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: transform 0.2s, background 0.2s;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .shop-well-badge:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }

      .shop-well-badge.analyzing {
        background: linear-gradient(135deg, #F2C94C, #F2A94C);
        cursor: wait;
      }

      .shop-well-badge.analyzed {
        background: linear-gradient(135deg, #6BAF7A, #4A9D5F);
      }
    `;
    document.head.appendChild(style);
  }

  handleBadgeClick(product) {
    console.log('Shop Well: Badge clicked for product:', product.id);

    // Visual feedback - stay in analyzing state
    const badge = document.querySelector(`.shop-well-badge[data-product-index="${product.position}"]`);
    if (badge) {
      badge.classList.add('analyzing');
      badge.innerHTML = '⏳ Analyzing...';
    }

    // Send message to background to open side panel and analyze
    chrome.runtime.sendMessage({
      type: 'analyze-listing-product',
      productData: product
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Shop Well: Failed to send listing product message:', chrome.runtime.lastError);
        if (badge) {
          badge.classList.remove('analyzing');
          badge.innerHTML = '❌ Error';
        }
      } else {
        console.log('Shop Well: Listing product analysis request sent to background');
        // Badge stays in "analyzing" state - check side panel for results
      }
    });
  }

  setupListingMessageListener() {
    // Listen for messages from background/side panel
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Shop Well: Listing message received:', message.type);

      if (message.type === 'get-listing-products') {
        sendResponse({
          success: true,
          products: this.listingProducts
        });
        return true;
      }

      return false;
    });

    console.log('Shop Well: Listing message listener set up');
  }

  setupMessageListener() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Shop Well: Message received:', message.command);

      if (message.command === 'extract-product-data') {
        const productData = this.extractProductData();

        if (productData) {
          sendResponse({
            success: true,
            productData: productData
          });
        } else {
          sendResponse({
            success: false,
            error: 'Failed to extract product data'
          });
        }

        // Return true to indicate we'll send response asynchronously
        return true;
      }

      return false;
    });

    console.log('Shop Well: Message listener set up');
  }
}

// Initialize when DOM is ready
function initializeExtractor() {
  const extractor = new ProductExtractor();
  extractor.init();
}

// Handle different document ready states
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtractor);
} else {
  // DOM is already ready
  initializeExtractor();
}
