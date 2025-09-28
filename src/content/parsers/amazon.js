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
    const priceSelectors = [
      '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
      '#corePrice_feature_div .a-price.a-text-price .a-offscreen',
      '.a-price-whole',
      '#priceblock_dealprice',
      '#priceblock_ourprice',
      '.a-price .a-offscreen',
      '[data-testid="price"]',
      '.a-price-current'
    ];

    const price = extractPrice(priceSelectors);
    console.log('Shop Well: Amazon price:', price);
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
}