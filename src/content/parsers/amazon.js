// Amazon Product Page Parser

import { getText, getTextArray, extractPrice, extractIngredients } from '../utils/dom.js';

export class AmazonParser {
  /**
   * Check if current page is an Amazon Product Detail Page
   * @returns {boolean}
   */
  static isPDP() {
    const pathname = window.location.pathname;
    return pathname.includes('/dp/') ||
           pathname.includes('/gp/product/') ||
           pathname.includes('/product/');
  }

  /**
   * Check if current page is an Amazon Search/Listing Page
   * @returns {boolean}
   */
  static isSearchPage() {
    const pathname = window.location.pathname;
    const search = window.location.search;
    return pathname.includes('/s/') ||
           pathname.includes('/s?') ||
           search.includes('?k=') ||
           pathname.match(/\/[^/]+\/s\?k=/);  // Pattern like /milk/s?k=milk
  }

  /**
   * Extract product data from Amazon PDP
   * @returns {Object|null} Parsed product data or null if extraction fails
   */
  static parse() {
    try {
      console.log('Shop Well: Parsing Amazon product page...');

      const data = {
        site: 'amazon',
        url: window.location.href,
        title: this.extractTitle(),
        bullets: this.extractBullets(),
        description: this.extractDescription(),
        ingredients: this.extractIngredients(),
        price: this.extractPrice(),
        reviews: this.extractReviews()
      };

      console.log('Shop Well: Amazon data extracted:', data);
      return data;

    } catch (error) {
      console.error('Shop Well: Amazon parsing error:', error);
      return null;
    }
  }

  /**
   * Extract product title
   * @returns {string}
   */
  static extractTitle() {
    const titleSelectors = [
      '#productTitle',
      'h1.a-size-large',
      'h1[data-automation-id="product-title"]',
      '.product-title',
      'h1'
    ];

    const title = getText(titleSelectors);
    console.log('Shop Well: Amazon title:', title);
    return title;
  }

  /**
   * Extract product feature bullets
   * @returns {string[]}
   */
  static extractBullets() {
    const bulletSelectors = [
      '#feature-bullets ul li span',
      '#feature-bullets li',
      '.a-unordered-list.a-vertical.a-spacing-mini li',
      '.a-unordered-list.a-vertical li span',
      '[data-feature-name="featurebullets"] li'
    ];

    const bullets = getTextArray(bulletSelectors, 10);
    console.log('Shop Well: Amazon bullets:', bullets);
    return bullets;
  }

  /**
   * Extract product description
   * @returns {string}
   */
  static extractDescription() {
    const descriptionSelectors = [
      '#productDescription p',
      '#productDescription',
      '#aplus_feature_div',
      '[data-feature-name="productDescription"]',
      '.product-description',
      '.a-expander-content'
    ];

    const description = getText(descriptionSelectors);
    console.log('Shop Well: Amazon description length:', description.length);
    return description.substring(0, 1000); // Limit for AI processing
  }

  /**
   * Extract ingredients (critical for allergen detection)
   * @returns {string}
   */
  static extractIngredients() {
    // Amazon-specific ingredient selectors
    const ingredientSelectors = [
      '[data-feature-name="ingredients"]',
      '#ingredients',
      '.ingredients',
      '.a-expander-content:contains("Ingredients")',
      '[data-feature-name="productDetails"] tr:contains("Ingredients") td',
      '#detailBullets_feature_div tr:contains("Ingredients") td',
      '.pdTab[data-tab="ingredients"]',
      // Generic patterns
      '*:contains("Ingredients:") + *',
      '*:contains("INGREDIENTS:") + *'
    ];

    const ingredients = extractIngredients() || getText(ingredientSelectors);
    console.log('Shop Well: Amazon ingredients found:', !!ingredients);
    return ingredients;
  }

  /**
   * Extract product price
   * @returns {string}
   */
  static extractPrice() {
    // Ultra-specific selectors targeting ONLY the main product price display
    // Ordered from most specific to most general
    const priceSelectors = [
      // Apex price (current standard, 2023-2024)
      '#apex_desktop .a-price.apexPriceToPay .a-offscreen',
      '#apex_offerDisplay_desktop .a-price.apexPriceToPay .a-offscreen',
      '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
      '.a-price.apexPriceToPay .a-offscreen',

      // Core price display containers
      '#corePriceDisplay_desktop_feature_div .a-price:not([data-a-color="secondary"]) .a-offscreen',
      '#corePrice_desktop .a-price:not([data-a-color="secondary"]) .a-offscreen',
      '#corePrice_feature_div .a-price:not([data-a-color="secondary"]) .a-offscreen',

      // Deal/Sale price (specific container)
      '#priceblock_dealprice',
      '#priceblock_ourprice',

      // Buybox price
      '#price_inside_buybox',

      // General price fallbacks with filters
      // Note: These are broad and extractPrice() will apply low-price filter
      '.a-price-whole',
      '[data-testid="price"]',
      '.a-price .a-offscreen'  // Most broad - will be filtered aggressively
    ];

    const price = extractPrice(priceSelectors);
    console.log('Shop Well: Amazon final extracted price:', price);
    return price;
  }

  /**
   * Extract sample reviews (for sentiment/themes)
   * @returns {string[]}
   */
  static extractReviews() {
    const reviewSelectors = [
      '[data-hook="review-body"] span',
      '.review-text-content span',
      '.cr-original-review-text',
      '.review-text',
      '[data-testid="review-text"]'
    ];

    const reviews = getTextArray(reviewSelectors, 5);
    console.log('Shop Well: Amazon reviews found:', reviews.length);
    return reviews;
  }

  /**
   * Get debugging information about found elements
   * @returns {Object}
   */
  static getDebugInfo() {
    return {
      title: !!this.extractTitle(),
      bullets: this.extractBullets().length,
      description: !!this.extractDescription(),
      ingredients: !!this.extractIngredients(),
      price: !!this.extractPrice(),
      reviews: this.extractReviews().length,
      url: window.location.href
    };
  }

  /**
   * Extract product cards from Amazon search/listing page
   * @returns {Array} Array of product objects with basic info
   */
  static extractSearchProducts() {
    const products = [];

    try {
      // Amazon search results use data-component-type="s-search-result" attribute
      const productCards = document.querySelectorAll('[data-component-type="s-search-result"]');
      console.log(`Shop Well: Found ${productCards.length} Amazon product cards`);

      productCards.forEach((card, index) => {
        try {
          const asin = card.getAttribute('data-asin');

          // Title extraction - Amazon changed structure, title now in h2 > span (not h2 > a > span)
          const titleSelectors = [
            'h2 span.a-size-base-plus',
            'h2 span.a-size-medium',
            'h2 span',
            'h2 a span', // Fallback for old structure
            'h2'
          ];
          let title = null;
          for (const selector of titleSelectors) {
            const el = card.querySelector(selector);
            if (el && el.textContent && el.textContent.trim()) {
              title = el.textContent.trim();
              break;
            }
          }

          // Link extraction - Try multiple locations
          const linkSelectors = [
            'h2 a.a-link-normal', // Old structure
            '.s-product-image-container a', // Image link
            '.puis-card-container a', // Card container link
            'a.a-link-normal.s-no-outline', // Alternative link
            'a[href*="/dp/"]' // Any link with /dp/ in it
          ];
          let linkHref = null;
          for (const selector of linkSelectors) {
            const linkEl = card.querySelector(selector);
            if (linkEl && linkEl.href && !linkEl.href.includes('#')) {
              linkHref = linkEl.href;
              break;
            }
          }

          // Price extraction (Amazon has complex price structures)
          // Try multiple strategies to get the MAIN price (not unit price)
          let price = null;

          // Strategy 1: Use .a-offscreen which contains the full price text (most reliable)
          const offscreenPrice = card.querySelector('.a-price:not([data-a-strike="true"]) .a-offscreen')?.textContent?.trim();
          if (offscreenPrice && !offscreenPrice.includes('/') && !offscreenPrice.toLowerCase().includes('per')) {
            // Parse the price value to check if it's reasonable
            const priceMatch = offscreenPrice.match(/\$[\d,]+\.?\d*/);
            if (priceMatch) {
              const priceValue = parseFloat(priceMatch[0].replace(/[$,]/g, ''));
              // Skip suspiciously low prices (likely unit prices like $0.02)
              if (priceValue >= 0.99 || priceValue === 0) {
                price = priceMatch[0];
                console.log(`Shop Well: Search card price (offscreen): ${price}`);
              } else {
                console.log(`Shop Well: Rejected low price from offscreen: ${priceMatch[0]} (likely unit price)`);
              }
            }
          }

          // Strategy 2: Fallback to constructing from parts if Strategy 1 failed
          if (!price) {
            const priceWhole = card.querySelector('.a-price:not([data-a-strike="true"]) .a-price-whole')?.textContent;
            const priceFraction = card.querySelector('.a-price:not([data-a-strike="true"]) .a-price-fraction')?.textContent;
            const priceSymbol = card.querySelector('.a-price:not([data-a-strike="true"]) .a-price-symbol')?.textContent || '$';
            if (priceWhole) {
              const constructedPrice = `${priceSymbol}${priceWhole}${priceFraction || ''}`.trim();
              const priceValue = parseFloat(priceWhole.replace(/,/g, ''));
              // Skip suspiciously low prices
              if (priceValue >= 0.99 || priceValue === 0) {
                price = constructedPrice;
                console.log(`Shop Well: Search card price (constructed): ${price}`);
              } else {
                console.log(`Shop Well: Rejected low price from parts: ${constructedPrice} (likely unit price)`);
              }
            }
          }

          // Image
          const image = card.querySelector('img.s-image')?.src;

          // Rating
          const ratingEl = card.querySelector('[aria-label*="out of"]');
          const rating = ratingEl?.getAttribute('aria-label')?.match(/[\d.]+/)?.[0];

          // More lenient: only require ASIN (can create URL from it)
          if (asin) {
            products.push({
              id: asin,
              title: title || 'Unknown Product',
              price: price,
              image: image,
              url: linkHref || `https://www.amazon.com/dp/${asin}`,
              rating: rating,
              position: index,
              source: 'amazon_search',
              _cardElement: card  // Store DOM element reference for badge injection
            });
          } else {
            console.warn(`Shop Well: Product card ${index} missing ASIN`);
          }
        } catch (err) {
          console.warn('Shop Well: Failed to extract product card:', err);
        }
      });

      console.log(`Shop Well: Successfully extracted ${products.length} Amazon products`);

      // Debug logging for troubleshooting
      if (products.length === 0 && productCards.length > 0) {
        console.warn('Shop Well: Found product cards but extracted 0 products - DOM selectors may need updating');
        console.warn('Shop Well: First card HTML sample:', productCards[0]?.outerHTML?.substring(0, 500));
      }
    } catch (error) {
      console.error('Shop Well: Amazon search extraction failed:', error);
    }

    return products;
  }
}