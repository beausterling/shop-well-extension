// Shop Well Background Service Worker

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-panel') {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      // Ensure we have an active tab
      if (!tabs || tabs.length === 0) {
        console.warn('Shop Well: No active tab found');
        return;
      }

      const activeTab = tabs[0];

      // Check if tab is valid and on a supported site
      if (!activeTab.url || (!activeTab.url.includes('amazon.com') && !activeTab.url.includes('walmart.com'))) {
        console.log('Shop Well: Not on a supported site');
        return;
      }

      // Send message with error handling
      chrome.tabs.sendMessage(activeTab.id, {command: 'toggle-panel'}, (response) => {
        // Check for errors
        if (chrome.runtime.lastError) {
          console.error('Shop Well: Message failed:', chrome.runtime.lastError.message);

          // Content script might not be loaded yet, try injecting it
          console.log('Shop Well: Attempting to reinject content script...');
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['content/content.js']
          }).then(() => {
            console.log('Shop Well: Content script reinjected, retrying...');
            // Retry message after a brief delay
            setTimeout(() => {
              chrome.tabs.sendMessage(activeTab.id, {command: 'toggle-panel'});
            }, 100);
          }).catch(err => {
            console.error('Shop Well: Failed to inject content script:', err);
          });
        } else {
          console.log('Shop Well: Message sent successfully', response);
        }
      });
    });
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings
    await chrome.storage.local.set({
      condition: 'POTS',
      autoshow: true,
      allergies: [],
      customAllergies: [],
      customCondition: '',
      welcomeCompleted: false
    });

    // Open welcome page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome/index.html')
    });
  } else if (details.reason === 'update') {
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

// Future: Could add context menus, alarms for periodic checks, etc.
console.log('Shop Well background service worker initialized');