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
        const promptCapabilities = await Promise.race([
          LanguageModel.availability(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        result.prompt = promptCapabilities === 'readily';
        result.details.prompt = { available: promptCapabilities };
        result.available = true;
        console.log('Shop Well Options: LanguageModel found, availability:', promptCapabilities);
      } catch (error) {
        console.warn('Shop Well Options: LanguageModel availability check failed:', error);
        result.details.promptError = error.message;
        if (error.message === 'Timeout') {
          result.details.promptError = 'Chrome AI is still downloading models. Please wait a few minutes and try again.';
        }
      }
    }

    // Check for Summarizer API - Multiple possible locations
    let summarizerFound = false;

    // Check self.ai.summarizer (newer API)
    if (self.ai && self.ai.summarizer) {
      try {
        const summarizerCapabilities = await Promise.race([
          self.ai.summarizer.capabilities(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        result.summarizer = summarizerCapabilities.available === 'readily';
        result.details.summarizer = summarizerCapabilities;
        result.available = true;
        summarizerFound = true;
        console.log('Shop Well Options: self.ai.summarizer found, capabilities:', summarizerCapabilities);
      } catch (error) {
        console.warn('Shop Well Options: self.ai.summarizer capabilities check failed:', error);
        result.details.summarizerError = error.message;
        if (error.message === 'Timeout') {
          result.details.summarizerError = 'Chrome AI is still downloading models. Please wait a few minutes and try again.';
        }
      }
    }

    // Fallback: Check window.ai.summarizer (older API)
    if (!summarizerFound && window.ai && window.ai.summarizer) {
      try {
        const summarizerCapabilities = await Promise.race([
          window.ai.summarizer.capabilities(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        result.summarizer = summarizerCapabilities.available === 'readily';
        result.details.summarizer = summarizerCapabilities;
        result.available = true;
        console.log('Shop Well Options: window.ai.summarizer found, capabilities:', summarizerCapabilities);
      } catch (error) {
        console.warn('Shop Well Options: window.ai.summarizer capabilities check failed:', error);
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
      'condition', 'customCondition', 'autoshow', 'allergies', 'customAllergies'
    ]);

    // Load condition settings
    const condition = settings.condition || 'POTS';
    document.getElementById('condition').value = condition;

    // Handle custom condition
    if (condition === 'custom') {
      showCustomConditionInput();
      document.getElementById('custom-condition').value = settings.customCondition || '';
    }

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
    const condition = document.getElementById('condition').value;
    const autoshow = document.getElementById('autoshow').checked;

    // Get custom condition if applicable
    const customCondition = condition === 'custom'
      ? document.getElementById('custom-condition').value.trim()
      : '';

    // Collect selected common allergies
    const allergenCheckboxes = document.querySelectorAll('.allergen-item input[type="checkbox"]:checked');
    const allergies = Array.from(allergenCheckboxes).map(checkbox => checkbox.value);

    // Get custom allergies
    const customAllergies = Array.from(document.querySelectorAll('.custom-allergen-item'))
      .map(item => item.querySelector('span').textContent);

    // Validation for custom condition
    if (condition === 'custom' && !customCondition) {
      showStatus('Please enter your custom condition', 'error');
      return;
    }

    await chrome.storage.local.set({
      condition,
      customCondition,
      autoshow,
      allergies,
      customAllergies
    });

    const totalAllergens = allergies.length + customAllergies.length;
    const conditionDisplay = condition === 'custom' ? customCondition : condition;

    let statusMessage = `Settings saved for ${conditionDisplay}!`;
    if (totalAllergens > 0) {
      statusMessage += ` Monitoring ${totalAllergens} allergen${totalAllergens > 1 ? 's' : ''}.`;
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

// Custom condition management
function showCustomConditionInput() {
  document.getElementById('custom-condition-group').classList.remove('hidden');
}

function hideCustomConditionInput() {
  document.getElementById('custom-condition-group').classList.add('hidden');
  document.getElementById('custom-condition').value = '';
}

// Custom allergen management
function addCustomAllergen() {
  const input = document.getElementById('custom-allergen-input');
  const allergen = input.value.trim().toLowerCase();

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

  // Condition dropdown change handler
  document.getElementById('condition').addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      showCustomConditionInput();
    } else {
      hideCustomConditionInput();
    }
    saveSettings();
  });

  // Custom condition input handler
  document.getElementById('custom-condition').addEventListener('input', saveSettings);

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