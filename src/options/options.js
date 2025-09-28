// Shop Well Options Page JavaScript

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

  document.getElementById('save').addEventListener('click', saveSettings);
  document.getElementById('clear').addEventListener('click', clearData);

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