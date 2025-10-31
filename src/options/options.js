// Shop Well Options Page JavaScript

// AI Detection and Setup Helper
async function checkAIAvailability() {
  const result = {
    available: false,
    summarizer: false,
    prompt: false,
    error: null,
    details: {}
  };

  try {
    // Check for Prompt API (Language Model) - Official Chrome API
    if (typeof LanguageModel !== 'undefined') {
      try {
        const availability = await Promise.race([
          LanguageModel.availability(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        // availability() returns a string: 'readily', 'available', 'after-download', 'no'
        // Accept both 'readily' and 'available' as ready states
        result.prompt = availability === 'readily' || availability === 'available';
        result.details.prompt = { available: availability };
        result.available = true;
        console.log('Shop Well Options: LanguageModel found, availability:', availability);
      } catch (error) {
        console.warn('Shop Well Options: LanguageModel availability check failed:', error);
        result.details.promptError = error.message;
        if (error.message === 'Timeout') {
          result.details.promptError = 'Chrome AI is still downloading models. Please wait a few minutes and try again.';
        }
      }
    }

    // Check for Summarizer API - Official Chrome API
    if (typeof Summarizer !== 'undefined') {
      try {
        const availability = await Promise.race([
          Summarizer.availability(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        // availability() returns a string: 'readily', 'available', 'after-download', 'no'
        // Accept both 'readily' and 'available' as ready states
        result.summarizer = availability === 'readily' || availability === 'available';
        result.details.summarizer = { available: availability };
        result.available = true;
        console.log('Shop Well Options: Summarizer found, availability:', availability);
      } catch (error) {
        console.warn('Shop Well Options: Summarizer availability check failed:', error);
        result.details.summarizerError = error.message;
        if (error.message === 'Timeout') {
          result.details.summarizerError = 'Chrome AI is still downloading models. Please wait a few minutes and try again.';
        }
      }
    }

    // If no APIs are available at all
    if (!result.available) {
      result.error = 'Chrome Built-in AI not available. Requires Chrome 128+ with AI flags enabled. Check chrome://on-device-internals for model download status.';
      return result;
    }

    // Overall assessment
    if (!result.summarizer && !result.prompt) {
      result.error = 'Chrome AI APIs are not ready. Please check Chrome flags and try again. Models may still be downloading.';
    } else if (!result.summarizer) {
      result.error = 'Summarizer API not available. Product analysis will be limited. Models may still be downloading.';
    } else if (!result.prompt) {
      result.error = 'Prompt API not available. Wellness recommendations will be limited. Models may still be downloading.';
    }

  } catch (error) {
    result.error = `AI detection failed: ${error.message}`;
    console.error('Shop Well Options: AI detection error:', error);
  }

  return result;
}

async function updateAIStatus() {
  console.log('Shop Well Options: updateAIStatus() called');
  console.log('Shop Well Options: Checking AI status...');

  // Show loading state
  hideAllAIStatus();
  const loadingElement = document.getElementById('ai-status-loading');
  if (loadingElement) {
    loadingElement.classList.remove('hidden');
    console.log('Shop Well Options: Showing loading state');
  } else {
    console.error('Shop Well Options: Could not find ai-status-loading element');
  }

  try {
    const aiStatus = await checkAIAvailability();
    console.log('Shop Well Options: AI Status Result:', aiStatus);

    // Hide loading
    document.getElementById('ai-status-loading').classList.add('hidden');

    if (!aiStatus.available) {
      // Chrome AI not available at all
      document.getElementById('ai-status-unavailable').classList.remove('hidden');
      document.getElementById('ai-error-message').textContent = aiStatus.error;
    } else if (aiStatus.summarizer && aiStatus.prompt) {
      // All AI features available
      document.getElementById('ai-status-available').classList.remove('hidden');
      updateFeatureBadges(aiStatus);
    } else {
      // Partial AI availability - show setup
      document.getElementById('ai-status-setup').classList.remove('hidden');
    }
  } catch (error) {
    console.error('Shop Well Options: AI status check failed:', error);
    document.getElementById('ai-status-loading').classList.add('hidden');
    document.getElementById('ai-status-unavailable').classList.remove('hidden');
    document.getElementById('ai-error-message').textContent = 'Failed to check AI status. Please try again.';
  }
}

function updateFeatureBadges(aiStatus) {
  const summarizerBadge = document.getElementById('summarizer-status');
  const promptBadge = document.getElementById('prompt-status');

  if (aiStatus.summarizer) {
    summarizerBadge.textContent = 'Summarizer: Ready ✓';
    summarizerBadge.className = 'feature-badge ready';
  } else {
    summarizerBadge.textContent = 'Summarizer: Not Ready';
    summarizerBadge.className = 'feature-badge not-ready';
  }

  if (aiStatus.prompt) {
    promptBadge.textContent = 'Prompt API: Ready ✓';
    promptBadge.className = 'feature-badge ready';
  } else {
    promptBadge.textContent = 'Prompt API: Not Ready';
    promptBadge.className = 'feature-badge not-ready';
  }
}

function hideAllAIStatus() {
  const statusElements = [
    'ai-status-loading',
    'ai-status-available',
    'ai-status-setup',
    'ai-status-unavailable'
  ];

  statusElements.forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
}

function setupCopyButtons() {
  document.querySelectorAll('.copy-button').forEach(button => {
    button.addEventListener('click', async (e) => {
      const textToCopy = e.target.dataset.text;

      try {
        await navigator.clipboard.writeText(textToCopy);

        // Visual feedback
        const originalText = e.target.textContent;
        e.target.textContent = '✓ Copied!';
        e.target.classList.add('copied');

        setTimeout(() => {
          e.target.textContent = originalText;
          e.target.classList.remove('copied');
        }, 2000);

      } catch (error) {
        console.error('Failed to copy text:', error);
        showStatus('Failed to copy text', 'error');
      }
    });
  });
}

async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get([
      'firstName', 'condition', 'conditions', 'customConditions', 'autoshow', 'allergies', 'customAllergies', 'languagePreference'
    ]);

    // Load first name
    const firstName = settings.firstName || '';
    document.getElementById('first-name').value = firstName;

    // Load language preference
    const languagePreference = settings.languagePreference || 'auto';
    document.getElementById('language-preference').value = languagePreference;

    // Load condition settings (with migration from old format)
    let conditions = settings.conditions || [];

    // Migration: Convert old single condition format to array
    if (!settings.conditions && settings.condition) {
      conditions = settings.condition === 'custom' ? [] : [settings.condition];
      // Migrate to new format
      await chrome.storage.local.set({ conditions });
    }

    // Check appropriate condition checkboxes
    const conditionCheckboxes = document.querySelectorAll('.condition-card input[type="checkbox"]');
    conditionCheckboxes.forEach(checkbox => {
      checkbox.checked = conditions.includes(checkbox.value);
    });

    // Load custom conditions
    const customConditions = settings.customConditions || [];
    displayCustomConditions(customConditions);

    // Load autoshow setting
    document.getElementById('autoshow').checked = settings.autoshow !== false;

    // Load common allergen selections
    const allergies = settings.allergies || [];
    const allergenCheckboxes = document.querySelectorAll('.allergen-item input[type="checkbox"]');
    allergenCheckboxes.forEach(checkbox => {
      checkbox.checked = allergies.includes(checkbox.value);
    });

    // Load custom allergies
    const customAllergies = settings.customAllergies || [];
    displayCustomAllergies(customAllergies);

  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

async function saveSettings() {
  try {
    const firstName = document.getElementById('first-name').value.trim();
    const autoshow = document.getElementById('autoshow').checked;
    const languagePreference = document.getElementById('language-preference').value;

    // Collect selected conditions from checkboxes
    const conditionCheckboxes = document.querySelectorAll('.condition-card input[type="checkbox"]:checked');
    const conditions = Array.from(conditionCheckboxes).map(checkbox => checkbox.value);

    // Get custom conditions
    const customConditions = Array.from(document.querySelectorAll('.custom-chip'))
      .map(chip => chip.querySelector('span').textContent);

    // Collect selected common allergies
    const allergenCheckboxes = document.querySelectorAll('.allergen-item input[type="checkbox"]:checked');
    const allergies = Array.from(allergenCheckboxes).map(checkbox => checkbox.value);

    // Get custom allergies
    const customAllergies = Array.from(document.querySelectorAll('.custom-allergen-item'))
      .map(item => item.querySelector('span').textContent);

    await chrome.storage.local.set({
      firstName,
      conditions,
      customConditions,
      autoshow,
      allergies,
      customAllergies,
      languagePreference
    });

    const totalConditions = conditions.length + customConditions.length;
    const totalAllergens = allergies.length + customAllergies.length;

    let statusMessage = 'Settings saved!';
    if (totalConditions > 0) {
      statusMessage += ` Monitoring ${totalConditions} condition${totalConditions > 1 ? 's' : ''}.`;
    }
    if (totalAllergens > 0) {
      statusMessage += ` ${totalAllergens} allergen${totalAllergens > 1 ? 's' : ''} tracked.`;
    }

    showStatus(statusMessage, 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings', 'error');
  }
}

async function clearData() {
  if (confirm('Are you sure you want to clear all Shop Well data? This will reset all your preferences.')) {
    try {
      await chrome.storage.local.clear();
      await loadSettings(); // Reload default settings
      showStatus('All data cleared successfully!', 'success');
    } catch (error) {
      console.error('Error clearing data:', error);
      showStatus('Error clearing data', 'error');
    }
  }
}

function showStatus(message, type = 'success') {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  statusElement.style.display = 'block';

  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 3000);
}

// Helper function to capitalize first letter of each word
function capitalizeWords(text) {
  return text
    .split(' ')
    .map(word => {
      if (!word) return word; // Handle empty strings
      // Only capitalize first letter, preserve rest of the characters
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Custom condition management
function displayCustomConditions(customConditions) {
  const container = document.getElementById('custom-conditions-list');
  container.innerHTML = '';

  customConditions.forEach(condition => {
    const chip = document.createElement('div');
    chip.className = 'custom-chip';
    chip.innerHTML = `
      <span>${condition}</span>
      <button type="button" aria-label="Remove ${condition}">×</button>
    `;

    chip.querySelector('button').addEventListener('click', () => {
      chip.remove();
      saveSettings();
    });

    container.appendChild(chip);
  });
}

function addCustomCondition() {
  const input = document.getElementById('custom-condition');
  const condition = capitalizeWords(input.value.trim());

  if (!condition) {
    showStatus('Please enter a condition name', 'error');
    return;
  }

  // Check for duplicates
  const existingConditions = Array.from(document.querySelectorAll('.custom-chip span'))
    .map(span => span.textContent.toLowerCase());

  const standardConditions = Array.from(document.querySelectorAll('.condition-card input:checked'))
    .map(input => input.value.toLowerCase());

  if (existingConditions.includes(condition.toLowerCase()) || standardConditions.includes(condition.toLowerCase())) {
    showStatus('This condition is already added', 'error');
    return;
  }

  // Create chip
  const chip = document.createElement('div');
  chip.className = 'custom-chip';
  chip.innerHTML = `
    <span>${condition}</span>
    <button type="button" aria-label="Remove ${condition}">×</button>
  `;

  chip.querySelector('button').addEventListener('click', () => {
    chip.remove();
    saveSettings();
  });

  document.getElementById('custom-conditions-list').appendChild(chip);
  input.value = '';

  // Hide input group
  document.getElementById('custom-condition-group').classList.add('hidden');

  // Auto-save
  saveSettings();
}

// Custom allergen management
function addCustomAllergen() {
  const input = document.getElementById('custom-allergen-input');
  const allergen = capitalizeWords(input.value.trim());

  if (!allergen) {
    showStatus('Please enter an allergen name', 'error');
    return;
  }

  // Check for duplicates
  const existingAllergens = Array.from(document.querySelectorAll('.custom-allergen-item span'))
    .map(span => span.textContent.toLowerCase());

  const commonAllergens = Array.from(document.querySelectorAll('.allergen-item input:checked'))
    .map(input => input.value.toLowerCase());

  if (existingAllergens.includes(allergen) || commonAllergens.includes(allergen)) {
    showStatus('This allergen is already added', 'error');
    return;
  }

  // Create allergen item
  const allergenItem = document.createElement('div');
  allergenItem.className = 'custom-allergen-item';
  allergenItem.innerHTML = `
    <span>${allergen}</span>
    <button type="button" class="remove-button">Remove</button>
  `;

  // Add remove functionality
  allergenItem.querySelector('.remove-button').addEventListener('click', () => {
    allergenItem.remove();
    saveSettings(); // Auto-save when removed
  });

  document.getElementById('custom-allergen-list').appendChild(allergenItem);
  input.value = '';

  // Auto-save when added
  saveSettings();
}

function displayCustomAllergies(customAllergies) {
  const container = document.getElementById('custom-allergen-list');
  container.innerHTML = '';

  customAllergies.forEach(allergen => {
    const allergenItem = document.createElement('div');
    allergenItem.className = 'custom-allergen-item';
    allergenItem.innerHTML = `
      <span>${allergen}</span>
      <button type="button" class="remove-button">Remove</button>
    `;

    allergenItem.querySelector('.remove-button').addEventListener('click', () => {
      allergenItem.remove();
      saveSettings();
    });

    container.appendChild(allergenItem);
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  // Initialize AI status check
  updateAIStatus();

  // Setup copy buttons for Chrome flags
  setupCopyButtons();

  document.getElementById('save').addEventListener('click', saveSettings);
  document.getElementById('clear').addEventListener('click', clearData);

  // AI status recheck buttons with error handling
  const recheckBtn = document.getElementById('recheck-ai');
  const recheckErrorBtn = document.getElementById('recheck-ai-error');

  if (recheckBtn) {
    recheckBtn.addEventListener('click', () => {
      console.log('Shop Well Options: Recheck AI button clicked');
      updateAIStatus();
    });
  } else {
    console.warn('Shop Well Options: recheck-ai button not found');
  }

  if (recheckErrorBtn) {
    recheckErrorBtn.addEventListener('click', () => {
      console.log('Shop Well Options: Recheck AI error button clicked');
      updateAIStatus();
    });
  } else {
    console.warn('Shop Well Options: recheck-ai-error button not found');
  }

  // Condition checkbox change handlers
  const conditionCheckboxes = document.querySelectorAll('.condition-card input[type="checkbox"]');
  conditionCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings);
  });

  // Custom condition button handler
  const addConditionBtn = document.getElementById('add-condition-btn');
  if (addConditionBtn) {
    addConditionBtn.addEventListener('click', () => {
      document.getElementById('custom-condition-group').classList.toggle('hidden');
      if (!document.getElementById('custom-condition-group').classList.contains('hidden')) {
        document.getElementById('custom-condition').focus();
      }
    });
  }

  // Custom condition submit handler
  const addConditionSubmit = document.getElementById('add-condition-submit');
  if (addConditionSubmit) {
    addConditionSubmit.addEventListener('click', addCustomCondition);
  }

  // Allow Enter key to add custom condition
  const customConditionInput = document.getElementById('custom-condition');
  if (customConditionInput) {
    customConditionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addCustomCondition();
      }
    });
  }

  // Auto-save when first name changes
  document.getElementById('first-name').addEventListener('input', saveSettings);

  // Auto-save when language preference changes
  document.getElementById('language-preference').addEventListener('change', saveSettings);

  // Auto-save when autoshow changes
  document.getElementById('autoshow').addEventListener('change', saveSettings);

  // Auto-save when allergen checkboxes change
  const allergenCheckboxes = document.querySelectorAll('.allergen-item input[type="checkbox"]');
  allergenCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings);
  });

  // Custom allergen functionality
  document.getElementById('add-allergen').addEventListener('click', addCustomAllergen);

  // Allow Enter key to add allergen
  document.getElementById('custom-allergen-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addCustomAllergen();
    }
  });
});

// Handle keyboard shortcuts for accessibility
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.tagName === 'BUTTON') {
    event.target.click();
  }
});