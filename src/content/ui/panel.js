// Shop Well UI Panel - Displays analysis results to users

export class ShopWellPanel {
  constructor() {
    this.panel = null;
    this.isVisible = false;
    this.isLoading = false;
  }

  // Create and inject the panel into the page
  create() {
    if (this.panel) return this.panel;

    console.log('Shop Well: Creating UI panel...');

    // Create main panel container
    this.panel = document.createElement('div');
    this.panel.id = 'shop-well-panel';
    this.panel.className = 'shop-well-panel hidden';

    // Build panel HTML structure
    this.panel.innerHTML = `
      <div class="shop-well-header">
        <div class="shop-well-logo">
          <span class="shop-well-icon">🌿</span>
          <span class="shop-well-title">Shop Well</span>
        </div>
        <button class="shop-well-close" title="Close panel (Ctrl+Shift+S / Cmd+Shift+S)" aria-label="Close Shop Well panel">
          <span class="close-icon" aria-hidden="true">×</span>
        </button>
      </div>

      <div class="shop-well-content">
        <div class="shop-well-loading hidden">
          <div class="loading-spinner"></div>
          <p>Analyzing product...</p>
        </div>

        <div class="shop-well-setup hidden">
          <div class="setup-icon">⚙️</div>
          <h3>Chrome AI Setup Required</h3>
          <p>Enable Chrome's Built-in AI for enhanced analysis:</p>
          <ol>
            <li>Open <button class="copy-link" data-url="chrome://flags">chrome://flags</button></li>
            <li>Enable these flags:
              <ul>
                <li><button class="copy-flag" data-flag="optimization-guide-on-device-model">optimization-guide-on-device-model</button></li>
                <li><button class="copy-flag" data-flag="prompt-api-for-gemini-nano">prompt-api-for-gemini-nano</button></li>
                <li><button class="copy-flag" data-flag="summarization-api-for-gemini-nano">summarization-api-for-gemini-nano</button></li>
              </ul>
            </li>
            <li>Restart Chrome and refresh this page</li>
          </ol>
          <div class="setup-note">
            <strong>Note:</strong> Requires Chrome 128+ with 4GB+ RAM
          </div>
        </div>

        <div class="shop-well-analysis hidden">
          <div class="analysis-header">
            <div class="verdict-badge"></div>
            <div class="condition-info"></div>
          </div>

          <div class="analysis-content">
            <div class="key-insights">
              <h4>Key Insights</h4>
              <ul class="insights-list"></ul>
            </div>

            <div class="allergen-alerts hidden">
              <h4>Allergen Alert</h4>
              <div class="alert-content"></div>
            </div>

            <div class="important-caveat hidden">
              <h4>Important:</h4>
              <div class="caveat-content"></div>
            </div>
          </div>

          <div class="analysis-footer">
            <div class="confidence-indicator">
              <span class="confidence-label">Analysis Confidence:</span>
              <span class="confidence-value"></span>
            </div>
          </div>
        </div>

        <div class="shop-well-error hidden" role="alert" aria-labelledby="error-title">
          <div class="error-icon" aria-hidden="true">⚠️</div>
          <h3 id="error-title">Analysis Failed</h3>
          <p class="error-message"></p>
          <button class="retry-button" aria-label="Retry analysis">Try Again</button>
        </div>
      </div>

      <div class="shop-well-footer" role="contentinfo">
        <div class="disclaimer">
          <small>ℹ️ Informational only - not medical advice. Always verify ingredients yourself.</small>
        </div>
      </div>
    `;

    // Add event listeners
    this.setupEventListeners();

    // Inject into page
    document.body.appendChild(this.panel);

    console.log('Shop Well: Panel created successfully');
    return this.panel;
  }

  setupEventListeners() {
    if (!this.panel) return;

    // Close button
    const closeBtn = this.panel.querySelector('.shop-well-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Copy buttons for setup
    this.panel.querySelectorAll('.copy-link, .copy-flag').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = e.target.dataset.url || e.target.dataset.flag;
        navigator.clipboard.writeText(text).then(() => {
          e.target.textContent = ' Copied!';
          setTimeout(() => {
            e.target.textContent = text;
          }, 2000);
        });
      });
    });

    // Retry button
    const retryBtn = this.panel.querySelector('.retry-button');
    retryBtn?.addEventListener('click', () => {
      this.showLoading();
      // Emit retry event that content script can listen to
      window.dispatchEvent(new CustomEvent('shop-well-retry'));
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (this.isVisible && !this.panel.contains(e.target)) {
        this.hide();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  // Show loading state
  showLoading() {
    if (!this.panel) this.create();

    this.hideAllStates();
    this.panel.querySelector('.shop-well-loading').classList.remove('hidden');
    this.isLoading = true;
    this.show();

    console.log('Shop Well: Showing loading state');
  }

  // Show Chrome AI setup instructions
  showSetup() {
    if (!this.panel) this.create();

    this.hideAllStates();
    this.panel.querySelector('.shop-well-setup').classList.remove('hidden');
    this.isLoading = false;
    this.show();

    console.log('Shop Well: Showing setup instructions');
  }

  // Show analysis results
  showAnalysis(analysisData) {
    if (!this.panel) this.create();

    console.log('Shop Well: Displaying analysis results:', analysisData);

    this.hideAllStates();
    const analysisSection = this.panel.querySelector('.shop-well-analysis');
    analysisSection.classList.remove('hidden');

    // Update verdict badge
    const verdictBadge = analysisSection.querySelector('.verdict-badge');
    const verdict = analysisData.verdict || 'unknown';
    verdictBadge.className = `verdict-badge verdict-${verdict}`;

    const verdictText = {
      'helpful': '✅ Helpful',
      'mixed': '⚠️ Mixed Results',
      'not_ideal': '❌ Not Ideal',
      'unknown': '❓ Analysis Incomplete'
    };

    // Update condition info
    const conditionInfo = analysisSection.querySelector('.condition-info');
    const condition = analysisData.condition || 'your condition';
    conditionInfo.textContent = `For ${condition}`;

    // Update insights
    const insightsList = analysisSection.querySelector('.insights-list');
    insightsList.innerHTML = '';

    if (analysisData.bullets && analysisData.bullets.length > 0) {
      analysisData.bullets.forEach(bullet => {
        const li = document.createElement('li');
        li.textContent = bullet;
        insightsList.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'Basic analysis complete. Enable Chrome AI for detailed insights.';
      li.className = 'fallback-insight';
      insightsList.appendChild(li);
    }

    // Show allergen alerts if any
    const allergenSection = analysisSection.querySelector('.allergen-alerts');
    if (analysisData.allergen_alert && analysisData.allergen_warnings?.length > 0) {
      allergenSection.classList.remove('hidden');
      const alertContent = allergenSection.querySelector('.alert-content');
      alertContent.textContent = `Contains: ${analysisData.allergen_warnings.join(', ')}`;
    }

    // Show caveat if any
    const caveatSection = analysisSection.querySelector('.important-caveat');
    if (analysisData.caveat) {
      caveatSection.classList.remove('hidden');
      const caveatContent = caveatSection.querySelector('.caveat-content');
      caveatContent.textContent = analysisData.caveat;
    }

    // Update confidence indicator
    const confidenceValue = analysisSection.querySelector('.confidence-value');
    const confidence = analysisData.confidence || 'low';
    confidenceValue.textContent = confidence.charAt(0).toUpperCase() + confidence.slice(1);
    confidenceValue.className = `confidence-value confidence-${confidence}`;

    this.isLoading = false;
    this.show();
  }

  // Show error state
  showError(errorMessage) {
    if (!this.panel) this.create();

    this.hideAllStates();
    const errorSection = this.panel.querySelector('.shop-well-error');
    errorSection.classList.remove('hidden');

    const errorMessageEl = errorSection.querySelector('.error-message');
    errorMessageEl.textContent = errorMessage || 'Unable to analyze this product. Please try again.';

    this.isLoading = false;
    this.show();

    console.warn('Shop Well: Showing error state:', errorMessage);
  }

  // Hide all content states
  hideAllStates() {
    if (!this.panel) return;

    const states = ['.shop-well-loading', '.shop-well-setup', '.shop-well-analysis', '.shop-well-error'];
    states.forEach(selector => {
      const element = this.panel.querySelector(selector);
      if (element) element.classList.add('hidden');
    });
  }

  // Show the panel
  show() {
    if (!this.panel) this.create();

    this.panel.classList.remove('hidden');
    this.panel.classList.add('visible');
    this.isVisible = true;

    // Animate in
    setTimeout(() => {
      this.panel.classList.add('animate-in');
    }, 10);

    // Auto-focus close button for accessibility
    setTimeout(() => {
      const closeBtn = this.panel.querySelector('.shop-well-close');
      if (closeBtn) closeBtn.focus();
    }, 350); // After animation completes

    console.log('Shop Well: Panel shown');
  }

  // Hide the panel
  hide() {
    if (!this.panel || !this.isVisible) return;

    this.panel.classList.remove('animate-in');
    this.panel.classList.add('animate-out');

    setTimeout(() => {
      if (this.panel) {
        this.panel.classList.add('hidden');
        this.panel.classList.remove('visible', 'animate-out');
        this.isVisible = false;
      }
    }, 300);

    console.log('Shop Well: Panel hidden');
  }

  // Toggle panel visibility
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      // Default to showing setup if no analysis yet
      this.showSetup();
    }
  }

  // Update with new analysis data
  update(analysisData) {
    console.log('Shop Well: Updating panel with new data');
    this.showAnalysis(analysisData);
  }

  // Check if panel exists
  exists() {
    return !!this.panel;
  }

  // Destroy the panel
  destroy() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
      this.isVisible = false;
      this.isLoading = false;
      console.log('Shop Well: Panel destroyed');
    }
  }
}