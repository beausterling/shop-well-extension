// Shop Well Welcome/Onboarding Page JavaScript
// 3-Step Simplified Onboarding Flow

// ===================================
// STATE MANAGEMENT
// ===================================
let currentStep = 1;
const totalSteps = 3;

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
async function updateAIStatus() {
  console.log('Welcome: Checking AI status...');

  const statusCard = document.getElementById('ai-status-card');
  const statusIcon = document.getElementById('status-icon');
  const statusTitle = document.getElementById('status-title');
  const statusMessage = document.getElementById('status-message');
  const setupInstructions = document.getElementById('setup-instructions');
  const recheckBtn = document.getElementById('recheck-ai');
  const nextBtn = document.getElementById('next-step-2');

  // Show checking state
  statusCard.className = 'ai-status-card checking';
  statusIcon.innerHTML = '<div class="spinner"></div>';
  statusTitle.textContent = 'Checking Chrome AI...';
  statusMessage.textContent = 'Please wait while we detect AI availability';
  setupInstructions.classList.add('hidden');

  try {
    const aiStatus = await checkAIAvailability();
    console.log('Welcome: AI Status Result:', aiStatus);

    if (aiStatus.available && aiStatus.summarizer && aiStatus.prompt) {
      // ✅ AI is fully ready - SUCCESS!
      statusCard.className = 'ai-status-card ready';
      statusIcon.innerHTML = '✅';
      statusTitle.textContent = 'Chrome AI is Ready!';
      statusMessage.textContent = 'Enhanced wellness analysis is available. Auto-advancing to next step...';

      // Hide instructions, show next button
      setupInstructions.classList.add('hidden');
      recheckBtn.classList.add('hidden');
      nextBtn.classList.remove('hidden');

      // Auto-advance after 2 seconds
      setTimeout(() => {
        goToStep(3);
      }, 2000);

    } else if (aiStatus.available) {
      // ⚠️ Partial AI availability
      statusCard.className = 'ai-status-card not-ready';
      statusIcon.innerHTML = '⚠️';
      statusTitle.textContent = 'Chrome AI Partially Available';
      statusMessage.textContent = 'Please complete the setup instructions below.';
      setupInstructions.classList.remove('hidden');

    } else {
      // ❌ No AI available
      statusCard.className = 'ai-status-card not-ready';
      statusIcon.innerHTML = '❌';
      statusTitle.textContent = 'Chrome AI Not Available';
      statusMessage.textContent = aiStatus.error || 'Follow the setup instructions below to enable AI features.';
      setupInstructions.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Welcome: AI status check failed:', error);
    statusCard.className = 'ai-status-card not-ready';
    statusIcon.innerHTML = '❌';
    statusTitle.textContent = 'Status Check Failed';
    statusMessage.textContent = 'Unable to check AI status. Please try again.';
    setupInstructions.classList.remove('hidden');
  }
}

// ===================================
// STEP NAVIGATION
// ===================================
function goToStep(stepNumber) {
  if (stepNumber < 1 || stepNumber > totalSteps) return;

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

  // Trigger AI check when entering step 2
  if (currentStep === 2) {
    setTimeout(updateAIStatus, 300);
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  console.log(`Welcome: Navigated to step ${currentStep}`);
}

// ===================================
// SETTINGS SAVE (Step 3)
// ===================================
async function saveSettings() {
  // Get selected condition
  const conditionInput = document.querySelector('input[name="condition"]:checked');
  const condition = conditionInput ? conditionInput.value : 'POTS'; // Default to POTS

  // Get selected allergens
  const allergenInputs = document.querySelectorAll('input[name="allergen"]:checked');
  const allergies = Array.from(allergenInputs).map(input => input.value);

  console.log('Welcome: Saving settings:', { condition, allergies });

  try {
    // Save to Chrome storage
    await chrome.storage.local.set({
      condition,
      allergies,
      welcomeCompleted: true,
      setupDate: new Date().toISOString()
    });

    console.log('Welcome: Settings saved successfully');
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
document.addEventListener('DOMContentLoaded', () => {
  console.log('Welcome: Page loaded, initializing...');

  // Step 1: Next button
  document.getElementById('next-step-1')?.addEventListener('click', () => {
    goToStep(2);
  });

  // Step 2: Navigation buttons
  document.getElementById('prev-step-2')?.addEventListener('click', () => {
    goToStep(1);
  });

  document.getElementById('next-step-2')?.addEventListener('click', () => {
    goToStep(3);
  });

  document.getElementById('recheck-ai')?.addEventListener('click', () => {
    updateAIStatus();
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

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      if (currentStep < totalSteps) {
        // Only advance if on step 1, or if AI is ready on step 2
        if (currentStep === 1) {
          goToStep(2);
        } else if (currentStep === 2) {
          const nextBtn = document.getElementById('next-step-2');
          if (!nextBtn.classList.contains('hidden')) {
            goToStep(3);
          }
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
    const result = await chrome.storage.local.get(['condition', 'allergies']);

    if (result.condition) {
      const conditionInput = document.getElementById(`condition-${result.condition.toLowerCase().replace(/\//g, '')}`);
      if (conditionInput) {
        conditionInput.checked = true;
        console.log(`Welcome: Pre-selected condition: ${result.condition}`);
      }
    } else {
      // Default to POTS if no condition saved
      const potsInput = document.getElementById('condition-pots');
      if (potsInput) {
        potsInput.checked = true;
      }
    }

    if (result.allergies && result.allergies.length > 0) {
      result.allergies.forEach(allergen => {
        const allergenInput = document.querySelector(`input[name="allergen"][value="${allergen}"]`);
        if (allergenInput) {
          allergenInput.checked = true;
        }
      });
      console.log(`Welcome: Pre-selected allergies: ${result.allergies.join(', ')}`);
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
