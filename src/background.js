// Shop Well Background Service Worker

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-panel') {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {command: 'toggle-panel'});
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