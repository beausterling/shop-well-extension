// Shop Well Test Panel - UI State Manager
// Allows toggling between different UI states for testing

console.log('🧪 Shop Well Test Panel initialized');

// UI State elements
const states = {
  welcome: document.querySelector('.shop-well-welcome'),
  loading: document.querySelector('.shop-well-loading'),
  setup: document.querySelector('.shop-well-setup'),
  analysis: document.querySelector('.shop-well-analysis'),
  error: document.querySelector('.shop-well-error')
};

// Test control buttons
const testButtons = document.querySelectorAll('.test-btn');

// Function to show a specific state
function showState(stateName) {
  console.log(`🎨 Showing state: ${stateName}`);

  // Hide all states
  Object.values(states).forEach(element => {
    if (element) {
      element.classList.add('hidden');
    }
  });

  // Show the requested state
  if (states[stateName]) {
    states[stateName].classList.remove('hidden');
  }

  // Update active button
  testButtons.forEach(btn => {
    if (btn.dataset.state === stateName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Add click handlers to test buttons
testButtons.forEach(button => {
  button.addEventListener('click', () => {
    const stateName = button.dataset.state;
    showState(stateName);
  });
});

// Optional: Cycle through allergen alerts visibility for testing
const allergenSection = document.querySelector('.allergen-alerts');
const caveatSection = document.querySelector('.important-caveat');

// Toggle allergen/caveat visibility in analysis state
let showAllergens = true;
let showCaveat = false;

function toggleAnalysisExtras() {
  if (allergenSection) {
    allergenSection.classList.toggle('hidden', !showAllergens);
  }
  if (caveatSection) {
    caveatSection.classList.toggle('hidden', !showCaveat);
  }
}

// Button handlers for copy links (setup state)
document.querySelectorAll('.copy-link').forEach(link => {
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    const url = link.dataset.url;

    try {
      await navigator.clipboard.writeText(url);
      const originalText = link.textContent;
      link.textContent = '✓ Copied!';

      setTimeout(() => {
        link.textContent = originalText;
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert(`Copy this URL: ${url}`);
    }
  });
});

// Mock button handlers (these don't do anything in test mode)
const checkAIButton = document.getElementById('checkAIButton');
const refreshButton = document.getElementById('refreshAnalysis');
const retryButton = document.getElementById('retryAnalysis');

if (checkAIButton) {
  checkAIButton.addEventListener('click', () => {
    console.log('🧪 Test: Check AI button clicked');
    alert('This is a test panel - AI check would happen in production');
  });
}

if (refreshButton) {
  refreshButton.addEventListener('click', () => {
    console.log('🧪 Test: Refresh analysis button clicked');

    // Show loading state briefly, then return to analysis
    showState('loading');
    setTimeout(() => {
      showState('analysis');

      // Toggle allergen/caveat visibility for variety
      showAllergens = !showAllergens;
      showCaveat = !showCaveat;
      toggleAnalysisExtras();
    }, 1500);
  });
}

if (retryButton) {
  retryButton.addEventListener('click', () => {
    console.log('🧪 Test: Retry button clicked');
    showState('loading');
    setTimeout(() => {
      showState('analysis');
    }, 1000);
  });
}

// Initialize with welcome state
showState('welcome');
toggleAnalysisExtras();

// Keyboard shortcuts for quick state switching (developer convenience)
document.addEventListener('keydown', (e) => {
  // Only respond to number keys 1-5 when not in an input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }

  const keyToState = {
    '1': 'welcome',
    '2': 'loading',
    '3': 'setup',
    '4': 'analysis',
    '5': 'error'
  };

  if (keyToState[e.key]) {
    showState(keyToState[e.key]);
  }
});

console.log('🧪 Test Panel Tips:');
console.log('  - Click buttons above to toggle UI states');
console.log('  - Or press keys 1-5 to quickly switch states');
console.log('  - State 1: Welcome');
console.log('  - State 2: Loading');
console.log('  - State 3: Setup');
console.log('  - State 4: Analysis');
console.log('  - State 5: Error');
