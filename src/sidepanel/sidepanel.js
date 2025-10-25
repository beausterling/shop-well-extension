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
  // HARDCODED: Always return English to eliminate language errors
  // Chrome AI only reliably supports 'en' without warnings
  return { code: 'en', name: 'English', isAuto: false };
}

function getLanguageInstruction(languageCode) {
  const languageName = SUPPORTED_LANGUAGES[languageCode] || 'English';
  return `Your response must be in ${languageName}.`;
}

/**
 * Maps user-selected language to Chrome API-compatible language code.
 * Chrome LanguageModel API only supports: en, es, ja
 * Unsupported languages (fr, de) are mapped to English fallback.
 *
 * @param {string} languageCode - User's preferred language code
 * @returns {string} Chrome API-compatible language code
 */
function getAPICompatibleLanguage(languageCode) {
  // Chrome LanguageModel API officially supports only these 3 languages
  const CHROME_SUPPORTED_LANGUAGES = ['en', 'es', 'ja'];

  if (CHROME_SUPPORTED_LANGUAGES.includes(languageCode)) {
    return languageCode; // Already supported - use as-is
  }

  // Unsupported language (fr, de, etc.) - fallback to English
  // Note: System prompt will still request the desired language,
  // and Gemini Nano may still respond in that language based on the prompt
  console.log(`Shop Well: Language '${languageCode}' not supported by Chrome API, using 'en' fallback`);
  return 'en';
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
    // Check for Prompt API (Language Model) - Use global object in extensions
    if (typeof LanguageModel !== 'undefined') {
      try {
        const availability = await LanguageModel.availability();
        // availability() returns a string: 'readily', 'available', 'after-download', 'no'
        // Accept both 'readily' and 'available' as ready states
        result.prompt = availability === 'readily' || availability === 'available';
        result.details.prompt = { available: availability };
        result.available = true;
        console.log('Shop Well: LanguageModel found, availability:', availability);
      } catch (error) {
        console.warn('Shop Well: LanguageModel availability check failed:', error);
        result.details.promptError = error.message;
      }
    }

    // Check for Summarizer API - Use global object in extensions
    if (typeof Summarizer !== 'undefined') {
      try {
        const availability = await Summarizer.availability();
        // availability() returns a string: 'readily', 'available', 'after-download', 'no'
        // Accept both 'readily' and 'available' as ready states
        result.summarizer = availability === 'readily' || availability === 'available';
        result.details.summarizer = { available: availability };
        result.available = true;
        console.log('Shop Well: Summarizer found, availability:', availability);
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

async function summarizeProduct(productData, cachedSummarizer = null) {
  try {
    console.log('Shop Well: Starting AI summarization...');

    if (typeof Summarizer === 'undefined') {
      console.warn('Shop Well: Summarizer API not available');
      return { facts: null, summarizer: null };
    }

    const language = await getUserLanguage();
    console.log('Shop Well: Summarizing in:', language.code, `(${language.name})`);

    const inputText = prepareInputText(productData);
    if (!inputText) {
      console.warn('Shop Well: No suitable content for summarization');
      return { facts: null, summarizer: cachedSummarizer };
    }

    console.log('Shop Well: Summarizer input length:', inputText.length);

    // Reuse cached summarizer or create new one
    let summarizer = cachedSummarizer;
    if (!summarizer) {
      console.log('Shop Well: Creating new summarizer session (first-time may take 60-90s)...');
      // Wrap AI calls with extended timeout (first-time can take 60-90s)
      summarizer = await withTimeout(
        Summarizer.create({
          sharedContext: 'Extract key wellness and dietary information from this product.',
          type: 'key-points',
          format: 'plain-text',
          length: 'short'
        }),
        90000,
        'Summarizer creation'
      );
      console.log('Shop Well: Summarizer session created successfully');
    } else {
      console.log('Shop Well: Reusing cached summarizer session (fast path)');
    }

    const summary = await withTimeout(
      summarizer.summarize(inputText),
      60000,
      'Product summarization'
    );
    console.log('Shop Well: Raw summarizer output:', summary);

    const facts = parseStructuredFacts(summary, productData);
    console.log('Shop Well: Extracted facts:', facts);

    return { facts, summarizer };

  } catch (error) {
    if (error instanceof TimeoutError) {
      console.error('Shop Well: Summarization timed out:', error.operation);
      console.warn('Shop Well: AI models may still be downloading or Chrome needs restart');
    } else {
      console.error('Shop Well: Summarization failed:', error);
    }
    return { facts: null, summarizer: cachedSummarizer };
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

async function generateVerdict(facts, condition, allergies = [], customCondition = '', cachedLanguageModel = null) {
  try {
    console.log('Shop Well: Starting AI verdict generation...');

    if (typeof LanguageModel === 'undefined') {
      console.warn('Shop Well: Prompt API not available');
      return { verdict: null, languageModel: null };
    }

    const language = await getUserLanguage();
    console.log('Shop Well: Using language:', language.code, `(${language.name})`);

    const { systemPrompt, userPrompt } = preparePrompts(facts, condition, allergies, customCondition, language);
    console.log('Shop Well: Prompt length:', userPrompt.length);

    // Map language to Chrome API-compatible code (only en, es, ja supported)
    const apiLanguage = getAPICompatibleLanguage(language.code);

    // Reuse cached language model or create new one
    let session = cachedLanguageModel;
    if (!session) {
      console.log('Shop Well: Creating new language model session (first-time may take 60-90s)...');
      // Wrap AI calls with extended timeout (first-time can take 60-90s)
      session = await withTimeout(
        LanguageModel.create({
          initialPrompts: [
            {
              role: 'system',
              content: systemPrompt
            }
          ],
          expectedInputs: [
            {
              type: "text",
              languages: [apiLanguage]
            }
          ],
          expectedOutputs: [
            {
              type: "text",
              languages: [apiLanguage]
            }
          ]
        }),
        90000,
        'Language model session creation'
      );
      console.log('Shop Well: Language model session created successfully');
    } else {
      console.log('Shop Well: Reusing cached language model session (fast path)');
    }

    const response = await withTimeout(
      session.prompt(userPrompt),
      60000,
      'Verdict generation'
    );
    console.log('Shop Well: Raw AI response:', response);

    const verdict = parseVerdictResponse(response, facts, allergies);
    console.log('Shop Well: Generated verdict:', verdict);

    return { verdict, languageModel: session };

  } catch (error) {
    if (error instanceof TimeoutError) {
      console.error('Shop Well: Verdict generation timed out:', error.operation);
      console.warn('Shop Well: AI models may still be downloading or Chrome needs restart');
    } else {
      console.error('Shop Well: Verdict generation failed:', error);
    }
    return { verdict: null, languageModel: cachedLanguageModel };
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
- Output ONLY valid JSON format
- Be supportive but not prescriptive
- Provide detailed, actionable insights

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
  "bullets": ["point 1", "point 2", "point 3", "point 4", "point 5", "point 6"],
  "caveat": "important warning or limitation"
}

Provide 5-6 detailed bullet points (20-25 words each) with specific, actionable insights. Explain WHY each point matters for the condition.`;

  return { systemPrompt, userPrompt };
}

function getConditionSpecificGuidance(condition) {
  const guidance = {
    'POTS': `POTS (Postural Orthostatic Tachycardia Syndrome) considerations:
- Blood volume management: Higher sodium content (electrolytes, salt) may help maintain blood volume and reduce symptoms
- Circulation support: Compression garments can improve venous return and reduce pooling
- Blood sugar stability: Avoid high sugar content which can cause rapid glucose spikes/crashes and worsen symptoms
- Energy conservation: Easy-to-use, lightweight products reduce physical strain during daily activities
- Symptom management: Consider products that support hydration, temperature regulation, and orthostatic tolerance
- Explain HOW each feature specifically helps with POTS symptom management`,

    'ME/CFS': `ME/CFS (Myalgic Encephalomyelitis/Chronic Fatigue Syndrome) considerations:
- Energy envelope: Lightweight, effortless products help conserve precious energy and prevent crashes
- Pacing support: Easy-to-use items reduce physical and cognitive load during activities
- Ergonomic design: Proper support minimizes muscle strain and reduces recovery time
- Nutritional support: Nutrient-dense foods with minimal prep effort support cellular energy
- Symptom triggers: Avoid products requiring sustained effort or complex preparation
- Explain HOW each feature helps with energy management and PEM (post-exertional malaise) prevention`,

    'Celiac Disease': `Celiac Disease considerations:
- Gluten-free certification: ONLY certified gluten-free products are safe (look for official seals)
- Cross-contamination: Check manufacturing warnings about shared facilities with wheat/barley/rye
- Hidden gluten: Watch for barley malt, wheat starch, or modified food starch in ingredients
- Nutritional adequacy: Gluten-free products should provide adequate fiber, B vitamins, and iron
- Ingredient transparency: Clear, detailed labeling is essential for safe consumption
- Explain WHY each ingredient matters for intestinal healing and immune response`
  };

  return guidance[condition] || 'Provide general wellness and comfort analysis with specific reasoning for each point.';
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
    bullets: Array.isArray(verdict.bullets) ? verdict.bullets.slice(0, 6) : ['Analysis available'],
    caveat: typeof verdict.caveat === 'string' ? verdict.caveat : 'Please verify product details',
    allergen_alert: false
  };

  // Ensure at least 3 bullets
  while (sanitized.bullets.length < 3) {
    sanitized.bullets.push('Additional analysis available');
  }

  // Allow longer bullets (up to 150 characters for detailed explanations)
  sanitized.bullets = sanitized.bullets.map(bullet =>
    bullet.length > 150 ? bullet.substring(0, 147) + '...' : bullet
  );

  // Allow longer caveats (up to 200 characters)
  if (sanitized.caveat.length > 200) {
    sanitized.caveat = sanitized.caveat.substring(0, 197) + '...';
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
   HTML PARSING UTILITIES (for cross-page analysis)
   ============================================================================= */

/**
 * Fetch product HTML from background worker
 * @param {string} url - Product URL to fetch
 * @returns {Promise<string>} HTML content
 */
async function fetchProductHTML(url) {
  console.log('Shop Well: Requesting product HTML from background...');

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'FETCH_PRODUCT_HTML', url },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!response.ok) {
          reject(new Error(response.error || 'Fetch failed'));
        } else {
          resolve(response.html);
        }
      }
    );
  });
}

/**
 * Parse product HTML to extract full product data
 * @param {string} html - Raw HTML content
 * @param {string} url - Product URL (for site detection)
 * @returns {Object|null} Parsed product data
 */
function parseProductHTML(html, url) {
  try {
    console.log('Shop Well: Parsing fetched HTML...');

    // Create virtual DOM from HTML string
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Detect site from URL
    const isAmazon = url.includes('amazon.com');
    const isWalmart = url.includes('walmart.com');

    if (!isAmazon && !isWalmart) {
      console.warn('Shop Well: Unknown site, cannot parse');
      return null;
    }

    // Helper function to get text from selectors (adapted from dom.js)
    const getText = (selectors) => {
      const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
      for (const selector of selectorArray) {
        const element = doc.querySelector(selector);
        if (element && element.textContent) {
          return element.textContent.trim();
        }
      }
      return '';
    };

    // Helper function to get text array
    const getTextArray = (selectors, limit = 10) => {
      const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
      for (const selector of selectorArray) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
          const texts = Array.from(elements)
            .map(el => el.textContent?.trim())
            .filter(text => text && text.length > 3)
            .slice(0, limit);
          if (texts.length > 0) return texts;
        }
      }
      return [];
    };

    // Parse based on site
    if (isAmazon) {
      return {
        site: 'amazon',
        url: url,
        title: getText([
          '#productTitle',
          'h1.a-size-large',
          'h1[data-automation-id="product-title"]',
          'h1'
        ]),
        bullets: getTextArray([
          '#feature-bullets ul li span',
          '#feature-bullets li',
          '.a-unordered-list.a-vertical.a-spacing-mini li',
          '[data-feature-name="featurebullets"] li'
        ]),
        description: getText([
          '#productDescription p',
          '#productDescription',
          '#aplus_feature_div',
          '[data-feature-name="productDescription"]'
        ]).substring(0, 1000),
        ingredients: getText([
          '[data-feature-name="ingredients"]',
          '#ingredients',
          '.ingredients',
          '#detailBullets_feature_div .ingredients'
        ]),
        price: getText([
          '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
          '#corePrice_feature_div .a-price.a-text-price .a-offscreen',
          '.a-price-whole',
          '#priceblock_dealprice',
          '#priceblock_ourprice',
          '.a-price .a-offscreen'
        ]),
        reviews: getTextArray([
          '[data-hook="review-body"] span',
          '.review-text-content span',
          '.cr-original-review-text'
        ], 5)
      };
    } else if (isWalmart) {
      return {
        site: 'walmart',
        url: url,
        title: getText([
          'h1[itemprop="name"]',
          'h1[data-automation-id="product-title"]',
          'h1.prod-ProductTitle',
          'h1'
        ]),
        bullets: getTextArray([
          '[data-testid="product-highlights"] li',
          '.product-highlights li',
          '[itemprop="description"] li'
        ]),
        description: getText([
          '[data-testid="product-description"]',
          '[itemprop="description"]',
          '.about-product-description'
        ]).substring(0, 1000),
        ingredients: getText([
          '[data-testid="ingredients"]',
          '.prod-ProductIngredients',
          '.nutrition-facts .ingredients'
        ]),
        price: getText([
          '[itemprop="price"]',
          '[data-automation-id="product-price"]',
          '.price-characteristic'
        ]),
        reviews: getTextArray([
          '[data-testid="review-text"]',
          '.review-text'
        ], 5)
      };
    }

    return null;

  } catch (error) {
    console.error('Shop Well: HTML parsing failed:', error);
    return null;
  }
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

    // Session caching for faster subsequent analyses
    this.cachedSummarizer = null;
    this.cachedLanguageModel = null;
    this.hasSuccessfulAICall = false; // Track if we've had a successful call

    // Chat state
    this.chatHistory = [];
    this.currentFacts = null; // Store facts from analysis for chat context

    this.elements = {
      loading: document.querySelector('.shop-well-loading'),
      setup: document.querySelector('.shop-well-setup'),
      analysis: document.querySelector('.shop-well-analysis'),
      error: document.querySelector('.shop-well-error'),
      welcome: document.querySelector('.shop-well-welcome'),
      timeoutWarning: document.querySelector('.loading-timeout-warning'),
      // Chat elements
      chatMessages: document.getElementById('chatMessages'),
      chatInput: document.getElementById('chatInput'),
      chatSendButton: document.getElementById('chatSendButton'),
      chatLoading: document.getElementById('chatLoading')
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

    // Chat send button
    if (this.elements.chatSendButton) {
      this.elements.chatSendButton.addEventListener('click', () => {
        this.handleChatSend();
      });
    }

    // Chat input - send on Enter key
    if (this.elements.chatInput) {
      this.elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleChatSend();
        }
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

    // Only hide main state containers, not child elements like chat input
    const stateContainers = [
      this.elements.loading,
      this.elements.setup,
      this.elements.analysis,
      this.elements.error,
      this.elements.welcome
    ];

    stateContainers.forEach(el => {
      if (el) el.classList.add('hidden');
    });
  }

  showLoading() {
    this.hideAllStates();
    if (this.elements.loading) {
      this.elements.loading.classList.remove('hidden');
    }

    // Reset to default loading message
    const loadingText = this.elements.loading?.querySelector('p');
    const loadingSubtext = this.elements.loading?.querySelector('small');
    if (loadingText) loadingText.textContent = 'Analyzing product with Chrome AI...';
    if (loadingSubtext) loadingSubtext.textContent = 'This may take a few seconds';

    // Hide timeout warning initially
    if (this.elements.timeoutWarning) {
      this.elements.timeoutWarning.classList.add('hidden');
    }

    // Show timeout warning after 30 seconds (first AI call can take 60-90s)
    this.timeoutWarningTimer = setTimeout(() => {
      if (this.currentState === 'loading' && this.elements.timeoutWarning) {
        this.elements.timeoutWarning.classList.remove('hidden');
        console.log('Shop Well: Showing timeout warning');
      }
    }, 30000);

    this.currentState = 'loading';
    console.log('Shop Well: Showing loading state');
  }

  showLoadingWithMessage(message, subtext = 'Please wait...') {
    // Keep loading state visible but update the message
    if (this.currentState !== 'loading') {
      this.showLoading();
    }

    // Update loading message with custom text
    const loadingText = this.elements.loading?.querySelector('p');
    const loadingSubtext = this.elements.loading?.querySelector('small');

    if (loadingText) {
      loadingText.textContent = message;
    }

    if (loadingSubtext) {
      loadingSubtext.textContent = subtext;
    }

    console.log('Shop Well: Updated loading message:', message);
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

  showPreviewWithProgress(productData, progressMessage = '🔍 Analyzing product details...') {
    // Show analysis view immediately with preview data and progress indicator
    this.hideAllStates();
    if (!this.elements.analysis) return;

    this.elements.analysis.classList.remove('hidden');

    // Update product info immediately
    const productTitle = this.elements.analysis.querySelector('.product-title');
    if (productTitle) {
      productTitle.textContent = productData.title || 'Product';
    }

    // HIDE PRICE during preview to avoid showing broken extraction
    // Price will be shown only after full analysis completes in showAnalysis()
    const productPrice = this.elements.analysis.querySelector('.product-price');
    if (productPrice) {
      productPrice.innerHTML = `
        <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px;">
          <span style="font-size: 14px; color: var(--sw-taupe); font-weight: 400; font-style: italic;">Loading price...</span>
        </div>
      `;
    }

    const productRating = this.elements.analysis.querySelector('.product-rating');
    if (productRating && productData.rating) {
      productRating.textContent = `⭐ ${productData.rating}`;
    } else if (productRating) {
      productRating.textContent = '';
    }

    // Show loading indicator in place of insights
    const insightsList = this.elements.analysis.querySelector('.insights-list');
    if (insightsList) {
      insightsList.innerHTML = `
        <li style="list-style: none; text-align: center; padding: 20px;">
          <div class="loading-spinner" style="width: 30px; height: 30px; margin: 0 auto 10px;"></div>
          <div class="progress-message" style="color: var(--sw-taupe); font-size: 14px;">${progressMessage}</div>
        </li>
      `;
    }

    // Hide verdict badge initially
    const verdictBadge = this.elements.analysis.querySelector('.verdict-badge');
    if (verdictBadge) {
      verdictBadge.style.opacity = '0.3';
      verdictBadge.textContent = '⏳ Analyzing...';
    }

    // Hide sections that need full analysis
    const allergenSection = this.elements.analysis.querySelector('.allergen-alerts');
    if (allergenSection) allergenSection.classList.add('hidden');

    const caveatSection = this.elements.analysis.querySelector('.important-caveat');
    if (caveatSection) caveatSection.classList.add('hidden');

    this.currentState = 'analysis';
    console.log('Shop Well: Showing preview with progress:', progressMessage);
  }

  updateProgressMessage(message) {
    // Update just the progress message without re-rendering
    if (this.currentState !== 'analysis') return;

    const progressMessageEl = this.elements.analysis?.querySelector('.progress-message');
    if (progressMessageEl) {
      progressMessageEl.textContent = message;
      console.log('Shop Well: Updated progress message:', message);
    }
  }

  showAnalysis(productData, facts, verdict) {
    this.hideAllStates();
    if (!this.elements.analysis) return;

    // Store facts for chat context
    this.currentFacts = facts;

    // Clear chat history for new product
    this.chatHistory = [];
    if (this.elements.chatMessages) {
      this.elements.chatMessages.innerHTML = '';
    }

    this.elements.analysis.classList.remove('hidden');

    // Update verdict badge
    const verdictBadge = this.elements.analysis.querySelector('.verdict-badge');
    if (verdictBadge) {
      verdictBadge.style.opacity = '1'; // Restore full opacity
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
      const mainPrice = productData.price; // e.g., "$2.97"
      const unitPrice = productData.pricePerUnit; // e.g., "2.3 ¢/fl oz"

      // Format: "$2.97 current price" with unit price below
      let priceHTML = `
        <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px;">
          <span style="font-size: 20px; font-weight: 700; color: var(--sw-green);">${mainPrice}</span>
          <span style="font-size: 13px; color: var(--sw-taupe); font-weight: 400;">current price</span>
        </div>
      `;

      if (unitPrice) {
        priceHTML += `
          <span style="font-size: 12px; color: var(--sw-taupe); display: block;">${unitPrice}</span>
        `;
      }

      productPrice.innerHTML = priceHTML;
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
        const result = await summarizeProduct(productData, this.cachedSummarizer);
        facts = result.facts;
        // Cache the summarizer for future use
        if (result.summarizer) {
          this.cachedSummarizer = result.summarizer;
          console.log('Shop Well: Summarizer session cached for reuse');
        }
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
        const result = await generateVerdict(
          facts,
          this.settings.condition,
          allAllergies,
          this.settings.customCondition,
          this.cachedLanguageModel
        );
        verdict = result.verdict;
        // Cache the language model for future use
        if (result.languageModel) {
          this.cachedLanguageModel = result.languageModel;
          console.log('Shop Well: Language model session cached for reuse');
        }
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

      // Mark that we've had at least one successful AI call
      if (facts || verdict) {
        this.hasSuccessfulAICall = true;
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
          'Analysis timed out after 90 seconds. ' +
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
    console.log('Shop Well: Analyzing listing product with progressive loading...', productData);

    try {
      // Re-check AI capabilities
      this.aiCapabilities = await checkAIAvailability();
      const allAllergies = [...this.settings.allergies, ...this.settings.customAllergies];

      // ===================================================================
      // PHASE 1: Show immediate preview with quick allergen check
      // ===================================================================
      this.showPreviewWithProgress(productData, '🔍 Checking for allergens...');

      const titleLower = (productData.title || '').toLowerCase();

      // Quick allergen detection from title
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

      // Show preview with quick allergen info
      const previewFacts = {
        title: productData.title,
        price: productData.price || 'Unknown',
        allergen_warnings: allergenWarnings,
        confidence: 'preview',
        summary_text: 'Quick allergen scan from product title...'
      };

      // ===================================================================
      // PHASE 2: Fetch full product HTML
      // ===================================================================
      this.updateProgressMessage('🌐 Fetching full product details...');
      console.log('Shop Well: Fetching product URL:', productData.url);

      let html;
      let fullProductData;

      try {
        html = await fetchProductHTML(productData.url);
        console.log('Shop Well: HTML fetched, length:', html.length);
      } catch (error) {
        console.warn('Shop Well: Failed to fetch product HTML:', error);
        // Fall back to title-only analysis
        html = null;
      }

      // ===================================================================
      // PHASE 3: Parse full product data
      // ===================================================================
      if (html) {
        this.updateProgressMessage('📋 Extracting ingredients and details...');

        fullProductData = parseProductHTML(html, productData.url);

        if (!fullProductData) {
          console.warn('Shop Well: HTML parsing failed, using title-only data');
          fullProductData = productData; // Fallback to search card data
        } else {
          console.log('Shop Well: Full product data extracted:', {
            hasIngredients: !!fullProductData.ingredients,
            bulletCount: fullProductData.bullets?.length || 0,
            descriptionLength: fullProductData.description?.length || 0
          });

          // Merge search card data with parsed data
          fullProductData = {
            ...fullProductData,
            // Preserve search card specific data
            id: productData.id,
            image: productData.image,
            rating: productData.rating,
            position: productData.position,
            source: productData.source,
            // Only preserve pricePerUnit if HTML parse didn't provide one
            pricePerUnit: fullProductData.pricePerUnit || productData.pricePerUnit
          };
        }
      } else {
        // Use search card data only
        fullProductData = productData;
      }

      // ===================================================================
      // PHASE 4: Run full AI analysis
      // ===================================================================
      this.updateProgressMessage('🤖 Analyzing with AI...');

      let facts;
      let verdict;

      // If we have full product data, run complete analysis
      if (fullProductData.ingredients || (fullProductData.bullets && fullProductData.bullets.length > 0)) {
        console.log('Shop Well: Running full AI analysis with complete product data');

        // Use summarizer to extract facts
        if (this.aiCapabilities && this.aiCapabilities.summarizer) {
          const summaryResult = await summarizeProduct(fullProductData, this.cachedSummarizer);
          facts = summaryResult.facts;
          if (summaryResult.summarizer) {
            this.cachedSummarizer = summaryResult.summarizer;
          }
        }

        // Create facts if summarizer didn't work
        if (!facts) {
          facts = createFallbackFacts(fullProductData);
        }

        // Generate verdict with AI
        if (this.aiCapabilities && this.aiCapabilities.prompt) {
          const verdictResult = await generateVerdict(
            facts,
            this.settings.condition,
            allAllergies,
            this.settings.customCondition,
            this.cachedLanguageModel
          );
          verdict = verdictResult.verdict;
          if (verdictResult.languageModel) {
            this.cachedLanguageModel = verdictResult.languageModel;
          }
        }

        if (!verdict) {
          verdict = createFallbackVerdict(facts, allAllergies);
        }

        // Mark that we've had a successful AI call
        if (facts || verdict) {
          this.hasSuccessfulAICall = true;
        }

      } else {
        // Fallback: Title-only analysis
        console.log('Shop Well: Using title-only analysis (no full data available)');

        facts = {
          title: fullProductData.title,
          price: fullProductData.price || 'Unknown',
          allergen_warnings: allergenWarnings,
          dietary_claims: [],
          gluten_free: /gluten.?free/i.test(titleLower),
          high_sodium: /electrolyte|sodium|salt/i.test(titleLower),
          high_sugar: /sugar|sweet|candy|chocolate/i.test(titleLower),
          confidence: 'low',
          summary_text: `Analysis from product title only.`
        };

        if (this.aiCapabilities && this.aiCapabilities.prompt) {
          const verdictResult = await generateVerdict(
            facts,
            this.settings.condition,
            allAllergies,
            this.settings.customCondition,
            this.cachedLanguageModel
          );
          verdict = verdictResult.verdict;
          if (verdictResult.languageModel) {
            this.cachedLanguageModel = verdictResult.languageModel;
          }
        }

        if (!verdict) {
          verdict = createFallbackVerdict(facts, allAllergies);
        }

        verdict.caveat = `Limited data available. ${verdict.caveat || 'Visit product page for complete details.'}`;
      }

      // ===================================================================
      // PHASE 5: Display final results
      // ===================================================================
      this.showAnalysis(fullProductData, facts, verdict);

    } catch (error) {
      this.isAnalyzing = false;
      console.error('Shop Well: Listing product analysis failed:', error);

      if (error instanceof TimeoutError) {
        this.showError(
          'Analysis timed out. Chrome AI models may still be downloading. ' +
          'Check chrome://on-device-internals and restart Chrome if needed.'
        );
      } else {
        this.showError('Analysis failed. Please try again or visit the product page directly.');
      }
    }
  }

  /* =============================================================================
     CHAT FUNCTIONALITY
     ============================================================================= */

  handleChatSend() {
    if (!this.elements.chatInput) return;

    const message = this.elements.chatInput.value.trim();
    if (!message) return;

    // Clear input
    this.elements.chatInput.value = '';

    // Send message
    this.sendChatMessage(message);
  }

  async sendChatMessage(userMessage) {
    console.log('Shop Well: Sending chat message:', userMessage);

    // Check if we have a product to chat about
    if (!this.currentProductData || !this.currentFacts) {
      this.addChatMessage('Please analyze a product first before asking questions.', 'ai');
      return;
    }

    // Check if AI is available
    if (!this.cachedLanguageModel && (!this.aiCapabilities || !this.aiCapabilities.prompt)) {
      this.addChatMessage('Chat requires Chrome AI. Please ensure AI is enabled and try analyzing a product again.', 'ai');
      return;
    }

    // Add user message to chat
    this.addChatMessage(userMessage, 'user');

    // Show loading indicator
    if (this.elements.chatLoading) {
      this.elements.chatLoading.classList.remove('hidden');
    }

    // Disable input while processing
    if (this.elements.chatInput) this.elements.chatInput.disabled = true;
    if (this.elements.chatSendButton) this.elements.chatSendButton.disabled = true;

    try {
      // Prepare chat context with product info
      const language = await getUserLanguage();
      const actualCondition = this.settings.condition === 'custom'
        ? this.settings.customCondition
        : this.settings.condition;

      const contextPrompt = `You are a wellness shopping assistant helping someone with ${actualCondition}.

PRODUCT CONTEXT:
- Product: ${this.currentProductData.title || 'Unknown'}
- High sodium: ${this.currentFacts.high_sodium || false}
- High sugar: ${this.currentFacts.high_sugar || false}
- Gluten-free: ${this.currentFacts.gluten_free || false}
- Allergen warnings: ${this.currentFacts.allergen_warnings?.join(', ') || 'none'}

CRITICAL RULES:
- Answer questions about THIS specific product for someone with ${actualCondition}
- Use supportive language like "may", "could", "consider"
- Never provide medical advice or diagnosis
- Keep responses under 100 words
- Be specific and actionable
- Reference the product features when answering

User question: ${userMessage}

Provide a helpful, informative response:`;

      // Use cached language model or create new one
      let result;
      if (this.cachedLanguageModel) {
        console.log('Shop Well: Using cached language model for chat');
        result = { languageModel: this.cachedLanguageModel };
      } else {
        console.log('Shop Well: Creating new language model for chat');
        const apiLanguage = getAPICompatibleLanguage(language.code);
        result = {
          languageModel: await withTimeout(
            LanguageModel.create({
              expectedInputs: [{type: "text", languages: [apiLanguage]}],
              expectedOutputs: [{type: "text", languages: [apiLanguage]}]
            }),
            90000,
            'Chat language model creation'
          )
        };
        this.cachedLanguageModel = result.languageModel;
      }

      // Get AI response
      const aiResponse = await withTimeout(
        result.languageModel.prompt(contextPrompt),
        60000,
        'Chat response generation'
      );

      console.log('Shop Well: Chat AI response:', aiResponse);

      // Add AI response to chat
      this.addChatMessage(aiResponse.trim(), 'ai');

    } catch (error) {
      console.error('Shop Well: Chat failed:', error);
      if (error instanceof TimeoutError) {
        this.addChatMessage('Response timed out. Please try again or ask a simpler question.', 'ai');
      } else {
        this.addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
      }
    } finally {
      // Hide loading indicator
      if (this.elements.chatLoading) {
        this.elements.chatLoading.classList.add('hidden');
      }

      // Re-enable input
      if (this.elements.chatInput) this.elements.chatInput.disabled = false;
      if (this.elements.chatSendButton) this.elements.chatSendButton.disabled = false;

      // Focus input for next message
      if (this.elements.chatInput) this.elements.chatInput.focus();
    }
  }

  addChatMessage(message, type) {
    if (!this.elements.chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message-${type}`;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble chat-bubble-${type}`;
    bubble.textContent = message;

    messageDiv.appendChild(bubble);
    this.elements.chatMessages.appendChild(messageDiv);

    // Store in history
    this.chatHistory.push({ message, type, timestamp: Date.now() });

    // Scroll to bottom
    this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
  }
}

// Initialize side panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SidePanelUI();
});
