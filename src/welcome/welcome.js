// Shop Well Welcome Page JavaScript

let currentStep = 1;
const totalSteps = 4;

// AI Detection (copied from options.js)
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
          LanguageModel.availability({ language: 'en' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        result.prompt = availability === 'readily';
        result.details.prompt = { available: availability };
        result.available = true;
        console.log('Welcome: LanguageModel found, availability:', availability);
      } catch (error) {
        console.warn('Welcome: LanguageModel availability check failed:', error);
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
          Summarizer.availability({ language: 'en' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        result.summarizer = availability === 'readily';
        result.details.summarizer = { available: availability };
        result.available = true;
        console.log('Welcome: Summarizer found, availability:', availability);
      } catch (error) {
        console.warn('Welcome: Summarizer availability check failed:', error);
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

    if (!result.summarizer && !result.prompt) {
      result.error = 'Chrome AI APIs are not ready. Please check Chrome flags and try again. Models may still be downloading.';
    }

  } catch (error) {
    result.error = `AI detection failed: ${error.message}`;
    console.error('Welcome: AI detection error:', error);
  }

  return result;
}

async function updateAIStatus() {
  console.log('Welcome: Checking AI status...');

  const statusElement = document.getElementById('ai-status');
  statusElement.className = 'ai-status-indicator ai-status-checking';
  statusElement.innerHTML = `
    <div class="status-spinner"></div>
    <span>Checking Chrome AI availability...</span>
  `;

  try {
    const aiStatus = await checkAIAvailability();
    console.log('Welcome: AI Status Result:', aiStatus);

    if (aiStatus.available && aiStatus.summarizer && aiStatus.prompt) {
      // AI is fully ready
      statusElement.className = 'ai-status-indicator ai-status-ready';
      statusElement.innerHTML = `
        <span>✅</span>
        <span>Chrome AI is ready! Enhanced analysis is available.</span>
      `;

      // Auto-advance to next step after a delay
      setTimeout(() => {
        nextStep();
      }, 2000);

    } else if (aiStatus.available) {
      // Partial AI availability
      statusElement.className = 'ai-status-indicator ai-status-not-ready';
      statusElement.innerHTML = `
        <span>⚠️</span>
        <span>Chrome AI partially available. Please complete the setup below.</span>
      `;
    } else {
      // No AI available
      statusElement.className = 'ai-status-indicator ai-status-not-ready';
      statusElement.innerHTML = `
        <span>❌</span>
        <span>${aiStatus.error || 'Chrome AI not available. Follow the setup instructions below.'}</span>
      `;
    }
  } catch (error) {
    console.error('Welcome: AI status check failed:', error);
    statusElement.className = 'ai-status-indicator ai-status-not-ready';
    statusElement.innerHTML = `
      <span>❌</span>
      <span>Failed to check AI status. Please try again.</span>
    `;
  }
}

function updateStepVisibility() {
  // Hide all step content
  for (let i = 1; i <= totalSteps; i++) {
    document.getElementById(`step${i}-content`).classList.add('hidden');
  }

  // Show current step content
  document.getElementById(`step${currentStep}-content`).classList.remove('hidden');

  // Update step circles
  for (let i = 1; i <= totalSteps; i++) {
    const circle = document.getElementById(`step${i}-circle`);
    circle.classList.remove('active', 'completed');

    if (i < currentStep) {
      circle.classList.add('completed');
      circle.innerHTML = '✓';
    } else if (i === currentStep) {
      circle.classList.add('active');
      circle.innerHTML = i;
    } else {
      circle.innerHTML = i;
    }
  }

  // Update navigation buttons
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const finishBtn = document.getElementById('finish-btn');

  prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';

  if (currentStep === totalSteps) {
    nextBtn.classList.add('hidden');
    finishBtn.classList.remove('hidden');
  } else {
    nextBtn.classList.remove('hidden');
    finishBtn.classList.add('hidden');
  }
}

function nextStep() {
  if (currentStep < totalSteps) {
    currentStep++;
    updateStepVisibility();

    // Trigger AI check when entering step 2
    if (currentStep === 2) {
      updateAIStatus();
    }
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepVisibility();
  }
}

function setupCopyButtons() {
  document.querySelectorAll('.copy-flag-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const flagText = e.target.dataset.flag;

      try {
        await navigator.clipboard.writeText(flagText);

        // Visual feedback
        const originalText = e.target.textContent;
        e.target.textContent = '✓ Copied!';
        e.target.classList.add('copied');

        setTimeout(() => {
          e.target.textContent = originalText;
          e.target.classList.remove('copied');
        }, 2000);

      } catch (error) {
        console.error('Failed to copy flag:', error);
        e.target.textContent = 'Failed';
        setTimeout(() => {
          e.target.textContent = 'Copy';
        }, 2000);
      }
    });
  });
}

function openNewTab() {
  try {
    // Open a blank new tab/window
    window.open('about:blank', '_blank');
  } catch (error) {
    console.error('Failed to open new tab:', error);
    alert('Please manually open a new tab (Ctrl+T or Cmd+T) and continue with step 2.');
  }
}

async function copyFlagsUrl() {
  const urlInput = document.getElementById('flags-url');
  const copyBtn = document.getElementById('copy-flags-url');

  try {
    // Select the text in the input
    urlInput.select();
    urlInput.setSelectionRange(0, 99999); // For mobile devices

    // Copy to clipboard
    await navigator.clipboard.writeText(urlInput.value);

    // Visual feedback
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied!';
    copyBtn.classList.add('copied');

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.classList.remove('copied');
    }, 2000);

  } catch (error) {
    console.error('Failed to copy URL:', error);

    // Fallback: try to use the older method
    try {
      urlInput.select();
      document.execCommand('copy');

      copyBtn.textContent = '✓ Copied!';
      copyBtn.classList.add('copied');

      setTimeout(() => {
        copyBtn.textContent = 'Copy URL';
        copyBtn.classList.remove('copied');
      }, 2000);
    } catch (fallbackError) {
      copyBtn.textContent = 'Select & Copy';
      setTimeout(() => {
        copyBtn.textContent = 'Copy URL';
      }, 2000);
    }
  }
}


function finishSetup() {
  // Mark setup as completed in storage
  chrome.storage.local.set({
    welcomeCompleted: true,
    setupDate: new Date().toISOString()
  });

  // Close the welcome tab
  window.close();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('Welcome page loaded');

  updateStepVisibility();
  setupCopyButtons();

  // Navigation buttons
  document.getElementById('next-btn').addEventListener('click', nextStep);
  document.getElementById('prev-btn').addEventListener('click', prevStep);
  document.getElementById('finish-btn').addEventListener('click', finishSetup);

  // New tab and copy URL buttons
  document.getElementById('open-new-tab').addEventListener('click', openNewTab);
  document.getElementById('copy-flags-url').addEventListener('click', copyFlagsUrl);

  // AI recheck button
  document.getElementById('recheck-ai').addEventListener('click', updateAIStatus);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      if (currentStep === totalSteps) {
        finishSetup();
      } else {
        nextStep();
      }
    } else if (e.key === 'ArrowLeft') {
      prevStep();
    }
  });
});

// Handle page visibility changes to recheck AI when user returns
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && currentStep === 2) {
    // Small delay to allow any Chrome restart to complete
    setTimeout(updateAIStatus, 1000);
  }
});