// Shop Well Welcome/Onboarding Page JavaScript
// 3-Step Simplified Onboarding Flow

// ===================================
// STATE MANAGEMENT
// ===================================
let currentStep = 1;
const totalSteps = 3;
let aiStatusCache = null; // Cache AI status to avoid re-checking
let useBasicMode = false; // Track if user chose Basic Mode

// ===================================
// AI AVAILABILITY DETECTION
// ===================================
async function checkAIAvailability() {
  const result = {
    available: false,
    summarizer: false,
    prompt: false,
    error: null,
    details: {}
  };

  try {
    // Check for Prompt API (Language Model)
    if (typeof LanguageModel !== 'undefined') {
      try {
        const availability = await Promise.race([
          LanguageModel.availability({ language: 'en' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        result.prompt = availability === 'readily' || availability === 'available';
        result.details.prompt = { available: availability };
        result.available = true;
        console.log('Welcome: LanguageModel availability:', availability);
      } catch (error) {
        console.warn('Welcome: LanguageModel check failed:', error);
        result.details.promptError = error.message === 'Timeout'
          ? 'Chrome AI is downloading models. Please wait and try again.'
          : error.message;
      }
    }

    // Check for Summarizer API
    if (typeof Summarizer !== 'undefined') {
      try {
        const availability = await Promise.race([
          Summarizer.availability({ language: 'en' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        result.summarizer = availability === 'readily' || availability === 'available';
        result.details.summarizer = { available: availability };
        result.available = true;
        console.log('Welcome: Summarizer availability:', availability);
      } catch (error) {
        console.warn('Welcome: Summarizer check failed:', error);
        result.details.summarizerError = error.message === 'Timeout'
          ? 'Chrome AI is downloading models. Please wait and try again.'
          : error.message;
      }
    }

    // Set error message if no APIs available
    if (!result.available) {
      result.error = 'Chrome Built-in AI not available. Requires Chrome 128+ with AI flags enabled.';
    } else if (!result.summarizer && !result.prompt) {
      result.error = 'Chrome AI APIs are not ready. Please enable flags and restart Chrome.';
    }

  } catch (error) {
    result.error = `AI detection failed: ${error.message}`;
    console.error('Welcome: AI detection error:', error);
  }

  return result;
}

// ===================================
// AI STATUS UPDATE (Step 2)
// ===================================
async function updateAIStatus(showCheckingState = true) {
  console.log('Welcome: Checking AI status...');

  const statusCard = document.getElementById('ai-status-card');
  const statusIcon = document.getElementById('status-icon');
  const statusTitle = document.getElementById('status-title');
  const statusMessage = document.getElementById('status-message');
  const setupInstructions = document.getElementById('setup-instructions');
  const basicModeBtn = document.getElementById('basic-mode-btn');
  const recheckBtn = document.getElementById('recheck-ai');
  const featureComparison = document.querySelector('.feature-comparison');
  const primaryAction = document.querySelector('.primary-action');
  const secondaryAction = document.querySelector('.secondary-action');

  // Only show checking state if requested (not when using cached data)
  if (showCheckingState && !aiStatusCache) {
    statusCard.className = 'ai-status-card checking';
    statusIcon.innerHTML = '<div class="spinner"></div>';
    statusTitle.textContent = 'Checking Chrome AI...';
    statusMessage.textContent = 'Please wait while we detect AI availability';
    setupInstructions.classList.add('hidden');
  }

  try {
    // Use cached status if available, otherwise check
    const aiStatus = aiStatusCache || await checkAIAvailability();
    if (!aiStatusCache) {
      aiStatusCache = aiStatus; // Cache for future use
    }
    console.log('Welcome: AI Status Result:', aiStatus);

    if (aiStatus.available && aiStatus.summarizer && aiStatus.prompt) {
      // ✅ AI is fully ready - SUCCESS!
      statusCard.className = 'ai-status-card ready';
      statusIcon.innerHTML = '✅';
      statusTitle.textContent = 'Chrome AI is Ready!';
      statusMessage.textContent = 'Enhanced wellness analysis is available.';

      // Hide all AI setup UI elements
      setupInstructions?.classList.add('hidden');
      basicModeBtn?.classList.add('hidden');
      recheckBtn?.classList.add('hidden');
      featureComparison?.classList.add('hidden');
      primaryAction?.classList.add('hidden');
      secondaryAction?.classList.add('hidden');

    } else {
      // ⚠️ AI not fully available - show friendly options
      statusCard.className = 'ai-status-card not-ready';
      statusIcon.innerHTML = '🤖';
      statusTitle.textContent = 'Want Smarter Analysis?';
      statusMessage.textContent = 'Enable Chrome AI for enhanced product insights, or continue with basic allergen detection.';

      // Show feature comparison and actions
      featureComparison?.classList.remove('hidden');
      primaryAction?.classList.remove('hidden');
      secondaryAction?.classList.remove('hidden');
      basicModeBtn?.classList.remove('hidden');
      setupInstructions?.classList.add('hidden'); // Start collapsed
    }
  } catch (error) {
    console.error('Welcome: AI status check failed:', error);
    statusCard.className = 'ai-status-card not-ready';
    statusIcon.innerHTML = '🤖';
    statusTitle.textContent = 'Want Smarter Analysis?';
    statusMessage.textContent = 'Enable Chrome AI for enhanced insights, or continue with basic mode.';

    // Show feature comparison and actions
    featureComparison?.classList.remove('hidden');
    primaryAction?.classList.remove('hidden');
    secondaryAction?.classList.remove('hidden');
    basicModeBtn?.classList.remove('hidden');
    setupInstructions?.classList.add('hidden');
  }
}

// ===================================
// STEP NAVIGATION
// ===================================
async function goToStep(stepNumber) {
  if (stepNumber < 1 || stepNumber > totalSteps) return;

  // Smart auto-skip: If going to step 2 and AI is ready, skip to step 3
  if (stepNumber === 2 && aiStatusCache?.available && aiStatusCache?.summarizer && aiStatusCache?.prompt) {
    console.log('Welcome: AI is ready, auto-skipping Step 2');
    stepNumber = 3; // Jump directly to personalization
  }

  // Update current step
  currentStep = stepNumber;

  // Hide all steps
  document.querySelectorAll('.onboarding-step').forEach(step => {
    step.classList.remove('active');
  });

  // Show current step
  document.getElementById(`step-${currentStep}`).classList.add('active');

  // Update progress bar
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = (currentStep / totalSteps) * 100;
  progressBar.style.width = `${progressPercent}%`;

  // Trigger AI check when entering step 2 (only if not cached)
  if (currentStep === 2) {
    updateAIStatus(!aiStatusCache); // Don't show checking state if cached
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  console.log(`Welcome: Navigated to step ${currentStep}`);
}

// ===================================
// STATE - Custom Conditions & Allergens
// ===================================
let customConditions = []; // Array of custom condition strings
let customAllergies = []; // Array of custom allergen strings

// ===================================
// SETTINGS SAVE (Step 3)
// ===================================
async function saveSettings() {
  // Get first name (optional)
  const firstNameInput = document.getElementById('first-name-input');
  const firstName = firstNameInput ? firstNameInput.value.trim() : '';

  // Get email (required)
  const emailInput = document.getElementById('email-input');
  const email = emailInput ? emailInput.value.trim() : '';

  // Get selected conditions (multiple checkboxes)
  const conditionInputs = document.querySelectorAll('input[name="condition"]:checked');
  const conditions = Array.from(conditionInputs).map(input => input.value);

  // Get selected allergens
  const allergenInputs = document.querySelectorAll('input[name="allergen"]:checked');
  const allergies = Array.from(allergenInputs).map(input => input.value);

  console.log('Welcome: Saving settings:', {
    firstName,
    email,
    conditions,
    customConditions,
    allergies,
    customAllergies
  });

  try {
    // Save to Chrome storage (if available)
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        firstName,
        email,
        conditions,           // Array of standard conditions
        customConditions,     // Array of custom conditions
        allergies,           // Array of standard allergens
        customAllergies,     // Array of custom allergens
        welcomeCompleted: true,
        setupDate: new Date().toISOString()
      });
      console.log('Welcome: Settings saved successfully');
    } else {
      console.warn('Welcome: Chrome storage not available (testing mode)');
    }
    return true;
  } catch (error) {
    console.error('Welcome: Failed to save settings:', error);
    return false;
  }
}

// ===================================
// FINISH SETUP
// ===================================
async function finishSetup() {
  console.log('Welcome: Finishing setup...');

  // Validate email is provided
  const emailInput = document.getElementById('email-input');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email) {
    alert('Please enter your email address to continue.');
    emailInput?.focus();
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address.');
    emailInput?.focus();
    return;
  }

  // Save settings
  const success = await saveSettings();

  if (!success) {
    alert('Failed to save settings. Please try again.');
    return;
  }

  // Show celebration
  const celebration = document.getElementById('celebration');
  celebration.classList.remove('hidden');
  celebration.classList.add('active');

  // Close after 3 seconds
  setTimeout(() => {
    window.close();
  }, 3000);
}

// ===================================
// TOGGLE INSTRUCTIONS
// ===================================
function toggleInstructions() {
  const setupInstructions = document.getElementById('setup-instructions');
  const toggleBtn = document.getElementById('toggle-instructions');

  if (setupInstructions.classList.contains('hidden')) {
    setupInstructions.classList.remove('hidden');
    setupInstructions.classList.add('expanded');
    toggleBtn.textContent = '▼ Hide Setup Instructions';
    console.log('Welcome: Setup instructions expanded');
  } else {
    setupInstructions.classList.add('hidden');
    setupInstructions.classList.remove('expanded');
    toggleBtn.textContent = '▶ Show Me How to Enable AI';
    console.log('Welcome: Setup instructions collapsed');
  }
}

// ===================================
// BASIC MODE CONTINUATION
// ===================================
function continueWithBasicMode() {
  console.log('Welcome: User chose Basic Mode');
  useBasicMode = true;

  // Save basic mode preference (if Chrome API available)
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ useBasicMode: true });
  }

  // Continue to personalization
  goToStep(3);
}

// ===================================
// CUSTOM CONDITION MANAGEMENT
// ===================================
function addCustomCondition() {
  const input = document.getElementById('custom-condition-input');
  const conditionText = input.value.trim();

  if (!conditionText) {
    alert('Please enter a condition name.');
    return;
  }

  // Check for duplicates
  if (customConditions.includes(conditionText)) {
    alert('This condition has already been added.');
    input.value = '';
    return;
  }

  // Add to array
  customConditions.push(conditionText);

  // Create chip element
  const chipsList = document.getElementById('custom-conditions-list');
  const chip = document.createElement('div');
  chip.className = 'custom-chip';
  chip.innerHTML = `
    ${conditionText}
    <button type="button" data-condition="${conditionText}" aria-label="Remove ${conditionText}">×</button>
  `;

  // Add remove listener
  chip.querySelector('button').addEventListener('click', (e) => {
    removeCustomCondition(e.target.dataset.condition);
  });

  chipsList.appendChild(chip);
  input.value = '';

  console.log('Welcome: Added custom condition:', conditionText);
}

function removeCustomCondition(conditionText) {
  // Remove from array
  customConditions = customConditions.filter(c => c !== conditionText);

  // Remove chip from DOM
  const chipsList = document.getElementById('custom-conditions-list');
  const chips = chipsList.querySelectorAll('.custom-chip');
  chips.forEach(chip => {
    if (chip.textContent.trim().startsWith(conditionText)) {
      chip.remove();
    }
  });

  console.log('Welcome: Removed custom condition:', conditionText);
}

// ===================================
// CUSTOM ALLERGEN MANAGEMENT
// ===================================
function addCustomAllergen() {
  const input = document.getElementById('custom-allergen-input');
  const allergenText = input.value.trim();

  if (!allergenText) {
    alert('Please enter an allergen name.');
    return;
  }

  // Check for duplicates
  if (customAllergies.includes(allergenText)) {
    alert('This allergen has already been added.');
    input.value = '';
    return;
  }

  // Add to array
  customAllergies.push(allergenText);

  // Create chip element
  const chipsList = document.getElementById('custom-allergens-list');
  const chip = document.createElement('div');
  chip.className = 'custom-chip';
  chip.innerHTML = `
    ${allergenText}
    <button type="button" data-allergen="${allergenText}" aria-label="Remove ${allergenText}">×</button>
  `;

  // Add remove listener
  chip.querySelector('button').addEventListener('click', (e) => {
    removeCustomAllergen(e.target.dataset.allergen);
  });

  chipsList.appendChild(chip);
  input.value = '';

  console.log('Welcome: Added custom allergen:', allergenText);
}

function removeCustomAllergen(allergenText) {
  // Remove from array
  customAllergies = customAllergies.filter(a => a !== allergenText);

  // Remove chip from DOM
  const chipsList = document.getElementById('custom-allergens-list');
  const chips = chipsList.querySelectorAll('.custom-chip');
  chips.forEach(chip => {
    if (chip.textContent.trim().startsWith(allergenText)) {
      chip.remove();
    }
  });

  console.log('Welcome: Removed custom allergen:', allergenText);
}

// ===================================
// COPY TO CLIPBOARD
// ===================================
async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);

    // Visual feedback
    const originalText = button.textContent;
    button.textContent = '✓ Copied!';
    button.classList.add('copied');

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('copied');
    }, 2000);

    console.log(`Welcome: Copied to clipboard: ${text}`);
    return true;
  } catch (error) {
    console.error('Welcome: Failed to copy:', error);
    button.textContent = 'Failed';
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 2000);
    return false;
  }
}

// ===================================
// EVENT LISTENERS
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Welcome: Page loaded, initializing...');

  // Pre-check AI availability on load (for smart auto-skip)
  console.log('Welcome: Pre-checking AI availability...');
  aiStatusCache = await checkAIAvailability();
  console.log('Welcome: AI pre-check complete:', aiStatusCache);

  // Step 1: Next button
  document.getElementById('next-step-1')?.addEventListener('click', () => {
    goToStep(2);
  });

  // Step 2: Navigation buttons
  document.getElementById('prev-step-2')?.addEventListener('click', () => {
    goToStep(1);
  });

  document.getElementById('recheck-ai')?.addEventListener('click', () => {
    aiStatusCache = null; // Clear cache to force recheck
    updateAIStatus(true);
  });

  // Step 2: Toggle instructions
  document.getElementById('toggle-instructions')?.addEventListener('click', () => {
    toggleInstructions();
  });

  // Step 2: Basic Mode button
  document.getElementById('basic-mode-btn')?.addEventListener('click', () => {
    continueWithBasicMode();
  });

  // Step 2: Copy flag buttons
  document.querySelectorAll('.btn-copy-flag').forEach(button => {
    button.addEventListener('click', (e) => {
      const flagName = e.target.dataset.flag;
      copyToClipboard(flagName, e.target);
    });
  });

  // Step 3: Navigation buttons
  document.getElementById('prev-step-3')?.addEventListener('click', () => {
    goToStep(2);
  });

  document.getElementById('finish-setup')?.addEventListener('click', () => {
    finishSetup();
  });

  // Step 3: Custom condition input
  document.getElementById('add-condition-btn')?.addEventListener('click', () => {
    const inputGroup = document.getElementById('custom-condition-input-group');
    inputGroup.classList.toggle('hidden');
    if (!inputGroup.classList.contains('hidden')) {
      document.getElementById('custom-condition-input')?.focus();
    }
  });

  document.getElementById('add-condition-submit')?.addEventListener('click', () => {
    addCustomCondition();
  });

  document.getElementById('custom-condition-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomCondition();
    }
  });

  // Step 3: Custom allergen input
  document.getElementById('add-allergen-btn')?.addEventListener('click', () => {
    const inputGroup = document.getElementById('custom-allergen-input-group');
    inputGroup.classList.toggle('hidden');
    if (!inputGroup.classList.contains('hidden')) {
      document.getElementById('custom-allergen-input')?.focus();
    }
  });

  document.getElementById('add-allergen-submit')?.addEventListener('click', () => {
    addCustomAllergen();
  });

  document.getElementById('custom-allergen-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomAllergen();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Ignore Enter key when user is typing in input fields
    // This prevents accidentally advancing to next step while entering data
    if (e.key === 'Enter' && (
      e.target.id === 'first-name-input' ||
      e.target.id === 'custom-condition-input' ||
      e.target.id === 'custom-allergen-input'
    )) {
      // Don't advance to next step - let the specific input handler process it
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      if (currentStep < totalSteps) {
        // Only advance if on step 1, or if appropriate on step 2/3
        if (currentStep === 1) {
          goToStep(2);
        } else if (currentStep === 2) {
          // On step 2, Enter triggers Basic Mode continuation
          continueWithBasicMode();
        } else if (currentStep === 3) {
          finishSetup();
        }
      } else {
        finishSetup();
      }
    } else if (e.key === 'ArrowLeft') {
      if (currentStep > 1) {
        goToStep(currentStep - 1);
      }
    }
  });

  // Load existing settings (if returning to welcome page)
  loadExistingSettings();

  console.log('Welcome: Initialization complete');
});

// ===================================
// LOAD EXISTING SETTINGS
// ===================================
async function loadExistingSettings() {
  try {
    // Check if Chrome storage is available
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.warn('Welcome: Chrome storage not available, using defaults');
      return;
    }

    const result = await chrome.storage.local.get([
      'welcomeCompleted',
      'firstName', 'email',
      'condition', 'conditions', 'customConditions',
      'allergies', 'customAllergies'
    ]);

    // Only load settings if user has completed onboarding before
    if (!result.welcomeCompleted) {
      console.log('Welcome: First-time user, not loading existing settings');
      return; // Exit early for first-time users
    }

    console.log('Welcome: Returning user, loading existing settings');

    // Load first name if available
    if (result.firstName) {
      const firstNameInput = document.getElementById('first-name-input');
      if (firstNameInput) {
        firstNameInput.value = result.firstName;
        console.log(`Welcome: Pre-filled name: ${result.firstName}`);
      }
    }

    // Load email if available
    if (result.email) {
      const emailInput = document.getElementById('email-input');
      if (emailInput) {
        emailInput.value = result.email;
        console.log(`Welcome: Pre-filled email: ${result.email}`);
      }
    }

    // === BACKWARD COMPATIBILITY: Migrate old single condition to array ===
    let conditionsToLoad = result.conditions || [];
    if (!conditionsToLoad.length && result.condition) {
      conditionsToLoad = [result.condition];
      console.log('Welcome: Migrated old condition to array:', result.condition);
    }

    // Load standard conditions (checkboxes)
    if (conditionsToLoad.length > 0) {
      conditionsToLoad.forEach(condition => {
        // Convert condition name to ID format: remove slashes, spaces, and lowercase
        const conditionId = condition.toLowerCase().replace(/\//g, '').replace(/\s+/g, '');
        const conditionInput = document.getElementById(`condition-${conditionId}`);
        if (conditionInput) {
          conditionInput.checked = true;
        } else {
          console.warn(`Welcome: Could not find checkbox for condition: ${condition} (ID: condition-${conditionId})`);
        }
      });
      console.log(`Welcome: Pre-selected conditions: ${conditionsToLoad.join(', ')}`);
    }

    // Load custom conditions
    if (result.customConditions && result.customConditions.length > 0) {
      customConditions = [...result.customConditions]; // Copy to global state
      const chipsList = document.getElementById('custom-conditions-list');

      result.customConditions.forEach(conditionText => {
        const chip = document.createElement('div');
        chip.className = 'custom-chip';
        chip.innerHTML = `
          ${conditionText}
          <button type="button" data-condition="${conditionText}" aria-label="Remove ${conditionText}">×</button>
        `;
        chip.querySelector('button').addEventListener('click', (e) => {
          removeCustomCondition(e.target.dataset.condition);
        });
        chipsList.appendChild(chip);
      });
      console.log(`Welcome: Pre-loaded custom conditions: ${result.customConditions.join(', ')}`);
    }

    // Load standard allergies (checkboxes)
    if (result.allergies && result.allergies.length > 0) {
      result.allergies.forEach(allergen => {
        const allergenInput = document.querySelector(`input[name="allergen"][value="${allergen}"]`);
        if (allergenInput) {
          allergenInput.checked = true;
        }
      });
      console.log(`Welcome: Pre-selected allergies: ${result.allergies.join(', ')}`);
    }

    // Load custom allergens
    if (result.customAllergies && result.customAllergies.length > 0) {
      customAllergies = [...result.customAllergies]; // Copy to global state
      const chipsList = document.getElementById('custom-allergens-list');

      result.customAllergies.forEach(allergenText => {
        const chip = document.createElement('div');
        chip.className = 'custom-chip';
        chip.innerHTML = `
          ${allergenText}
          <button type="button" data-allergen="${allergenText}" aria-label="Remove ${allergenText}">×</button>
        `;
        chip.querySelector('button').addEventListener('click', (e) => {
          removeCustomAllergen(e.target.dataset.allergen);
        });
        chipsList.appendChild(chip);
      });
      console.log(`Welcome: Pre-loaded custom allergens: ${result.customAllergies.join(', ')}`);
    }
  } catch (error) {
    console.error('Welcome: Failed to load existing settings:', error);
  }
}

// ===================================
// PAGE VISIBILITY HANDLING
// ===================================
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && currentStep === 2) {
    // Recheck AI when user returns to step 2
    setTimeout(updateAIStatus, 1000);
  }
});

console.log('Welcome: Script loaded successfully');
