// Shop Well Background Automation Module
// Handles headless browser automation for extracting hidden product content

console.log('Shop Well: Background automation module loaded');

/**
 * Main function to extract product data using browser automation
 * Opens product page in background tab, clicks expandable sections, extracts data
 *
 * @param {string} url - Product URL to fetch
 * @returns {Promise<Object>} - { success: boolean, html: string, extractedData: Object, method: string }
 */
export async function automateProductExtraction(url) {
  console.log('Shop Well Automation: Starting automated extraction for:', url);

  const startTime = Date.now();
  let tabId = null;

  try {
    // Step 1: Open product page in background tab
    console.log('Shop Well Automation: Opening product page in background...');
    const tab = await chrome.tabs.create({
      url: url,
      active: false  // Keep tab in background (invisible to user)
    });
    tabId = tab.id;

    // Step 2: Wait for page to fully load (including JavaScript)
    await waitForPageLoad(tabId, 10000); // 10 second timeout

    // Step 3: Detect site type for site-specific automation
    const site = detectSiteFromUrl(url);
    console.log('Shop Well Automation: Detected site:', site);

    // Step 4: Expand all collapsible sections
    console.log('Shop Well Automation: Expanding collapsible sections...');
    await expandAllSections(tabId, site);

    // Brief wait for content to render after expansions
    await sleep(500);

    // Step 5: Extract full product data
    console.log('Shop Well Automation: Extracting product data...');
    const extractedData = await extractFullContent(tabId, site);

    // Step 6: Get the full HTML as backup
    const html = await getPageHTML(tabId);

    // Step 7: Close the background tab
    if (tabId) {
      await chrome.tabs.remove(tabId);
      console.log('Shop Well Automation: Background tab closed');
    }

    const duration = Date.now() - startTime;
    console.log(`Shop Well Automation: Extraction complete in ${duration}ms`);

    return {
      success: true,
      html: html,
      extractedData: extractedData,
      method: 'automated',
      duration: duration
    };

  } catch (error) {
    console.error('Shop Well Automation: Extraction failed:', error);

    // Clean up: close tab if it's still open
    if (tabId) {
      try {
        await chrome.tabs.remove(tabId);
      } catch (cleanupError) {
        console.warn('Shop Well Automation: Failed to close tab:', cleanupError);
      }
    }

    return {
      success: false,
      error: error.message,
      method: 'automated-failed'
    };
  }
}

/**
 * Wait for page to fully load including JavaScript execution
 * @param {number} tabId - Chrome tab ID
 * @param {number} timeout - Maximum wait time in milliseconds
 */
async function waitForPageLoad(tabId, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkInterval = setInterval(async () => {
      try {
        const tab = await chrome.tabs.get(tabId);

        // Check if page is complete
        if (tab.status === 'complete') {
          clearInterval(checkInterval);
          clearTimeout(timeoutHandle);

          // Additional wait for JavaScript to execute
          await sleep(1000);
          resolve();
        }

        // Timeout check
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          clearTimeout(timeoutHandle);
          reject(new Error('Page load timeout'));
        }
      } catch (error) {
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);
        reject(error);
      }
    }, 100);

    const timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('Page load timeout'));
    }, timeout);
  });
}

/**
 * Detect site type from URL
 * @param {string} url - Product URL
 * @returns {string} - 'amazon' | 'walmart' | 'unknown'
 */
function detectSiteFromUrl(url) {
  if (url.includes('amazon.com')) return 'amazon';
  if (url.includes('walmart.com')) return 'walmart';
  return 'unknown';
}

/**
 * Expand all collapsible sections on the product page
 * Uses site-specific selectors to click "Show More" buttons, tabs, etc.
 *
 * @param {number} tabId - Chrome tab ID
 * @param {string} site - Site type ('amazon' | 'walmart')
 */
async function expandAllSections(tabId, site) {
  // Inject content script to click expandable elements
  const clickScript = getExpandScript(site);

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: clickScript.func,
      args: clickScript.args || []
    });

    console.log('Shop Well Automation: Expandable sections clicked');
  } catch (error) {
    console.warn('Shop Well Automation: Failed to expand sections:', error);
    // Non-fatal error - continue with extraction
  }
}

/**
 * Get site-specific script for clicking expandable elements
 * @param {string} site - Site type
 * @returns {Object} - { func: Function, args: Array }
 */
function getExpandScript(site) {
  if (site === 'walmart') {
    return {
      func: () => {
        // Walmart-specific expandable selectors
        const selectors = [
          // Description "Show More" button
          'button[data-automation-id="product-description-show-more"]',
          '.show-more-button',
          '[aria-label*="Show more"]',

          // Product details accordions
          '.product-details-accordion button',
          '[data-testid="accordion-header"]',

          // Nutrition facts / Ingredients
          'button[data-testid="nutrition-button"]',
          '[aria-label*="Nutrition"]',
          '[aria-label*="Ingredients"]'
        ];

        let clickCount = 0;
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            try {
              // Check if element is visible and clickable
              if (el.offsetParent !== null) {
                el.click();
                clickCount++;
              }
            } catch (err) {
              console.warn('Failed to click element:', selector, err);
            }
          });
        });

        console.log(`Walmart: Clicked ${clickCount} expandable elements`);
        return clickCount;
      }
    };
  } else if (site === 'amazon') {
    return {
      func: () => {
        // Amazon-specific expandable selectors
        const selectors = [
          // Description "See more" / expander
          '#productDescription .a-expander-prompt',
          '.a-expander-prompt',

          // Feature bullets expanders
          '#feature-bullets .a-expander-prompt',

          // Product details expanders
          '.prodDetTable .a-expander-prompt',
          '#detailBullets_feature_div .a-expander-prompt',

          // Ingredients section
          '#ingredients .a-expander-prompt',
          '[data-feature-name="ingredients"] .a-expander-prompt',

          // Important information
          '#important-information .a-expander-prompt'
        ];

        let clickCount = 0;
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            try {
              if (el.offsetParent !== null) {
                el.click();
                clickCount++;
              }
            } catch (err) {
              console.warn('Failed to click element:', selector, err);
            }
          });
        });

        console.log(`Amazon: Clicked ${clickCount} expandable elements`);
        return clickCount;
      }
    };
  }

  // Default: try common patterns
  return {
    func: () => {
      const selectors = [
        'button:contains("Show more")',
        'button:contains("See more")',
        '.show-more',
        '.expander'
      ];

      let clickCount = 0;
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el.offsetParent !== null) {
              el.click();
              clickCount++;
            }
          });
        } catch (err) {
          // Ignore
        }
      });

      return clickCount;
    }
  };
}

/**
 * Extract full product content from the page after expansions
 * @param {number} tabId - Chrome tab ID
 * @param {string} site - Site type
 * @returns {Promise<Object>} - Extracted product data
 */
async function extractFullContent(tabId, site) {
  const extractionScript = getExtractionScript(site);

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: extractionScript.func,
      args: extractionScript.args || []
    });

    if (results && results[0] && results[0].result) {
      return results[0].result;
    }

    return null;
  } catch (error) {
    console.error('Shop Well Automation: Content extraction failed:', error);
    return null;
  }
}

/**
 * Get site-specific extraction script
 * @param {string} site - Site type
 * @returns {Object} - { func: Function, args: Array }
 */
function getExtractionScript(site) {
  if (site === 'walmart') {
    return {
      func: () => {
        // Helper to get text from selectors
        const getText = (selectors) => {
          const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
          for (const selector of selectorArray) {
            const el = document.querySelector(selector);
            if (el && el.textContent) {
              return el.textContent.trim();
            }
          }
          return '';
        };

        const getTextArray = (selectors, limit = 10) => {
          const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
          for (const selector of selectorArray) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              return Array.from(elements)
                .map(el => el.textContent?.trim())
                .filter(text => text && text.length > 3)
                .slice(0, limit);
            }
          }
          return [];
        };

        return {
          site: 'walmart',
          url: window.location.href,
          title: getText([
            'h1[itemprop="name"]',
            'h1[data-automation-id="product-title"]',
            'h1'
          ]),
          bullets: getTextArray([
            '[data-testid="product-highlights"] li',
            '.product-highlights li',
            '[itemprop="description"] li'
          ]),
          description: getText([
            '[data-testid="product-description"]',
            '[itemprop="description"]',
            '.about-product-description',
            '.product-description'
          ]),
          ingredients: getText([
            '[data-testid="ingredients"]',
            '.prod-ProductIngredients',
            '.nutrition-facts .ingredients',
            '[aria-label*="Ingredients"]',
            '*:contains("Ingredients:")'
          ]),
          specifications: getTextArray([
            '.product-specification tr',
            '[data-testid="specification"] tr',
            '.product-details tr'
          ], 20),
          price: getText([
            '[itemprop="price"]',
            '[data-automation-id="product-price"]',
            '.price-characteristic'
          ]),
          reviews: getTextArray([
            '[data-testid="review-text"]',
            '.review-text'
          ], 5)
        };
      }
    };
  } else if (site === 'amazon') {
    return {
      func: () => {
        const getText = (selectors) => {
          const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
          for (const selector of selectorArray) {
            const el = document.querySelector(selector);
            if (el && el.textContent) {
              return el.textContent.trim();
            }
          }
          return '';
        };

        const getTextArray = (selectors, limit = 10) => {
          const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
          for (const selector of selectorArray) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              return Array.from(elements)
                .map(el => el.textContent?.trim())
                .filter(text => text && text.length > 3)
                .slice(0, limit);
            }
          }
          return [];
        };

        return {
          site: 'amazon',
          url: window.location.href,
          title: getText([
            '#productTitle',
            'h1.a-size-large',
            'h1'
          ]),
          bullets: getTextArray([
            '#feature-bullets ul li span',
            '#feature-bullets li',
            '.a-unordered-list.a-vertical li'
          ]),
          description: getText([
            '#productDescription p',
            '#productDescription',
            '#aplus_feature_div'
          ]),
          ingredients: getText([
            '[data-feature-name="ingredients"]',
            '#ingredients',
            '.ingredients',
            '#detailBullets_feature_div .ingredients'
          ]),
          specifications: getTextArray([
            '#productDetails_detailBullets_sections1 tr',
            '#detailBullets_feature_div li',
            '.prodDetTable tr'
          ], 20),
          price: getText([
            '.a-price.apexPriceToPay .a-offscreen',
            '#corePrice_feature_div .a-price .a-offscreen',
            '#priceblock_dealprice',
            '#priceblock_ourprice'
          ]),
          reviews: getTextArray([
            '[data-hook="review-body"] span',
            '.review-text-content span'
          ], 5)
        };
      }
    };
  }

  // Generic extraction for unknown sites
  return {
    func: () => {
      return {
        site: 'unknown',
        url: window.location.href,
        title: document.querySelector('h1')?.textContent?.trim() || '',
        description: document.body.textContent?.substring(0, 2000) || ''
      };
    }
  };
}

/**
 * Get the full HTML of the page
 * @param {number} tabId - Chrome tab ID
 * @returns {Promise<string>} - Full page HTML
 */
async function getPageHTML(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => document.documentElement.outerHTML
    });

    if (results && results[0] && results[0].result) {
      return results[0].result;
    }

    return '';
  } catch (error) {
    console.error('Shop Well Automation: Failed to get page HTML:', error);
    return '';
  }
}

/**
 * Sleep utility for async delays
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
