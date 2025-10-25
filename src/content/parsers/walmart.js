// Walmart Product Page Parser

import { getText, getTextArray, extractPrice, extractIngredients } from '../utils/dom.js';

export class WalmartParser {
  /**
   * Check if current page is a Walmart Product Detail Page
   * @returns {boolean}
   */
  static isPDP() {
    const pathname = window.location.pathname;
    return pathname.includes('/ip/') ||
           (window.location.hostname.includes('walmart.com') &&
            pathname.includes('/product/'));
  }

  /**
   * Check if current page is a Walmart Search/Listing Page
   * @returns {boolean}
   */
  static isSearchPage() {
    const pathname = window.location.pathname;
    const search = window.location.search;
    const hostname = window.location.hostname;

    console.log('Shop Well: WalmartParser.isSearchPage() check:', {
      hostname,
      pathname,
      search,
      pathnameIncludesSearch: pathname.includes('/search'),
      searchIncludesQ: search.includes('?q='),
      fullUrl: window.location.href
    });

    const isSearch = pathname.includes('/search') && search.includes('?q=');
    console.log('Shop Well: WalmartParser.isSearchPage() result:', isSearch);

    return isSearch;
  }

  /**
   * Extract product data from Walmart PDP
   * @returns {Object|null} Parsed product data or null if extraction fails
   */
  static parse() {
    try {
      console.log('Shop Well: Parsing Walmart product page...');

      const data = {
        site: 'walmart',
        url: window.location.href,
        title: this.extractTitle(),
        bullets: this.extractBullets(),
        description: this.extractDescription(),
        ingredients: this.extractIngredients(),
        price: this.extractPrice(),
        reviews: this.extractReviews()
      };

      console.log('Shop Well: Walmart data extracted:', data);
      return data;

    } catch (error) {
      console.error('Shop Well: Walmart parsing error:', error);
      return null;
    }
  }

  /**
   * Extract product title
   * @returns {string}
   */
  static extractTitle() {
    const titleSelectors = [
      'h1[data-automation-id="product-title"]',
      'h1[itemprop="name"]',
      '.prod-ProductTitle',
      '.product-title',
      'h1',
      '[data-testid="product-title"]'
    ];

    const title = getText(titleSelectors);
    console.log('Shop Well: Walmart title:', title);
    return title;
  }

  /**
   * Extract product highlights/features
   * @returns {string[]}
   */
  static extractBullets() {
    const bulletSelectors = [
      '[data-testid="product-highlights"] li',
      '[data-automation-id="product-highlights"] li',
      '.product-highlights li',
      '.about-item li',
      '.product-features li',
      '[data-testid="product-features"] li'
    ];

    const bullets = getTextArray(bulletSelectors, 10);
    console.log('Shop Well: Walmart bullets:', bullets);
    return bullets;
  }

  /**
   * Extract product description
   * @returns {string}
   */
  static extractDescription() {
    const descriptionSelectors = [
      '[data-testid="product-description"]',
      '[data-automation-id="product-description"]',
      '.about-desc',
      '.product-description',
      '.product-details-section',
      '.expandable-text'
    ];

    const description = getText(descriptionSelectors);
    console.log('Shop Well: Walmart description length:', description.length);
    return description.substring(0, 1000); // Limit for AI processing
  }

  /**
   * Extract ingredients (critical for allergen detection)
   * @returns {string}
   */
  static extractIngredients() {
    // Walmart-specific ingredient selectors
    const ingredientSelectors = [
      '[data-testid="nutrition-facts"] .ingredients',
      '.nutrition-facts .ingredients',
      '.product-ingredients',
      '[aria-label*="Ingredients"]',
      '.ingredient-list',
      // Look in specifications table
      '.specifications-container tr:contains("Ingredients") td',
      '.product-details tr:contains("Ingredients") td',
      // Generic patterns
      '*:contains("Ingredients:") + *',
      '*:contains("INGREDIENTS:") + *'
    ];

    const ingredients = extractIngredients() || getText(ingredientSelectors);
    console.log('Shop Well: Walmart ingredients found:', !!ingredients);
    return ingredients;
  }

  /**
   * Extract product price
   * @returns {string}
   */
  static extractPrice() {
    const priceSelectors = [
      '[itemprop="price"]',
      '.price-now',
      '[data-testid="price-now"]',
      '.price-current',
      '.price-display',
      '[data-automation-id="product-price"]',
      '.price-group .price'
    ];

    const price = extractPrice(priceSelectors);
    console.log('Shop Well: Walmart price:', price);
    return price;
  }

  /**
   * Extract sample reviews (for sentiment/themes)
   * @returns {string[]}
   */
  static extractReviews() {
    const reviewSelectors = [
      '[data-testid="review-text"]',
      '.review-text',
      '.review-body',
      '[data-automation-id="review-text"]',
      '.review-content',
      '.customer-review-text'
    ];

    const reviews = getTextArray(reviewSelectors, 5);
    console.log('Shop Well: Walmart reviews found:', reviews.length);
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
   * Extract product cards from Walmart search/listing page
   * @returns {Array} Array of product objects with basic info
   */
  static extractSearchProducts() {
    const products = [];

    try {
      // Walmart search results use data-item-id attribute
      const productCards = document.querySelectorAll('[data-item-id]');
      console.log(`Shop Well: Found ${productCards.length} Walmart product cards`);

      productCards.forEach((card, index) => {
        try {
          const itemId = card.getAttribute('data-item-id');

          // Title and link
          const link = card.querySelector('a[link-identifier="itemTitle"], a[data-automation-id="product-title"]');
          const title = link?.getAttribute('aria-label') ||
                       link?.textContent?.trim() ||
                       card.querySelector('[data-automation-id="product-title"]')?.textContent?.trim();

          // Price - extract main price and unit price separately
          const priceContainer = card.querySelector('[data-automation-id="product-price"]') ||
                                card.querySelector('.price-main');

          let mainPrice = '';
          let unitPrice = '';

          if (priceContainer) {
            // DEBUG: Log the price container structure
            console.log('Shop Well: Price container HTML:', priceContainer.outerHTML.substring(0, 500));
            console.log('Shop Well: Price container text:', priceContainer.textContent?.trim());

            // Get full text for both extractions
            let fullText = priceContainer.textContent?.trim() || '';

            // STEP 1: Extract unit price FIRST (has distinct pattern with ¢/)
            // This prevents interference with main price extraction
            const unitPriceMatch = fullText.match(/(\d+\.?\d*)\s*[¢c]\s*\/\s*([\w\s]+)/i);
            if (unitPriceMatch) {
              unitPrice = `${unitPriceMatch[1]} ¢/${unitPriceMatch[2].trim()}`;
              console.log('Shop Well: Extracted unit price:', unitPrice);
              // Remove unit price from text to isolate main price
              fullText = fullText.replace(unitPriceMatch[0], '');
            }

            // STEP 2: Try to get main price from aria-label (most reliable)
            const ariaLabel = priceContainer.getAttribute('aria-label');
            if (ariaLabel && ariaLabel.includes('$')) {
              console.log('Shop Well: Found aria-label with price:', ariaLabel);
              const ariaPriceMatch = ariaLabel.match(/\$\d{1,3}(?:,\d{3})*\.\d{2}|\$\d+/);
              if (ariaPriceMatch) {
                mainPrice = ariaPriceMatch[0];
                console.log('Shop Well: Extracted main price from aria-label:', mainPrice);
              }
            }

            // STEP 3: Try to reconstruct from separate whole/fraction elements
            if (!mainPrice) {
              const wholePart = priceContainer.querySelector('[class*="whole"], [class*="dollar"]');
              const fractionPart = priceContainer.querySelector('[class*="fraction"], [class*="cent"]');

              if (wholePart && fractionPart) {
                const whole = wholePart.textContent?.replace(/[^\d]/g, '') || '0';
                const fraction = fractionPart.textContent?.replace(/[^\d]/g, '').substring(0, 2) || '00';
                mainPrice = `$${whole}.${fraction.padEnd(2, '0')}`;
                console.log('Shop Well: Reconstructed price from parts:', mainPrice);
              }
            }

            // STEP 4: Fallback to text extraction from cleaned text
            if (!mainPrice && fullText) {
              console.log('Shop Well: Attempting fallback text extraction from:', fullText);
              // Try to match standard currency format first
              const priceWithCents = fullText.match(/\$?\d{1,3}(?:,\d{3})*\.\d{2}/);
              if (priceWithCents) {
                mainPrice = priceWithCents[0];
                if (!mainPrice.startsWith('$')) mainPrice = '$' + mainPrice;
                console.log('Shop Well: Extracted price with cents:', mainPrice);
              } else {
                // Fallback to any number, but validate it's reasonable
                const priceMatch = fullText.match(/\$?\d+/);
                if (priceMatch) {
                  const numericValue = parseInt(priceMatch[0].replace('$', ''));
                  // Sanity check: typical grocery/retail items are under $10,000
                  if (numericValue < 10000) {
                    mainPrice = priceMatch[0];
                    if (!mainPrice.startsWith('$')) mainPrice = '$' + mainPrice;
                    console.log('Shop Well: Extracted integer price:', mainPrice);
                  } else {
                    console.warn('Shop Well: Rejected suspicious price value:', priceMatch[0]);
                  }
                }
              }
            }

            // Validation: warn if price looks suspicious
            if (mainPrice) {
              const priceValue = parseFloat(mainPrice.replace(/[$,]/g, ''));
              if (isNaN(priceValue) || priceValue <= 0) {
                console.warn('Shop Well: Invalid price extracted:', mainPrice);
                mainPrice = '';
              }
            }
          }

          const price = mainPrice; // Just the main price for backward compatibility
          const pricePerUnit = unitPrice; // Separate field for unit price

          console.log('Shop Well: Final prices - main:', price, 'unit:', pricePerUnit);

          // Image
          const image = card.querySelector('img')?.src;

          // Rating
          const ratingEl = card.querySelector('[data-automation-id="product-rating"]');
          const rating = ratingEl?.getAttribute('aria-label')?.match(/[\d.]+/)?.[0];

          // Construct product URL
          const productUrl = link?.href || (itemId ? `https://www.walmart.com/ip/${itemId}` : null);

          if (itemId && title) {
            products.push({
              id: itemId,
              title: title,
              price: price,
              pricePerUnit: pricePerUnit,
              image: image,
              url: productUrl,
              rating: rating,
              position: index,
              source: 'walmart_search'
            });
          }
        } catch (err) {
          console.warn('Shop Well: Failed to extract Walmart product card:', err);
        }
      });

      console.log(`Shop Well: Successfully extracted ${products.length} Walmart products`);
    } catch (error) {
      console.error('Shop Well: Walmart search extraction failed:', error);
    }

    return products;
  }
}