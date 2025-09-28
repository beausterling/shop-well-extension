// Shop Well Options Page JavaScript

async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get(['condition', 'autoshow', 'allergies']);
    document.getElementById('condition').value = settings.condition || 'POTS';
    document.getElementById('autoshow').checked = settings.autoshow !== false;

    // Load allergen selections
    const allergies = settings.allergies || [];
    const allergenCheckboxes = document.querySelectorAll('.allergen-item input[type="checkbox"]');
    allergenCheckboxes.forEach(checkbox => {
      checkbox.checked = allergies.includes(checkbox.value);
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

async function saveSettings() {
  try {
    const condition = document.getElementById('condition').value;
    const autoshow = document.getElementById('autoshow').checked;

    // Collect selected allergies
    const allergenCheckboxes = document.querySelectorAll('.allergen-item input[type="checkbox"]:checked');
    const allergies = Array.from(allergenCheckboxes).map(checkbox => checkbox.value);

    await chrome.storage.local.set({ condition, autoshow, allergies });

    const allergyCount = allergies.length;
    const statusMessage = allergyCount > 0
      ? `Settings saved! Monitoring for ${allergyCount} allergen${allergyCount > 1 ? 's' : ''}.`
      : 'Settings saved successfully!';

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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  document.getElementById('save').addEventListener('click', saveSettings);
  document.getElementById('clear').addEventListener('click', clearData);

  // Auto-save when settings change
  document.getElementById('condition').addEventListener('change', saveSettings);
  document.getElementById('autoshow').addEventListener('change', saveSettings);

  // Auto-save when allergen checkboxes change
  const allergenCheckboxes = document.querySelectorAll('.allergen-item input[type="checkbox"]');
  allergenCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings);
  });
});

// Handle keyboard shortcuts for accessibility
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.tagName === 'BUTTON') {
    event.target.click();
  }
});