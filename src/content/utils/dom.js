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
  const selectorArray = Array.isArray(selectors) ? selectors : [selectors];

  console.log('Shop Well: Attempting to extract price with', selectorArray.length, 'selectors');

  // Try each selector in order
  for (const selector of selectorArray) {
    try {
      const element = root.querySelector(selector);
      if (!element) {
        console.log(`Shop Well: Selector "${selector}" - no element found`);
        continue;
      }

      const priceText = element.textContent.trim();
      if (!priceText) {
        console.log(`Shop Well: Selector "${selector}" - empty text`);
        continue;
      }

      console.log(`Shop Well: Selector "${selector}" found text: "${priceText}"`);

      // Check parent element for unit price indicators
      const parentElement = element.parentElement;
      const parentClass = parentElement?.className || '';
      const parentText = parentElement?.textContent || '';

      if (parentClass.includes('unit') || parentClass.includes('per-unit') ||
          parentText.toLowerCase().includes('per ') || parentText.toLowerCase().includes('/oz') ||
          parentText.toLowerCase().includes('/count')) {
        console.log(`Shop Well: Skipping - parent suggests unit price (class: "${parentClass}")`);
        continue;
      }

      // Skip if this looks like a unit price (contains "/" or "per")
      // e.g., "($0.17/ounce)", "$1.50/count", "2.3 ¢ per fl oz"
      if (priceText.includes('/') || priceText.toLowerCase().includes('per')) {
        console.log(`Shop Well: Skipping - contains unit price indicator: "${priceText}"`);
        continue;
      }

      // Extract price pattern like $12.99, $1,299.99, etc.
      const priceMatch = priceText.match(/\$[\d,]+\.?\d*/);
      if (!priceMatch) {
        console.log(`Shop Well: Skipping - no price pattern found in "${priceText}"`);
        continue;
      }

      const extractedPrice = priceMatch[0];
      console.log(`Shop Well: Extracted price: "${extractedPrice}"`);

      // Parse price value to check if it's suspiciously low (likely unit price)
      const priceValue = parseFloat(extractedPrice.replace(/[$,]/g, ''));

      // Skip prices under $0.99 - likely unit prices (e.g., "$0.23" per ounce)
      // Exception: if it's the LAST selector (broadest fallback), we might accept it
      const isLastSelector = selector === selectorArray[selectorArray.length - 1];
      if (priceValue < 0.99 && !isLastSelector) {
        console.log(`Shop Well: Skipping - price too low (${extractedPrice}), likely unit price`);
        continue;
      }

      console.log(`Shop Well: ✓ Valid main price found: "${extractedPrice}" from selector: ${selector}`);
      return extractedPrice;

    } catch (error) {
      console.warn(`Shop Well: Error with selector "${selector}":`, error);
      continue;
    }
  }

  console.log('Shop Well: No valid price found after trying all selectors');
  return '';
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