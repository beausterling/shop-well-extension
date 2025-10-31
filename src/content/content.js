// Shop Well Content Script
// Simplified: Only extracts product data from Amazon/Walmart pages
// AI analysis now happens in the side panel

import { AmazonParser } from './parsers/amazon.js';
import { WalmartParser } from './parsers/walmart.js';

// Debounce utility to prevent excessive processing during rapid DOM changes
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

class ProductExtractor {
  constructor() {
    this.parser = null;
    this.isProductPage = false;
    this.pageType = null; // 'pdp' or 'listing'
    this.listingProducts = []; // Array of products on listing page
    this.mutationObserver = null; // Observer for dynamic content
    this.urlPoller = null; // Interval ID for URL polling
    this.lastUrl = window.location.href; // Track last known URL
  }

  init() {
    console.log('Shop Well: Content script initializing...');

    // Detect if we're on a product page or listing page
    this.isProductPage = this.detectProductPage();

    if (this.pageType === 'pdp') {
      const parserName = this.parser === WalmartParser ? 'Walmart' :
                         this.parser === AmazonParser ? 'Amazon' : 'unknown';
      console.log(`Shop Well: Detected ${parserName} detail page`);
      // Set up message listener for PDP
      this.setupMessageListener();
    } else if (this.pageType === 'listing') {
      const parserName = this.parser === WalmartParser ? 'Walmart' :
                         this.parser === AmazonParser ? 'Amazon' : 'unknown';
      console.log(`Shop Well: Detected ${parserName} listing page`);
      // Initialize listing mode with badges
      this.initListingMode();
    } else {
      console.log('Shop Well: Not a supported page type');
    }

    // Set up SPA navigation detection to handle URL changes without page reload
    this.setupSPANavigation();
  }

  reinit() {
    console.log('Shop Well: URL changed, re-detecting page type...');

    // Update last known URL to current (prevents polling from re-triggering)
    this.lastUrl = window.location.href;

    // Reset all badge states from previous page to default "Analyze" state
    const allBadges = document.querySelectorAll('.shop-well-badge');
    allBadges.forEach(badge => {
      badge.classList.remove('analyzing', 'completed');
      badge.textContent = '🌿 Analyze';
    });
    if (allBadges.length > 0) {
      console.log(`Shop Well: Reset ${allBadges.length} badge states to default`);
    }

    // Stop existing mutation observer if running
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // Clear existing state
    this.listingProducts = [];
    this.parser = null;
    this.isProductPage = false;
    this.pageType = null;

    // Re-detect page type
    this.isProductPage = this.detectProductPage();

    if (this.pageType === 'pdp') {
      const parserName = this.parser === WalmartParser ? 'Walmart' :
                         this.parser === AmazonParser ? 'Amazon' : 'unknown';
      console.log(`Shop Well: Re-detected ${parserName} detail page`);
      // PDP message listener is already set up globally, no need to re-add
    } else if (this.pageType === 'listing') {
      const parserName = this.parser === WalmartParser ? 'Walmart' :
                         this.parser === AmazonParser ? 'Amazon' : 'unknown';
      console.log(`Shop Well: Re-detected ${parserName} listing page`);
      // Initialize listing mode with badges
      this.initListingMode();
    } else {
      console.log('Shop Well: Not a supported page type after navigation');
    }
  }

  setupSPANavigation() {
    // Intercept history.pushState to detect SPA navigation (standard SPAs)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      console.log('Shop Well: URL changed (detected via history.pushState)');
      setTimeout(() => this.reinit(), 100);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      console.log('Shop Well: URL changed (detected via history.replaceState)');
      setTimeout(() => this.reinit(), 100);
    };

    // Also listen for popstate (back/forward button)
    window.addEventListener('popstate', () => {
      console.log('Shop Well: URL changed (detected via popstate)');
      setTimeout(() => this.reinit(), 100);
    });

    // URL Polling Fallback for Next.js apps (like Walmart) that don't use standard History API
    // Clear any existing poller first
    if (this.urlPoller) {
      clearInterval(this.urlPoller);
    }

    // Poll every 500ms to detect URL changes
    this.urlPoller = setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== this.lastUrl) {
        console.log('Shop Well: URL changed (detected via polling):', this.lastUrl, '→', currentUrl);
        this.lastUrl = currentUrl;
        this.reinit();
      }
    }, 500);

    console.log('Shop Well: SPA navigation detection enabled (with 500ms URL polling for Next.js)');
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
      console.warn('Shop Well: No products found initially - will watch for dynamic loading');
    } else {
      // Only inject badges if we have products initially
      this.injectListingBadges();

      // Setup message listener for badge clicks
      this.setupListingMessageListener();
    }

    // ALWAYS set up MutationObserver to watch for dynamically loaded products
    // This is critical for SPAs where products load asynchronously
    this.setupDynamicBadgeInjection();
  }

  setupDynamicBadgeInjection() {
    console.log('Shop Well: Setting up dynamic badge injection...');

    // Walmart-specific retry logic for delayed product loading
    if (this.listingProducts.length === 0 && this.parser === WalmartParser) {
      console.log('Shop Well: No Walmart products found initially, scheduling retry in 1 second...');
      setTimeout(() => {
        console.log('Shop Well: Retrying Walmart product extraction...');
        const retryProducts = this.parser.extractSearchProducts();

        if (retryProducts.length > 0) {
          console.log(`Shop Well: Retry successful! Found ${retryProducts.length} products`);
          this.listingProducts = retryProducts;
          this.injectListingBadges();
          this.setupListingMessageListener();
        } else {
          console.warn('Shop Well: Retry failed - still no products found');
        }
      }, 1000);
    }

    // Debounced handler for processing new products
    const handleNewProducts = debounce(() => {
      console.log('Shop Well: DOM changed, checking for new products...');

      // Re-extract products from the page
      const newProducts = this.parser.extractSearchProducts();

      if (newProducts.length > this.listingProducts.length) {
        console.log(`Shop Well: Found ${newProducts.length - this.listingProducts.length} new products`);

        // Check if this is the first time we're getting products
        const isFirstProducts = this.listingProducts.length === 0 && newProducts.length > 0;

        this.listingProducts = newProducts;
        this.injectListingBadges();

        // Set up message listener if this is the first time we have products
        if (isFirstProducts) {
          this.setupListingMessageListener();
        }
      }
    }, 300); // Wait 300ms after last DOM change before processing

    // Find the container that holds product cards
    let searchContainer = null;

    if (this.listingProducts.length > 0) {
      // If we have products, use the first product card to find the container
      const firstProductCard = this.listingProducts[0]._cardElement;
      searchContainer = firstProductCard.parentElement;
      while (searchContainer && searchContainer !== document.body) {
        // Look for container with multiple product cards
        const productCards = searchContainer.querySelectorAll('[data-item-id], [data-component-type="s-search-result"]');
        if (productCards.length > 1) {
          break;
        }
        searchContainer = searchContainer.parentElement;
      }
    } else {
      // No products yet - observe the main content area
      // Look for common search result container patterns (Amazon, Walmart, generic)
      searchContainer = document.querySelector(
        '[data-testid="search-results"], ' +         // Generic test ID
        '#searchProductResult, ' +                   // Amazon
        '#search-result-main-content, ' +            // Walmart search
        '[class*="search-result"], ' +               // Walmart variations
        '[class*="SearchResult"], ' +                // Walmart capitalized
        '[class*="product-list"], ' +                // Generic product list
        'main, ' +                                   // Generic main element
        '[role="main"]'                              // ARIA main landmark
      );
      console.log('Shop Well: No products yet, observing main content area for dynamic loading');
    }

    if (!searchContainer || searchContainer === document.body) {
      console.warn('Shop Well: Could not find search results container for observation, using document.body');
      searchContainer = document.body;
    }

    console.log('Shop Well: Observing container for new products:', searchContainer.tagName, searchContainer.className);

    // Create MutationObserver to watch for new product cards
    this.mutationObserver = new MutationObserver((mutations) => {
      // Check if any mutations added new product card elements
      const hasNewProducts = mutations.some(mutation => {
        return Array.from(mutation.addedNodes).some(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if added node is a product card or contains product cards
            return node.hasAttribute?.('data-item-id') ||
                   node.hasAttribute?.('data-component-type') ||
                   node.querySelector?.('[data-item-id], [data-component-type="s-search-result"]');
          }
          return false;
        });
      });

      if (hasNewProducts) {
        handleNewProducts();
      }
    });

    // Start observing with configuration
    this.mutationObserver.observe(searchContainer, {
      childList: true,      // Watch for added/removed children
      subtree: true,        // Watch all descendants
      attributes: false,    // Don't watch attribute changes
      characterData: false  // Don't watch text content changes
    });

    console.log('Shop Well: MutationObserver active for dynamic badge injection');
  }

  injectListingBadges() {
    console.log('Shop Well: Injecting product badges...');

    let injectedCount = 0;

    // We'll create this functionality in listing-overlay.js
    // For now, create a simple badge injector inline
    this.listingProducts.forEach((product, index) => {
      try {
        // Use stored card element reference instead of re-querying DOM
        const card = product._cardElement;
        if (!card || !card.isConnected) {
          console.warn(`Shop Well: Card element removed or unavailable for product ${product.id}`);
          return;
        }

        // Skip if badge already exists on this card
        if (card.hasAttribute('data-shop-well-badged')) {
          return;
        }

        // Mark card as badged to prevent duplicates
        card.setAttribute('data-shop-well-badged', 'true');

        // Make card position relative for absolute badge positioning
        // Using cssText for more reliable !important application
        card.style.cssText += '; position: relative !important; overflow: visible !important;';

        // Create badge element
        const badge = document.createElement('div');
        badge.className = 'shop-well-badge';
        badge.setAttribute('data-product-asin', product.id);
        badge.textContent = 'Analyze';

        // Add click handler - store ASIN instead of full product object
        // This ensures we always use the current product data even if the array is updated
        badge.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.handleBadgeClick(product.id);
        });

        // Inject badge into card
        card.appendChild(badge);
        injectedCount++;

        // Debug: Verify badge visibility (only log first 3 to avoid spam)
        if (index < 3) {
          setTimeout(() => {
            const rect = badge.getBoundingClientRect();
            const badgeStyle = window.getComputedStyle(badge);
            const cardStyle = window.getComputedStyle(card);

            console.log(`Shop Well: Badge ${index} visibility check:`, {
              badgeInDOM: document.body.contains(badge),
              badgeVisible: rect.width > 0 && rect.height > 0,
              badgeRect: { w: rect.width, h: rect.height, top: rect.top, left: rect.left },
              badgePosition: badgeStyle.position,
              badgeZIndex: badgeStyle.zIndex,
              badgeDisplay: badgeStyle.display,
              cardPosition: cardStyle.position,
              cardOverflow: cardStyle.overflow
            });
          }, 100);
        }

      } catch (error) {
        console.error(`Shop Well: Failed to inject badge for product ${product.id}:`, error);
      }
    });

    // Inject badge styles
    this.injectBadgeStyles();

    console.log(`Shop Well: Injected ${injectedCount} new badges (${this.listingProducts.length} total products)`);
  }

  injectBadgeStyles() {
    // Check if styles already injected
    if (document.getElementById('shop-well-badge-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'shop-well-badge-styles';
    style.textContent = `
      /* Ensure all badged product cards have proper positioning */
      [data-item-id][data-shop-well-badged],
      [data-component-type="s-search-result"][data-shop-well-badged] {
        position: relative !important;
        overflow: visible !important;
      }

      .shop-well-badge {
        position: absolute !important;
        top: 8px !important;
        right: 8px !important;
        z-index: 2147483647 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        background: #E9DFC9;
        color: #3D3D3D;
        padding: 6px 14px;
        border: 2px solid #776B63;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        pointer-events: auto !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        transition: all 0.25s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .shop-well-badge::before {
        content: '🌿';
        font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
        margin-right: 5px;
      }

      .shop-well-badge:hover {
        background: linear-gradient(135deg, #6BAF7A, #65AEDD);
        color: white;
        border-color: #6BAF7A;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(107, 175, 122, 0.3);
      }

      .shop-well-badge:hover::before {
        content: '🌼';
      }

      .shop-well-badge.analyzing {
        background: linear-gradient(135deg, #F2C94C, #F2A94C);
        color: white;
        border-color: #F2C94C;
        cursor: wait;
      }

      .shop-well-badge.analyzing::before {
        content: '⏳';
      }

      .shop-well-badge.analyzed {
        background: linear-gradient(135deg, #6BAF7A, #4A9D5F);
        color: white;
        border-color: #6BAF7A;
      }

      .shop-well-badge.analyzed::before {
        content: '🌿';
      }

      .shop-well-badge.completed {
        background: white !important;
        color: #6BAF7A !important;
        border-color: #6BAF7A !important;
        cursor: pointer;
      }

      .shop-well-badge.completed::before {
        content: '👉';
      }
    `;
    document.head.appendChild(style);
  }

  handleBadgeClick(productId) {
    console.log('Shop Well: Badge clicked for product ASIN:', productId);

    // Look up the current product data by ASIN from the listingProducts array
    // This ensures we always use the most up-to-date product data
    const product = this.listingProducts.find(p => p.id === productId);

    if (!product) {
      console.error('Shop Well: Product not found in current listing:', productId);
      return;
    }

    const badge = document.querySelector(`.shop-well-badge[data-product-asin="${productId}"]`);

    // Always run fresh analysis (no caching)
    console.log('Shop Well: Starting fresh analysis');
    if (badge) {
      badge.classList.add('analyzing');
      badge.textContent = 'Analyzing...';
    }

    // Check if extension context is still valid (handles extension reload scenario)
    if (!chrome.runtime?.id) {
      console.warn('Shop Well: Extension context invalidated. Please refresh the page.');
      if (badge) {
        badge.classList.remove('analyzing');
        badge.innerHTML = '🔄 Refresh Page';
        badge.title = 'Extension was reloaded. Please refresh this page to analyze products.';
        badge.style.cursor = 'help';
      }
      return;
    }

    // Send message to background to open side panel and analyze
    // Wrap in try-catch to catch any synchronous chrome API errors
    try {
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
    } catch (error) {
      console.error('Shop Well: Extension context error:', error);
      if (badge) {
        badge.classList.remove('analyzing');
        badge.innerHTML = '🔄 Refresh Page';
        badge.title = 'Extension was reloaded. Please refresh this page.';
        badge.style.cursor = 'help';
      }
    }
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

      if (message.type === 'badge-analysis-complete' && message.productId !== undefined) {
        // Update badge to "completed" state (white bg, green text, 👉 Look!)
        const badge = document.querySelector(`.shop-well-badge[data-product-asin="${message.productId}"]`);
        if (badge) {
          badge.classList.remove('analyzing');
          badge.classList.add('completed');
          badge.textContent = 'Look!';
          console.log(`Shop Well: Badge for product ${message.productId} marked as completed`);
        } else {
          console.warn(`Shop Well: Could not find badge for product ${message.productId}`);
        }
        return false;
      }

      if (message.type === 'badge-analysis-cancelled' && message.productId !== undefined) {
        // Revert badge to normal state
        const badge = document.querySelector(`.shop-well-badge[data-product-asin="${message.productId}"]`);
        if (badge) {
          badge.classList.remove('analyzing', 'completed');
          badge.textContent = 'Analyze';
          console.log(`Shop Well: Badge for product ${message.productId} reverted to normal state`);
        }
        return false;
      }

      if (message.type === 'side-panel-closed') {
        // Revert all completed badges to normal state when side panel closes
        console.log('Shop Well: Side panel closed, reverting all completed badges');
        const completedBadges = document.querySelectorAll('.shop-well-badge.completed');
        completedBadges.forEach(badge => {
          badge.classList.remove('completed');
          badge.textContent = 'Analyze';
        });
        return false;
      }

      if (message.type === 'clear-all-active-badges') {
        // Clear "Look!" state from all badges (used when starting new analysis or closing side panel)
        console.log('Shop Well: Clearing all active badge states');
        const completedBadges = document.querySelectorAll('.shop-well-badge.completed');
        completedBadges.forEach(badge => {
          badge.classList.remove('completed');
          badge.textContent = 'Analyze';
        });
        return false;
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
