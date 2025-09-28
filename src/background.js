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
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.local.set({
      condition: 'POTS',
      autoshow: true
    });

    // Open options page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/index.html')
    });
  }
});

// Future: Could add context menus, alarms for periodic checks, etc.
console.log('Shop Well background service worker initialized');