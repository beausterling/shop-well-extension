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
    // Amazon selectors (valid CSS)
    '[data-feature-name="ingredients"]',
    '#ingredients',
    '.ingredients',
    '.a-expander-content',
    '#important-information',
    '#importantInformation',

    // Walmart selectors (valid CSS)
    '[data-testid="nutrition-facts"] .ingredients',
    '.nutrition-facts .ingredients',
    '.product-ingredients',
    '[aria-label*="Ingredients"]',

    // Generic selectors (valid CSS)
    '.ingredient-list',
    '.ingredients-section'
  ];

  // Try standard selectors first
  let result = getText(ingredientSelectors, root);
  if (result) {
    return result;
  }

  // Fallback: Search for "Ingredients" labels and extract adjacent content
  result = findTextByLabel('Ingredients', root);
  if (result) {
    return result;
  }

  return '';
}

/**
 * Find text content by searching for a label and extracting adjacent/child content
 * @param {string} labelText - The label to search for (e.g., "Ingredients")
 * @param {Element} root - Root element to search within
 * @returns {string} - Found text content or empty string
 */
function findTextByLabel(labelText, root = document) {
  try {
    // Get all text-containing elements
    const allElements = root.querySelectorAll('*');

    for (const element of allElements) {
      // Check if this element's direct text content contains the label
      const directText = element.textContent?.trim() || '';
      const childrenText = Array.from(element.children).map(c => c.textContent).join('');
      const ownText = directText.replace(childrenText, '').trim();

      // Check if this element is a label (contains "Ingredients:" or "INGREDIENTS:")
      if (ownText.toLowerCase().includes(labelText.toLowerCase() + ':') ||
          ownText.toLowerCase() === labelText.toLowerCase()) {

        // Strategy 1: Check next sibling
        let nextSibling = element.nextElementSibling;
        if (nextSibling) {
          const siblingText = cleanText(nextSibling.textContent);
          if (siblingText && siblingText.length > 10) {
            console.log(`Shop Well: Found ${labelText} via next sibling`);
            return siblingText;
          }
        }

        // Strategy 2: Check parent's next sibling (for table row structures)
        if (element.parentElement) {
          nextSibling = element.parentElement.nextElementSibling;
          if (nextSibling) {
            const siblingText = cleanText(nextSibling.textContent);
            if (siblingText && siblingText.length > 10) {
              console.log(`Shop Well: Found ${labelText} via parent's next sibling`);
              return siblingText;
            }
          }
        }

        // Strategy 3: Check children of parent (for nested structures)
        const parent = element.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children);
          const elementIndex = siblings.indexOf(element);
          if (elementIndex !== -1 && elementIndex < siblings.length - 1) {
            const nextElement = siblings[elementIndex + 1];
            const nextText = cleanText(nextElement.textContent);
            if (nextText && nextText.length > 10) {
              console.log(`Shop Well: Found ${labelText} via parent children`);
              return nextText;
            }
          }
        }

        // Strategy 4: Check if there's text after the label in the same element
        const fullText = element.textContent || '';
        const labelPattern = new RegExp(`${labelText}:?\\s*(.+)`, 'i');
        const match = fullText.match(labelPattern);
        if (match && match[1]) {
          const extractedText = cleanText(match[1]);
          if (extractedText.length > 10) {
            console.log(`Shop Well: Found ${labelText} in same element`);
            return extractedText;
          }
        }
      }

      // Check for table row structure: <tr><td>Ingredients</td><td>CONTENT</td></tr>
      if (element.tagName === 'TR') {
        const cells = element.querySelectorAll('td, th');
        for (let i = 0; i < cells.length - 1; i++) {
          const cellText = cleanText(cells[i].textContent);
          if (cellText.toLowerCase().includes(labelText.toLowerCase())) {
            const contentCell = cells[i + 1];
            const content = cleanText(contentCell.textContent);
            if (content && content.length > 10) {
              console.log(`Shop Well: Found ${labelText} in table row`);
              return content;
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Shop Well: Error finding text by label "${labelText}":`, error);
  }

  return '';
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