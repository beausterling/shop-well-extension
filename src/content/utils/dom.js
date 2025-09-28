// Shop Well DOM Utility Functions

/**
 * Get text content from the first matching element
 * @param {string|string[]} selectors - CSS selector or array of fallback selectors
 * @param {Element} root - Root element to search within (default: document)
 * @returns {string} - Cleaned text content or empty string
 */
export function getText(selectors, root = document) {
  const selectorArray = Array.isArray(selectors) ? selectors : [selectors];

  for (const selector of selectorArray) {
    try {
      const element = root.querySelector(selector);
      if (element && element.textContent) {
        return cleanText(element.textContent);
      }
    } catch (error) {
      console.warn('Shop Well: Invalid selector:', selector, error);
    }
  }

  return '';
}

/**
 * Get text content from multiple matching elements
 * @param {string|string[]} selectors - CSS selector or array of fallback selectors
 * @param {number} limit - Maximum number of elements to extract (default: 100)
 * @param {Element} root - Root element to search within (default: document)
 * @returns {string[]} - Array of cleaned text content
 */
export function getTextArray(selectors, limit = 100, root = document) {
  const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
  const results = [];

  for (const selector of selectorArray) {
    try {
      const elements = root.querySelectorAll(selector);
      for (let i = 0; i < Math.min(elements.length, limit); i++) {
        const text = cleanText(elements[i].textContent);
        if (text && !results.includes(text)) {
          results.push(text);
        }
      }

      // If we found results with this selector, return them
      if (results.length > 0) {
        break;
      }
    } catch (error) {
      console.warn('Shop Well: Invalid selector:', selector, error);
    }
  }

  return results.slice(0, limit);
}

/**
 * Clean and normalize text content
 * @param {string} text - Raw text content
 * @returns {string} - Cleaned text
 */
export function cleanText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/[\r\n\t]/g, ' ')  // Remove line breaks and tabs
    .trim()  // Remove leading/trailing whitespace
    .substring(0, 2000);  // Limit length for AI processing
}

/**
 * Extract price from element text content
 * @param {string|string[]} selectors - CSS selector or array of fallback selectors
 * @param {Element} root - Root element to search within (default: document)
 * @returns {string} - Extracted price string or empty string
 */
export function extractPrice(selectors, root = document) {
  const priceText = getText(selectors, root);

  if (!priceText) {
    return '';
  }

  // Look for price patterns like $12.99, $1,299.99, etc.
  const priceMatch = priceText.match(/\$[\d,]+\.?\d*/);
  return priceMatch ? priceMatch[0] : priceText;
}

/**
 * Get attribute value from the first matching element
 * @param {string|string[]} selectors - CSS selector or array of fallback selectors
 * @param {string} attribute - Attribute name to extract
 * @param {Element} root - Root element to search within (default: document)
 * @returns {string} - Attribute value or empty string
 */
export function getAttribute(selectors, attribute, root = document) {
  const selectorArray = Array.isArray(selectors) ? selectors : [selectors];

  for (const selector of selectorArray) {
    try {
      const element = root.querySelector(selector);
      if (element && element.hasAttribute(attribute)) {
        return element.getAttribute(attribute) || '';
      }
    } catch (error) {
      console.warn('Shop Well: Invalid selector:', selector, error);
    }
  }

  return '';
}

/**
 * Check if any element matches the given selectors
 * @param {string|string[]} selectors - CSS selector or array of fallback selectors
 * @param {Element} root - Root element to search within (default: document)
 * @returns {boolean} - True if any element is found
 */
export function elementExists(selectors, root = document) {
  const selectorArray = Array.isArray(selectors) ? selectors : [selectors];

  for (const selector of selectorArray) {
    try {
      if (root.querySelector(selector)) {
        return true;
      }
    } catch (error) {
      console.warn('Shop Well: Invalid selector:', selector, error);
    }
  }

  return false;
}

/**
 * Extract ingredients text from common ingredient selectors
 * @param {Element} root - Root element to search within (default: document)
 * @returns {string} - Ingredients text or empty string
 */
export function extractIngredients(root = document) {
  const ingredientSelectors = [
    // Amazon selectors
    '[data-feature-name="ingredients"]',
    '.a-expander-content:has-text("Ingredients")',
    '.a-section:has-text("Ingredients")',
    '#ingredients',
    '.ingredients',

    // Walmart selectors
    '[data-testid="nutrition-facts"] .ingredients',
    '.nutrition-facts .ingredients',
    '.product-ingredients',
    '[aria-label*="Ingredients"]',

    // Generic selectors
    '*:contains("Ingredients:") + *',
    '.ingredient-list',
    '.ingredients-section'
  ];

  return getText(ingredientSelectors, root);
}

/**
 * Safe element highlighting for debugging (non-intrusive)
 * @param {Element} element - Element to highlight
 * @param {string} color - Border color (default: red)
 */
export function highlightElement(element, color = 'red') {
  if (!element || typeof element.style === 'undefined') {
    return;
  }

  const originalBorder = element.style.border;
  element.style.border = `2px solid ${color}`;

  // Remove highlight after 3 seconds
  setTimeout(() => {
    element.style.border = originalBorder;
  }, 3000);
}