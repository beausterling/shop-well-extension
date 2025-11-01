// Shop Well Background Service Worker
// Handles keyboard shortcuts, side panel management, and message routing

import { automateProductExtraction } from './background-automation.js';

console.log('Shop Well background service worker initialized');

/* =============================================================================
   MESSAGE QUEUE FOR SIDE PANEL
   ============================================================================= */

// Store pending analysis requests until side panel is ready
let pendingAnalysisRequest = null;

/**
 * Force open side panel with retry logic
 * @param {number} windowId - Window ID to open panel in
 * @param {number} retries - Number of retry attempts (default: 2)
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
async function forceOpenSidePanel(windowId, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      await chrome.sidePanel.open({ windowId });
      console.log(`Shop Well: Successfully forced panel open (attempt ${i + 1})`);
      return true;
    } catch (error) {
      console.warn(`Shop Well: Panel open attempt ${i + 1} failed:`, error.message);
      if (i < retries) {
        // Wait 500ms before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  console.error('Shop Well: Failed to open panel after all retry attempts');
  return false;
}

/* =============================================================================
   KEYBOARD SHORTCUT HANDLER
   ============================================================================= */

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-panel') {
    console.log('Shop Well: Keyboard shortcut triggered (Option+Shift+W on Mac, Alt+Shift+W on Windows/Linux)');

    try {
      // Get the current active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!activeTab) {
        console.warn('Shop Well: No active tab found');
        return;
      }

      // Ensure the side panel uses the production panel
      await chrome.sidePanel.setOptions({
        tabId: activeTab.id,
        path: 'sidepanel/index.html',
        enabled: true
      });

      // Check if tab is valid and on a supported site
      if (!activeTab.url ||
          (!activeTab.url.includes('amazon.com') && !activeTab.url.includes('walmart.com'))) {
        console.log('Shop Well: Not on a supported site');

        // Still open side panel to show welcome message
        await chrome.sidePanel.open({ windowId: activeTab.windowId });
        return;
      }

      // Open the side panel
      console.log('Shop Well: Opening side panel for tab:', activeTab.id);
      await chrome.sidePanel.open({ windowId: activeTab.windowId });

      // Request product data from content script
      chrome.tabs.sendMessage(
        activeTab.id,
        { command: 'extract-product-data' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Shop Well: Failed to extract product data:', chrome.runtime.lastError.message);
            return;
          }

          if (response && response.success && response.productData) {
            console.log('Shop Well: Product data extracted, sending to side panel');

            // Send product data to side panel for analysis
            chrome.runtime.sendMessage({
              type: 'analyze-product',
              productData: response.productData
            }, (sidePanelResponse) => {
              if (chrome.runtime.lastError) {
                console.warn('Shop Well: Side panel may not be ready yet:', chrome.runtime.lastError.message);
              } else {
                console.log('Shop Well: Analysis started in side panel');
              }
            });
          } else {
            console.warn('Shop Well: No product data received from content script');
          }
        }
      );

    } catch (error) {
      console.error('Shop Well: Error handling keyboard shortcut:', error);
    }
  }
});

/* =============================================================================
   EXTENSION ICON CLICK HANDLER
   ============================================================================= */

// Handle extension icon click - open side panel
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Shop Well: Extension icon clicked');

  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });

    // If on a supported site, extract product data
    if (tab.url && (tab.url.includes('amazon.com') || tab.url.includes('walmart.com'))) {
      chrome.tabs.sendMessage(
        tab.id,
        { command: 'extract-product-data' },
        (response) => {
          if (!chrome.runtime.lastError && response && response.success) {
            chrome.runtime.sendMessage({
              type: 'analyze-product',
              productData: response.productData
            });
          }
        }
      );
    }
  } catch (error) {
    console.error('Shop Well: Error opening side panel:', error);
  }
});

/* =============================================================================
   MESSAGE ROUTING
   ============================================================================= */

// Listen for messages from content scripts and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Shop Well: Message received:', message.type || message.command);

  // Handle automated product extraction (browser automation with click expansion)
  if (message.type === 'FETCH_PRODUCT_HTML_AUTOMATED') {
    console.log('Shop Well: Starting automated extraction for:', message.url);

    automateProductExtraction(message.url)
      .then(result => {
        if (result.success) {
          console.log('Shop Well: Automated extraction successful, duration:', result.duration, 'ms');
          sendResponse({
            ok: true,
            html: result.html,
            extractedData: result.extractedData,
            method: 'automated',
            duration: result.duration
          });
        } else {
          console.warn('Shop Well: Automated extraction failed:', result.error);
          console.log('Shop Well: Falling back to simple fetch...');

          // Fall back to simple fetch
          fetch(message.url, { credentials: 'omit' })
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              return response.text();
            })
            .then(html => {
              console.log('Shop Well: Fallback fetch successful, length:', html.length);
              sendResponse({ ok: true, html, method: 'fallback-fetch' });
            })
            .catch(fetchError => {
              console.error('Shop Well: Fallback fetch also failed:', fetchError);
              sendResponse({ ok: false, error: String(fetchError), method: 'all-failed' });
            });
        }
      })
      .catch(error => {
        console.error('Shop Well: Automated extraction error:', error);
        sendResponse({ ok: false, error: String(error), method: 'automation-error' });
      });

    return true; // Keep message channel open for async response
  }

  // Handle cross-origin product HTML fetch for listing analysis (fallback method)
  if (message.type === 'FETCH_PRODUCT_HTML') {
    console.log('Shop Well: Fetching product HTML from:', message.url);

    fetch(message.url, { credentials: 'omit' })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .then(html => {
        console.log('Shop Well: Product HTML fetched successfully, length:', html.length);
        sendResponse({ ok: true, html });
      })
      .catch(error => {
        console.error('Shop Well: Product HTML fetch failed:', error);
        sendResponse({ ok: false, error: String(error) });
      });

    return true; // Keep message channel open for async response
  }

  // Handle side panel ready signal
  if (message.type === 'sidepanel-ready') {
    console.log('Shop Well: Side panel is ready');

    // If there's a pending analysis request, deliver it now
    if (pendingAnalysisRequest) {
      console.log('Shop Well: Delivering queued analysis request:', pendingAnalysisRequest.type);

      chrome.runtime.sendMessage(pendingAnalysisRequest, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Shop Well: Failed to deliver queued message:', chrome.runtime.lastError.message);
        } else {
          console.log('Shop Well: Queued message delivered successfully');
        }
      });

      // Clear the queue
      pendingAnalysisRequest = null;
    }

    sendResponse({ success: true });
    return true;
  }

  // Handle different message types
  if (message.type === 'analyze-product' && message.productData) {
    // This message is going to the side panel
    // The side panel's listener will pick it up
    console.log('Shop Well: Routing analysis request to side panel');

    // Don't send response here - let the side panel handle it
    return false;
  }

  if (message.type === 'analyze-listing-product' && message.productData) {
    // Listing product badge was clicked
    console.log('Shop Well: Listing product analysis requested:', message.productData.id);

    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      // ALWAYS force panel open (idempotent if already open)
      console.log('Shop Well: Forcing side panel open with retry logic...');
      const panelOpened = await forceOpenSidePanel(activeTab.windowId);

      if (!panelOpened) {
        // Failed to open panel after retries - notify content script
        console.error('Shop Well: Could not open side panel');
        chrome.tabs.sendMessage(activeTab.id, {
          type: 'analysis-error',
          error: 'Failed to open side panel'
        });
        sendResponse({ success: false, error: 'Failed to open side panel' });
        return;
      }

      // Send force-reset message to ensure panel is in clean state
      console.log('Shop Well: Sending force-reset to side panel');
      chrome.runtime.sendMessage({
        type: 'force-reset-state',
        reason: 'new-analysis-requested'
      });

      // Small delay to allow reset to process, then send analysis request
      setTimeout(() => {
        console.log('Shop Well: Sending analysis request to side panel');
        chrome.runtime.sendMessage({
          type: 'analyze-listing-product',
          productData: message.productData
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Shop Well: Failed to send analysis message:', chrome.runtime.lastError.message);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            console.log('Shop Well: Analysis request sent successfully');
            sendResponse({ success: true });
          }
        });
      }, 150); // 150ms delay for reset to process
    });

    return true; // Will send response asynchronously
  }

  if (message.command === 'extract-product-data') {
    // This is handled by the content script
    return false;
  }

  if (message.type === 'product-data-extracted' && message.productData) {
    // Content script extracted data, send to side panel
    console.log('Shop Well: Product data received from content script, forwarding to side panel');

    chrome.runtime.sendMessage({
      type: 'analyze-product',
      productData: message.productData
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Shop Well: Side panel not ready:', chrome.runtime.lastError.message);
      }
    });

    sendResponse({ success: true });
    return true;
  }

  return false;
});

/* =============================================================================
   TAB CHANGE HANDLERS
   ============================================================================= */

// Listen for tab updates (navigation to new pages)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only act on complete page loads
  if (changeInfo.status !== 'complete') return;

  // Check if it's a supported site
  if (tab.url && (tab.url.includes('amazon.com') || tab.url.includes('walmart.com'))) {
    console.log('Shop Well: Navigated to supported site:', tab.url);

    // Enable side panel for this tab
    chrome.sidePanel.setOptions({
      tabId: tabId,
      enabled: true
    }).catch(err => {
      // Silently fail - side panel API might not be fully ready
    });
  }
});

/* =============================================================================
   INSTALLATION & UPDATES
   ============================================================================= */

// Handle extension installation and updates
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Shop Well: Extension installed/updated, reason:', details.reason);

  if (details.reason === 'install') {
    // Set default settings on first install
    await chrome.storage.local.set({
      condition: 'POTS',
      autoshow: true,
      allergies: [],
      customAllergies: [],
      customCondition: '',
      languagePreference: 'auto',
      welcomeCompleted: false
    });

    console.log('Shop Well: Default settings initialized');

    // Open welcome page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome/index.html')
    });

  } else if (details.reason === 'update') {
    console.log('Shop Well: Extension updated to version', chrome.runtime.getManifest().version);

    // Check if user has completed welcome flow
    const { welcomeCompleted } = await chrome.storage.local.get(['welcomeCompleted']);

    if (!welcomeCompleted) {
      // Show welcome page for users who installed before welcome flow
      chrome.tabs.create({
        url: chrome.runtime.getURL('welcome/index.html')
      });
    }
  }
});

/* =============================================================================
   SIDE PANEL CLOSE DETECTION
   ============================================================================= */

// Track which tabs have the side panel open
const sidePanelOpenTabs = new Set();

// Monitor when windows are removed (includes side panel closes)
chrome.windows.onRemoved.addListener(async (windowId) => {
  console.log('Shop Well: Window closed:', windowId);

  // Notify all tabs that side panel was closed
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    if (sidePanelOpenTabs.has(tab.id)) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'side-panel-closed'
      }).catch(() => {
        // Ignore errors if content script not present
      });
      sidePanelOpenTabs.delete(tab.id);
    }
  });
});

// When side panel opens, track it
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'sidepanel-opened' && message.tabId) {
    sidePanelOpenTabs.add(message.tabId);
    console.log('Shop Well: Side panel opened for tab:', message.tabId);
  }
  return false;
});

/* =============================================================================
   CONTEXT MENU (OPTIONAL - FOR FUTURE)
   ============================================================================= */

// Future: Could add context menu items for quick actions
// chrome.contextMenus.create({
//   id: 'shop-well-analyze',
//   title: 'Analyze with Shop Well',
//   contexts: ['page']
// });
