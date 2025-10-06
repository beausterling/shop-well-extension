// Shop Well Side Panel - AI-Powered Wellness Analysis
// All logic inline for compatibility (will be bundled later)

/* =============================================================================
   LANGUAGE UTILITIES
   ============================================================================= */

const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'ja': 'Japanese',
  'fr': 'French',
  'de': 'German'
};

async function getUserLanguage() {
  try {
    const settings = await chrome.storage.local.get(['languagePreference']);
    const preference = settings.languagePreference || 'auto';
    let languageCode;

    if (preference === 'auto') {
      const browserLang = navigator.language || navigator.userLanguage || 'en';
      const primaryLang = browserLang.split('-')[0].toLowerCase();
      languageCode = SUPPORTED_LANGUAGES[primaryLang] ? primaryLang : 'en';
    } else {
      languageCode = preference;
    }

    if (!SUPPORTED_LANGUAGES[languageCode]) {
      console.warn(`Shop Well: Unsupported language '${languageCode}', falling back to English`);
      languageCode = 'en';
    }

    return {
      code: languageCode,
      name: SUPPORTED_LANGUAGES[languageCode],
      isAuto: preference === 'auto'
    };
  } catch (error) {
    console.error('Shop Well: Language detection failed:', error);
    return { code: 'en', name: 'English', isAuto: false };
  }
}

function getLanguageInstruction(languageCode) {
  const languageName = SUPPORTED_LANGUAGES[languageCode] || 'English';
  return `Your response must be in ${languageName}.`;
}

/* =============================================================================
   TIMEOUT UTILITIES
   ============================================================================= */

class TimeoutError extends Error {
  constructor(message, operation) {
    super(message);
    this.name = 'TimeoutError';
    this.operation = operation;
  }
}

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within the
 * specified time, it rejects with a TimeoutError.
 *
 * @param {Promise} promise - The promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operation - Description of the operation (for error messages)
 * @returns {Promise} The wrapped promise
 */
function withTimeout(promise, timeoutMs, operation = 'Operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(
          `${operation} timed out after ${timeoutMs}ms`,
          operation
        ));
      }, timeoutMs);
    })
  ]);
}

/* =============================================================================
   AI AVAILABILITY DETECTION
   ============================================================================= */

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
    if (typeof window.ai !== 'undefined' && typeof window.ai.languageModel !== 'undefined') {
      try {
        const availability = await window.ai.languageModel.capabilities();
        result.prompt = availability.available === 'readily';
        result.details.prompt = { available: availability.available };
        result.available = true;
        console.log('Shop Well: LanguageModel found, availability:', availability.available);
      } catch (error) {
        console.warn('Shop Well: LanguageModel availability check failed:', error);
        result.details.promptError = error.message;
      }
    }

    // Check for Summarizer API
    if (typeof window.ai !== 'undefined' && typeof window.ai.summarizer !== 'undefined') {
      try {
        const availability = await window.ai.summarizer.capabilities();
        result.summarizer = availability.available === 'readily';
        result.details.summarizer = { available: availability.available };
        result.available = true;
        console.log('Shop Well: Summarizer found, availability:', availability.available);
      } catch (error) {
        console.warn('Shop Well: Summarizer availability check failed:', error);
        result.details.summarizerError = error.message;
      }
    }

    // If no APIs are available at all
    if (!result.available) {
      result.error = 'Chrome Built-in AI not available. Please enable the Chrome AI flags and restart Chrome completely.';
      return result;
    }

    // Overall assessment
    if (!result.summarizer && !result.prompt) {
      result.error = 'Chrome AI APIs are not ready. Please ensure all three flags are enabled and restart Chrome completely.';
    } else if (!result.summarizer) {
      result.error = 'Summarizer API not available. Enable the summarization-api-for-gemini-nano flag and restart Chrome.';
    } else if (!result.prompt) {
      result.error = 'Prompt API not available. Enable the prompt-api-for-gemini-nano flag and restart Chrome.';
    }

  } catch (error) {
    result.error = `AI detection failed: ${error.message}`;
    console.error('Shop Well: AI detection error:', error);
  }

  return result;
}

function canUseAIAnalysis(availability) {
  return availability.available && (availability.summarizer || availability.prompt);
}

/* =============================================================================
   AI SUMMARIZER - Extract Product Facts
   ============================================================================= */

async function summarizeProduct(productData) {
  try {
    console.log('Shop Well: Starting AI summarization...');

    if (typeof window.ai === 'undefined' || typeof window.ai.summarizer === 'undefined') {
      console.warn('Shop Well: Summarizer API not available');
      return null;
    }

    const language = await getUserLanguage();
    console.log('Shop Well: Summarizing in:', language.code, `(${language.name})`);

    const inputText = prepareInputText(productData);
    if (!inputText) {
      console.warn('Shop Well: No suitable content for summarization');
      return null;
    }

    console.log('Shop Well: Summarizer input length:', inputText.length);

    // Wrap AI calls with 30-second timeout to prevent hanging
    const summarizer = await withTimeout(
      window.ai.summarizer.create({
        sharedContext: 'Extract key wellness and dietary information from this product.',
        type: 'key-points',
        format: 'plain-text',
        length: 'short'
      }),
      30000,
      'Summarizer creation'
    );

    const summary = await withTimeout(
      summarizer.summarize(inputText),
      30000,
      'Product summarization'
    );
    console.log('Shop Well: Raw summarizer output:', summary);

    const facts = parseStructuredFacts(summary, productData);
    console.log('Shop Well: Extracted facts:', facts);

    return facts;

  } catch (error) {
    if (error instanceof TimeoutError) {
      console.error('Shop Well: Summarization timed out:', error.operation);
      console.warn('Shop Well: AI models may still be downloading or Chrome needs restart');
    } else {
      console.error('Shop Well: Summarization failed:', error);
    }
    return null;
  }
}

function prepareInputText(productData) {
  const sections = [];

  if (productData.title) {
    sections.push(`PRODUCT: ${productData.title}`);
  }

  if (productData.bullets && productData.bullets.length > 0) {
    sections.push(`FEATURES: ${productData.bullets.slice(0, 5).join('; ')}`);
  }

  if (productData.ingredients) {
    sections.push(`INGREDIENTS: ${productData.ingredients}`);
  }

  if (productData.description) {
    const truncatedDesc = productData.description.substring(0, 800);
    sections.push(`DESCRIPTION: ${truncatedDesc}`);
  }

  const inputText = sections.join('\n\n');

  if (inputText.length > 2800) {
    return inputText.substring(0, 2800) + '...';
  }

  return inputText;
}

function parseStructuredFacts(summary, productData) {
  const facts = {
    high_sodium: false,
    high_sugar: false,
    gluten_free: false,
    dietary_claims: [],
    lightweight: false,
    compression_garment: false,
    allergen_warnings: [],
    ease_of_use: false,
    ergonomic_design: false,
    summary_text: summary,
    confidence: 'medium'
  };

  const summaryLower = summary.toLowerCase();
  const titleLower = (productData.title || '').toLowerCase();
  const bulletsText = (productData.bullets || []).join(' ').toLowerCase();
  const ingredientsLower = (productData.ingredients || '').toLowerCase();

  // Dietary analysis
  if (summaryLower.includes('sodium') || summaryLower.includes('salt') ||
      bulletsText.includes('electrolyte') || bulletsText.includes('sodium')) {
    facts.high_sodium = true;
  }

  if (summaryLower.includes('sugar') || summaryLower.includes('sweet') ||
      bulletsText.includes('sugar') || ingredientsLower.includes('sugar')) {
    facts.high_sugar = true;
  }

  if (summaryLower.includes('gluten-free') || summaryLower.includes('gluten free') ||
      titleLower.includes('gluten-free') || bulletsText.includes('gluten-free')) {
    facts.gluten_free = true;
    facts.dietary_claims.push('gluten-free');
  }

  if (titleLower.includes('compression') || bulletsText.includes('compression') ||
      summaryLower.includes('compression')) {
    facts.compression_garment = true;
  }

  if (summaryLower.includes('lightweight') || summaryLower.includes('easy') ||
      bulletsText.includes('lightweight') || bulletsText.includes('easy to use')) {
    facts.lightweight = true;
    facts.ease_of_use = true;
  }

  if (summaryLower.includes('ergonomic') || summaryLower.includes('comfortable') ||
      bulletsText.includes('ergonomic') || bulletsText.includes('comfort')) {
    facts.ergonomic_design = true;
  }

  // Allergen detection
  const allergenPatterns = {
    'peanuts': ['peanut', 'groundnut'],
    'tree-nuts': ['almond', 'walnut', 'pecan', 'cashew', 'hazelnut'],
    'milk': ['milk', 'dairy', 'cheese', 'whey', 'casein'],
    'eggs': ['egg', 'albumin'],
    'wheat': ['wheat', 'flour'],
    'soy': ['soy', 'soybean'],
    'fish': ['fish', 'salmon', 'tuna'],
    'shellfish': ['shrimp', 'crab', 'lobster'],
    'sesame': ['sesame', 'tahini']
  };

  for (const [allergen, patterns] of Object.entries(allergenPatterns)) {
    for (const pattern of patterns) {
      if (ingredientsLower.includes(pattern) || summaryLower.includes(pattern)) {
        facts.allergen_warnings.push(allergen);
        break;
      }
    }
  }

  // Confidence assessment
  if (productData.ingredients || (productData.bullets && productData.bullets.length >= 3)) {
    facts.confidence = 'high';
  } else if (productData.title && productData.description) {
    facts.confidence = 'medium';
  } else {
    facts.confidence = 'low';
  }

  return facts;
}

function createFallbackFacts(productData) {
  console.log('Shop Well: Creating fallback facts (no AI)');
  const facts = {
    high_sodium: false,
    high_sugar: false,
    gluten_free: false,
    dietary_claims: [],
    lightweight: false,
    compression_garment: false,
    allergen_warnings: [],
    ease_of_use: false,
    ergonomic_design: false,
    summary_text: 'Basic analysis (AI unavailable)',
    confidence: 'low'
  };

  return parseStructuredFacts(JSON.stringify(productData), productData);
}

/* =============================================================================
   AI PROMPT - Generate Wellness Verdict
   ============================================================================= */

async function generateVerdict(facts, condition, allergies = [], customCondition = '') {
  try {
    console.log('Shop Well: Starting AI verdict generation...');

    if (typeof window.ai === 'undefined' || typeof window.ai.languageModel === 'undefined') {
      console.warn('Shop Well: Prompt API not available');
      return null;
    }

    const language = await getUserLanguage();
    console.log('Shop Well: Using language:', language.code, `(${language.name})`);

    const { systemPrompt, userPrompt } = preparePrompts(facts, condition, allergies, customCondition, language);
    console.log('Shop Well: Prompt length:', userPrompt.length);

    // Wrap AI calls with 30-second timeout to prevent hanging
    const session = await withTimeout(
      window.ai.languageModel.create({
        systemPrompt: systemPrompt,
        expectedOutputs: [{
          type: "text",
          languages: [language.code]
        }]
      }),
      30000,
      'Language model session creation'
    );

    const response = await withTimeout(
      session.prompt(userPrompt),
      30000,
      'Verdict generation'
    );
    console.log('Shop Well: Raw AI response:', response);

    const verdict = parseVerdictResponse(response, facts, allergies);
    console.log('Shop Well: Generated verdict:', verdict);

    return verdict;

  } catch (error) {
    if (error instanceof TimeoutError) {
      console.error('Shop Well: Verdict generation timed out:', error.operation);
      console.warn('Shop Well: AI models may still be downloading or Chrome needs restart');
    } else {
      console.error('Shop Well: Verdict generation failed:', error);
    }
    return null;
  }
}

function preparePrompts(facts, condition, allergies, customCondition, language) {
  const languageInstruction = getLanguageInstruction(language.code);

  const systemPrompt = `You are a wellness shopping assistant that provides informational guidance only.

CRITICAL RULES:
- ${languageInstruction}
- Never provide medical advice, diagnosis, or treatment recommendations
- Use supportive language like "may be helpful", "could support", "consider"
- Always include appropriate disclaimers
- Keep responses under 60 words total
- Output ONLY valid JSON format
- Be supportive but not prescriptive

You help people with chronic conditions make informed shopping decisions based on product features.`;

  const actualCondition = condition === 'custom' ? customCondition : condition;
  const isCustomCondition = condition === 'custom';

  const allergenList = allergies.length > 0
    ? `User allergies to check: ${allergies.join(', ')}`
    : 'No specific allergies to check';

  const conditionGuidance = isCustomCondition
    ? `Custom condition: ${customCondition}. Provide general wellness and comfort analysis.`
    : getConditionSpecificGuidance(condition);

  const userPrompt = `
Analyze this product for someone with: ${actualCondition}

${conditionGuidance}

${allergenList}

Product facts:
- High sodium: ${facts.high_sodium}
- High sugar: ${facts.high_sugar}
- Gluten-free: ${facts.gluten_free}
- Compression garment: ${facts.compression_garment}
- Lightweight: ${facts.lightweight}
- Easy to use: ${facts.ease_of_use}
- Ergonomic: ${facts.ergonomic_design}
- Allergen warnings: ${facts.allergen_warnings.join(', ') || 'none detected'}
- Dietary claims: ${facts.dietary_claims.join(', ') || 'none'}

Return ONLY this JSON structure:
{
  "verdict": "helpful" | "mixed" | "not_ideal",
  "bullets": ["point 1", "point 2", "point 3"],
  "caveat": "important warning or limitation"
}

Keep each bullet under 15 words. Total response under 60 words.`;

  return { systemPrompt, userPrompt };
}

function getConditionSpecificGuidance(condition) {
  const guidance = {
    'POTS': `POTS considerations:
- Compression garments may support circulation
- Higher sodium products could help with volume
- Avoid excessive sugar which may worsen symptoms
- Consider ease of use during flare-ups`,

    'ME/CFS': `ME/CFS considerations:
- Lightweight, easy-to-use products reduce energy expenditure
- Ergonomic design supports comfort during activities
- Avoid heavy or complex items that require significant effort
- Consider products that promote rest and recovery`,

    'Celiac Disease': `Celiac considerations:
- Certified gluten-free products are essential
- Check for cross-contamination warnings
- Verified allergen information is critical
- Consider products with clear ingredient labeling`
  };

  return guidance[condition] || 'Provide general wellness and comfort analysis.';
}

function parseVerdictResponse(response, facts, allergies) {
  let verdict;

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      verdict = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    console.warn('Shop Well: Failed to parse AI response, using fallback');
    verdict = createFallbackVerdict(facts, allergies);
  }

  verdict = validateVerdict(verdict, facts, allergies);

  if (facts.allergen_warnings.length > 0) {
    verdict.allergen_alert = true;
    if (!verdict.caveat.includes('allergen')) {
      verdict.caveat = `Contains potential allergens: ${facts.allergen_warnings.join(', ')}. ${verdict.caveat}`;
    }
  }

  return verdict;
}

function validateVerdict(verdict, facts, allergies) {
  const sanitized = {
    verdict: ['helpful', 'mixed', 'not_ideal'].includes(verdict.verdict) ? verdict.verdict : 'mixed',
    bullets: Array.isArray(verdict.bullets) ? verdict.bullets.slice(0, 3) : ['Analysis available'],
    caveat: typeof verdict.caveat === 'string' ? verdict.caveat : 'Please verify product details',
    allergen_alert: false
  };

  while (sanitized.bullets.length < 2) {
    sanitized.bullets.push('Additional analysis available');
  }

  sanitized.bullets = sanitized.bullets.map(bullet =>
    bullet.length > 80 ? bullet.substring(0, 77) + '...' : bullet
  );

  if (sanitized.caveat.length > 100) {
    sanitized.caveat = sanitized.caveat.substring(0, 97) + '...';
  }

  if (facts.allergen_warnings.length > 0) {
    const userAllergens = facts.allergen_warnings.filter(a => allergies.includes(a));
    if (userAllergens.length > 0) {
      sanitized.verdict = 'not_ideal';
      sanitized.allergen_alert = true;
    }
  }

  return sanitized;
}

function createFallbackVerdict(facts, allergies = []) {
  console.log('Shop Well: Creating fallback verdict (no AI)');

  let verdict = 'mixed';
  const bullets = [];
  let caveat = 'AI analysis unavailable. Please verify details manually.';

  if (facts.allergen_warnings.length > 0) {
    const userAllergens = facts.allergen_warnings.filter(a => allergies.includes(a));
    if (userAllergens.length > 0) {
      verdict = 'not_ideal';
      bullets.push(`Contains allergens: ${userAllergens.join(', ')}`);
      caveat = 'Product contains allergens you specified. Please verify ingredients.';
    } else {
      bullets.push('Contains allergens - check if relevant to you');
    }
  }

  if (facts.compression_garment) {
    bullets.push('Compression garment - may support circulation');
    if (verdict === 'mixed') verdict = 'helpful';
  }

  if (facts.gluten_free) {
    bullets.push('Labeled gluten-free');
    if (verdict === 'mixed') verdict = 'helpful';
  }

  if (facts.high_sodium) {
    bullets.push('Higher sodium content');
  }

  if (facts.lightweight && facts.ease_of_use) {
    bullets.push('Lightweight and easy to use');
  }

  if (bullets.length === 0) {
    bullets.push('Basic product analysis available');
    bullets.push('Please review product features manually');
  } else if (bullets.length === 1) {
    bullets.push('Additional details available in product description');
  }

  return {
    verdict,
    bullets: bullets.slice(0, 3),
    caveat,
    allergen_alert: facts.allergen_warnings.length > 0
  };
}

/* =============================================================================
   UI STATE MANAGEMENT
   ============================================================================= */

class SidePanelUI {
  constructor() {
    this.currentState = 'welcome';
    this.aiCapabilities = null;
    this.settings = {};
    this.currentProductData = null;
    this.timeoutWarningTimer = null;
    this.isAnalyzing = false;
    this.messageReceivedTimer = null;

    this.elements = {
      loading: document.querySelector('.shop-well-loading'),
      setup: document.querySelector('.shop-well-setup'),
      analysis: document.querySelector('.shop-well-analysis'),
      error: document.querySelector('.shop-well-error'),
      welcome: document.querySelector('.shop-well-welcome'),
      timeoutWarning: document.querySelector('.loading-timeout-warning')
    };

    this.init();
  }

  async init() {
    console.log('Shop Well Side Panel initializing...');

    // Load user settings
    this.settings = await chrome.storage.local.get([
      'condition', 'customCondition', 'allergies', 'customAllergies'
    ]);
    this.settings.condition = this.settings.condition || 'POTS';
    this.settings.customCondition = this.settings.customCondition || '';
    this.settings.allergies = this.settings.allergies || [];
    this.settings.customAllergies = this.settings.customAllergies || [];

    // Check AI availability
    this.aiCapabilities = await checkAIAvailability();
    console.log('Shop Well: AI Capabilities:', this.aiCapabilities);

    // Setup event listeners
    this.setupEventListeners();

    // Update settings link with extension ID
    const settingsLink = document.getElementById('settingsLink');
    if (settingsLink) {
      settingsLink.href = chrome.runtime.getURL('options/index.html');
    }

    // Show initial state
    if (!canUseAIAnalysis(this.aiCapabilities)) {
      this.showSetup();
    } else {
      this.showWelcome();
    }

    console.log('Shop Well Side Panel initialized');

    // Signal to background that side panel is ready to receive messages
    chrome.runtime.sendMessage({ type: 'sidepanel-ready' }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Shop Well: Failed to signal ready state:', chrome.runtime.lastError.message);
      } else {
        console.log('Shop Well: Ready signal sent to background');
      }
    });

    // Set up a timer to detect if no analysis request arrives
    this.messageReceivedTimer = setTimeout(() => {
      if (this.currentState === 'welcome' && !this.currentProductData) {
        console.log('Shop Well: No analysis request received - showing welcome screen');
        console.log('Shop Well: If you clicked a badge, try clicking it again');
      }
    }, 2000);
  }

  setupEventListeners() {
    // Check AI button
    const checkAIButton = document.getElementById('checkAIButton');
    if (checkAIButton) {
      checkAIButton.addEventListener('click', async () => {
        this.showLoading();
        this.aiCapabilities = await checkAIAvailability();
        if (canUseAIAnalysis(this.aiCapabilities)) {
          this.showWelcome();
        } else {
          this.showSetup();
        }
      });
    }

    // Retry analysis button
    const retryButton = document.getElementById('retryAnalysis');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        if (this.currentProductData) {
          this.analyzeProduct(this.currentProductData);
        }
      });
    }

    // Refresh analysis button
    const refreshButton = document.getElementById('refreshAnalysis');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        if (this.currentProductData) {
          this.analyzeProduct(this.currentProductData);
        }
      });
    }

    // Cancel analysis button
    const cancelButton = document.getElementById('cancelAnalysis');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.cancelAnalysis();
      });
    }

    // Listen for messages from content script/background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'analyze-product') {
        // Clear the message received timer
        if (this.messageReceivedTimer) {
          clearTimeout(this.messageReceivedTimer);
          this.messageReceivedTimer = null;
        }
        this.analyzeProduct(message.productData);
        sendResponse({ success: true });
      } else if (message.type === 'analyze-listing-product') {
        // Clear the message received timer
        if (this.messageReceivedTimer) {
          clearTimeout(this.messageReceivedTimer);
          this.messageReceivedTimer = null;
        }
        this.analyzeListingProduct(message.productData);
        sendResponse({ success: true });
      }
      return true;
    });
  }

  hideAllStates() {
    // Clear timeout warning timer if active
    if (this.timeoutWarningTimer) {
      clearTimeout(this.timeoutWarningTimer);
      this.timeoutWarningTimer = null;
    }

    Object.values(this.elements).forEach(el => {
      if (el) el.classList.add('hidden');
    });
  }

  showLoading() {
    this.hideAllStates();
    if (this.elements.loading) {
      this.elements.loading.classList.remove('hidden');
    }

    // Hide timeout warning initially
    if (this.elements.timeoutWarning) {
      this.elements.timeoutWarning.classList.add('hidden');
    }

    // Show timeout warning after 10 seconds
    this.timeoutWarningTimer = setTimeout(() => {
      if (this.currentState === 'loading' && this.elements.timeoutWarning) {
        this.elements.timeoutWarning.classList.remove('hidden');
        console.log('Shop Well: Showing timeout warning');
      }
    }, 10000);

    this.currentState = 'loading';
    console.log('Shop Well: Showing loading state');
  }

  showSetup() {
    this.hideAllStates();
    if (this.elements.setup) {
      this.elements.setup.classList.remove('hidden');
    }
    this.currentState = 'setup';
    console.log('Shop Well: Showing setup state');
  }

  showWelcome() {
    this.hideAllStates();
    if (this.elements.welcome) {
      this.elements.welcome.classList.remove('hidden');
    }
    this.currentState = 'welcome';
    console.log('Shop Well: Showing welcome state');
  }

  showError(errorMessage) {
    this.hideAllStates();
    if (this.elements.error) {
      this.elements.error.classList.remove('hidden');
      const errorMessageEl = this.elements.error.querySelector('.error-message');
      if (errorMessageEl) {
        errorMessageEl.textContent = errorMessage;
      }
    }
    this.currentState = 'error';
    console.log('Shop Well: Showing error state:', errorMessage);
  }

  showAnalysis(productData, facts, verdict) {
    this.hideAllStates();
    if (!this.elements.analysis) return;

    this.elements.analysis.classList.remove('hidden');

    // Update verdict badge
    const verdictBadge = this.elements.analysis.querySelector('.verdict-badge');
    if (verdictBadge) {
      verdictBadge.className = `verdict-badge verdict-${verdict.verdict}`;
      const verdictText = {
        'helpful': '✅ Helpful',
        'mixed': '⚠️ Mixed Results',
        'not_ideal': '❌ Not Ideal',
        'unknown': '❓ Analysis Incomplete'
      };
      verdictBadge.textContent = verdictText[verdict.verdict] || verdictText.unknown;
    }

    // Update condition info
    const conditionInfo = this.elements.analysis.querySelector('.condition-info');
    if (conditionInfo) {
      const actualCondition = this.settings.condition === 'custom'
        ? this.settings.customCondition
        : this.settings.condition;
      conditionInfo.textContent = `For ${actualCondition}`;
    }

    // Update product info
    const productTitle = this.elements.analysis.querySelector('.product-title');
    if (productTitle) {
      productTitle.textContent = productData.title || 'Product';
    }

    const productPrice = this.elements.analysis.querySelector('.product-price');
    if (productPrice && productData.price) {
      productPrice.textContent = productData.price;
    }

    const productRating = this.elements.analysis.querySelector('.product-rating');
    if (productRating && productData.rating) {
      productRating.textContent = `⭐ ${productData.rating}`;
    }

    // Update insights
    const insightsList = this.elements.analysis.querySelector('.insights-list');
    if (insightsList) {
      insightsList.innerHTML = '';
      if (verdict.bullets && verdict.bullets.length > 0) {
        verdict.bullets.forEach(bullet => {
          const li = document.createElement('li');
          li.textContent = bullet;
          insightsList.appendChild(li);
        });
      }
    }

    // Show allergen alerts if any
    const allergenSection = this.elements.analysis.querySelector('.allergen-alerts');
    if (allergenSection) {
      if (verdict.allergen_alert && facts.allergen_warnings && facts.allergen_warnings.length > 0) {
        allergenSection.classList.remove('hidden');
        const alertContent = allergenSection.querySelector('.alert-content');
        if (alertContent) {
          alertContent.textContent = `Contains: ${facts.allergen_warnings.join(', ')}`;
        }
      } else {
        allergenSection.classList.add('hidden');
      }
    }

    // Show caveat if any
    const caveatSection = this.elements.analysis.querySelector('.important-caveat');
    if (caveatSection && verdict.caveat) {
      caveatSection.classList.remove('hidden');
      const caveatContent = caveatSection.querySelector('.caveat-content');
      if (caveatContent) {
        caveatContent.textContent = verdict.caveat;
      }
    }

    // Update confidence indicator
    const confidenceValue = this.elements.analysis.querySelector('.confidence-value');
    if (confidenceValue) {
      const confidence = facts.confidence || 'low';
      confidenceValue.textContent = confidence.charAt(0).toUpperCase() + confidence.slice(1);
      confidenceValue.className = `confidence-value confidence-${confidence}`;
    }

    this.currentState = 'analysis';
    console.log('Shop Well: Showing analysis state');
  }

  cancelAnalysis() {
    console.log('Shop Well: Analysis cancelled by user');
    this.isAnalyzing = false;

    // Clear timeout warning timer
    if (this.timeoutWarningTimer) {
      clearTimeout(this.timeoutWarningTimer);
      this.timeoutWarningTimer = null;
    }

    // Show error state with cancellation message
    this.showError('Analysis cancelled. Press the analyze button to try again.');
  }

  async analyzeProduct(productData) {
    this.currentProductData = productData;
    this.isAnalyzing = true;
    this.showLoading();

    console.log('Shop Well: Starting product analysis...', productData);

    try {
      // Re-check AI capabilities
      this.aiCapabilities = await checkAIAvailability();

      // Check if cancelled
      if (!this.isAnalyzing) {
        console.log('Shop Well: Analysis cancelled before AI check');
        return;
      }

      if (!canUseAIAnalysis(this.aiCapabilities)) {
        this.showSetup();
        this.isAnalyzing = false;
        return;
      }

      // Get all allergies
      const allAllergies = [...this.settings.allergies, ...this.settings.customAllergies];

      // Extract facts
      let facts;
      if (this.aiCapabilities.summarizer) {
        console.log('Shop Well: Using AI for fact extraction...');
        facts = await summarizeProduct(productData);
      }

      // Check if cancelled
      if (!this.isAnalyzing) {
        console.log('Shop Well: Analysis cancelled during fact extraction');
        return;
      }

      if (!facts) {
        console.log('Shop Well: Using fallback fact extraction...');
        facts = createFallbackFacts(productData);
      }

      // Generate verdict
      let verdict;
      if (this.aiCapabilities.prompt) {
        console.log('Shop Well: Using AI for verdict generation...');
        verdict = await generateVerdict(
          facts,
          this.settings.condition,
          allAllergies,
          this.settings.customCondition
        );
      }

      // Check if cancelled
      if (!this.isAnalyzing) {
        console.log('Shop Well: Analysis cancelled during verdict generation');
        return;
      }

      if (!verdict) {
        console.log('Shop Well: Using fallback verdict generation...');
        verdict = createFallbackVerdict(facts, allAllergies);
      }

      // Display results
      this.isAnalyzing = false;
      this.showAnalysis(productData, facts, verdict);

    } catch (error) {
      this.isAnalyzing = false;
      console.error('Shop Well: Analysis failed:', error);

      // Provide specific error messages for timeouts
      if (error instanceof TimeoutError) {
        this.showError(
          'Analysis timed out after 30 seconds. ' +
          'Chrome AI models may still be downloading. ' +
          'Check chrome://on-device-internals and restart Chrome if needed.'
        );
      } else {
        this.showError('Analysis failed. Please try again or check your Chrome AI settings.');
      }
    }
  }

  async analyzeListingProduct(productData) {
    this.currentProductData = productData;
    this.showLoading();

    console.log('Shop Well: Analyzing listing product...', productData);

    try {
      // Re-check AI capabilities (but proceed with fallback if unavailable)
      this.aiCapabilities = await checkAIAvailability();

      // Get all allergies
      const allAllergies = [...this.settings.allergies, ...this.settings.customAllergies];

      // Create facts from limited listing data with enhanced allergen detection
      const titleLower = (productData.title || '').toLowerCase();

      // Detect allergens in title
      const allergenWarnings = [];
      const allergenPatterns = {
        'peanuts': ['peanut', 'groundnut'],
        'tree-nuts': ['almond', 'walnut', 'pecan', 'cashew', 'hazelnut', 'pistachio'],
        'milk': ['milk', 'dairy', 'cheese', 'whey', 'casein', 'butter'],
        'eggs': ['egg'],
        'wheat': ['wheat', 'flour'],
        'soy': ['soy', 'soybean', 'tofu'],
        'fish': ['fish', 'salmon', 'tuna', 'cod'],
        'shellfish': ['shrimp', 'crab', 'lobster', 'shellfish'],
        'sesame': ['sesame', 'tahini']
      };

      for (const [allergen, patterns] of Object.entries(allergenPatterns)) {
        for (const pattern of patterns) {
          if (titleLower.includes(pattern)) {
            allergenWarnings.push(allergen);
            break;
          }
        }
      }

      const facts = {
        title: productData.title,
        price: productData.price || 'Unknown',
        product_type: 'general',
        confidence: 'low',
        allergen_warnings: allergenWarnings,
        // Try to infer properties from title
        gluten_free: /gluten.?free/i.test(titleLower),
        dairy_free: /dairy.?free/i.test(titleLower),
        vegan: /vegan/i.test(titleLower),
        organic: /organic/i.test(titleLower),
        high_sodium: /electrolyte|sodium|salt/i.test(titleLower),
        high_sugar: /sugar|sweet|candy|chocolate/i.test(titleLower),
        source: productData.source || 'listing_page',
        summary_text: `Limited data from search results. Product: ${productData.title}`
      };

      console.log('Shop Well: Created facts from listing data:', facts);

      // Generate verdict with AI (using title-based analysis)
      let verdict;
      let usedAI = false;

      if (this.aiCapabilities && this.aiCapabilities.prompt) {
        console.log('Shop Well: Using AI for listing product verdict...');
        verdict = await generateVerdict(
          facts,
          this.settings.condition,
          allAllergies,
          this.settings.customCondition
        );
        if (verdict) {
          usedAI = true;
        }
      }

      if (!verdict) {
        console.log('Shop Well: Using fallback verdict for listing product...');
        verdict = createFallbackVerdict(facts, allAllergies);
      }

      // Add note about limited data and analysis type
      const analysisType = usedAI ? 'AI analysis' : 'Basic pattern matching';
      const dataNote = `${analysisType} from limited search result data.`;

      if (verdict.caveat) {
        verdict.caveat = `${dataNote} ${verdict.caveat} Click product for full ingredient analysis.`;
      } else {
        verdict.caveat = `${dataNote} Click product for detailed ingredient analysis and full details.`;
      }

      // Mark confidence as low for all listing analyses
      facts.confidence = 'low';

      // Display results
      this.showAnalysis(productData, facts, verdict);

    } catch (error) {
      console.error('Shop Well: Listing product analysis failed:', error);
      this.showError('Analysis failed. Click product to see full details.');
    }
  }
}

// Initialize side panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SidePanelUI();
});
