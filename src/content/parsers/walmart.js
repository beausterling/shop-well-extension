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
}