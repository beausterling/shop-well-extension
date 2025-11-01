// Shop Well Side Panel - AI-Powered Wellness Analysis
// All logic inline for compatibility (will be bundled later)

/* =============================================================================
   PERSONALIZATION UTILITIES
   ============================================================================= */

/**
 * Generates personalized subject pronouns based on user's first name.
 * @param {string} firstName - User's first name (optional)
 * @returns {Object} - Personalization object with subject and possessive forms
 */
function getPersonalization(firstName) {
  const hasName = firstName && firstName.trim();

  return {
    // Use for "someone" or the name: "someone with POTS" → "Sarah with POTS" or "you with POTS"
    subject: hasName ? firstName.trim() : 'you',

    // Use for "the user's" or name possessive: "the user's POTS" → "Sarah's POTS" or "your POTS"
    possessive: hasName ? `${firstName.trim()}'s` : 'your',

    // Use for subject in context: "someone" → "Sarah" or "someone"
    // (used when "you" would be grammatically incorrect)
    thirdPerson: hasName ? firstName.trim() : 'someone',

    // Check if we're using a name (affects grammar choices)
    hasName: hasName
  };
}

/* =============================================================================
   VERDICT MAPPING UTILITIES
   ============================================================================= */

/**
 * Maps verdict string to emoji icon
 * @param {string} verdict - Verdict type (good, warning, bad, inconclusive)
 * @returns {string} - Emoji representation
 */
function getVerdictEmoji(verdict) {
  const emojiMap = {
    'good': '✅',
    'warning': '⚠️',
    'bad': '❌',
    'inconclusive': '︖'
  };
  return emojiMap[verdict] || '︖';
}

/**
 * Maps verdict string to display label
 * @param {string} verdict - Verdict type (good, warning, bad, inconclusive)
 * @returns {string} - Human-readable label
 */
function getVerdictLabel(verdict) {
  const labelMap = {
    'good': 'Good',
    'warning': 'Warning',
    'bad': 'Bad',
    'inconclusive': 'N/A'
  };
  return labelMap[verdict] || 'N/A';
}

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
   MARKDOWN UTILITIES
   ============================================================================= */

/**
 * Splits text into paragraphs of approximately 2 sentences each.
 * This improves readability by adding visual breaks in longer text.
 * @param {string} text - Input text
 * @returns {string} Text with paragraph breaks every 2 sentences
 */
function splitIntoTwoSentenceParagraphs(text) {
  if (!text) return '';

  // Split by existing double newlines (preserve intentional paragraph breaks)
  const existingParagraphs = text.split(/\n\n+/);

  const processedParagraphs = existingParagraphs.map(para => {
    const trimmed = para.trim();
    if (!trimmed) return '';

    // Don't split bullet lists or very short paragraphs
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
      return trimmed;
    }

    // Split into sentences using regex
    // Matches: period/exclamation/question followed by space and capital letter, or end of string
    const sentences = trimmed.match(/[^.!?]+[.!?]+(?=\s+[A-Z]|$)/g);

    if (!sentences || sentences.length <= 2) {
      // Short paragraph, keep as-is
      return trimmed;
    }

    // Group sentences into pairs
    const pairs = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const pair = sentences.slice(i, i + 2).join(' ').trim();
      pairs.push(pair);
    }

    // Join pairs with double newlines
    return pairs.join('\n\n');
  });

  // Join all processed paragraphs with double newlines
  return processedParagraphs.filter(p => p).join('\n\n');
}

/**
 * Converts simple markdown formatting to HTML.
 * Supports: **bold**, *italic*, and bullet lists (-, *, •)
 * @param {string} text - Markdown-formatted text
 * @returns {string} HTML string
 */
function parseMarkdownToHTML(text) {
  if (!text) return '';

  // Split into paragraphs (double newline)
  const paragraphs = text.split(/\n\n+/);

  let html = '';
  let inList = false;

  paragraphs.forEach((para, index) => {
    const trimmed = para.trim();
    if (!trimmed) return;

    // Check if this paragraph contains bullet points
    const lines = trimmed.split('\n');
    const isBulletList = lines.every(line => /^[\-\*•]\s/.test(line.trim()));

    if (isBulletList) {
      // Render as <ul>
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      lines.forEach(line => {
        const bulletText = line.replace(/^[\-\*•]\s+/, '').trim();
        const formatted = formatInlineMarkdown(bulletText);
        html += `<li>${formatted}</li>`;
      });
    } else {
      // Close list if we were in one
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      // Render as <p>
      const formatted = formatInlineMarkdown(trimmed);
      html += `<p>${formatted}</p>`;
    }
  });

  // Close any open list
  if (inList) {
    html += '</ul>';
  }

  return html;
}

/**
 * Formats inline markdown (bold, italic) to HTML.
 * @param {string} text - Text with inline markdown
 * @returns {string} Formatted HTML string
 */
function formatInlineMarkdown(text) {
  // Replace **bold** with <strong>
  text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  // Replace *italic* with <em> (but avoid replacing ** remnants)
  text = text.replace(/(?<!\*)\*([^\*]+)\*(?!\*)/g, '<em>$1</em>');
  return text;
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

async function generateVerdict(facts, conditions, allergies = [], cachedLanguageModel = null, firstName = '', productData = null) {
  try {
    console.log('Shop Well: Starting AI verdict generation...');
    console.log('Shop Well: Analyzing for conditions:', conditions);

    if (typeof LanguageModel === 'undefined') {
      console.warn('Shop Well: Prompt API not available');
      return { verdict: null, languageModel: null };
    }

    const language = await getUserLanguage();
    console.log('Shop Well: Using language:', language.code, `(${language.name})`);

    // Detect product category for contextual analysis
    const productCategory = productData ? detectProductCategory(productData, facts) : 'general';
    console.log('Shop Well: Detected product category:', productCategory);

    // Retrieve stored health profile if available
    let healthProfile = null;
    try {
      const result = await chrome.storage.local.get(['healthProfile']);
      healthProfile = result.healthProfile?.profile || null;
      if (healthProfile) {
        console.log('Shop Well: Using stored health profile');
        // Filter profile to only relevant aspects for this product category
        healthProfile = filterHealthProfileByCategory(healthProfile, productCategory, conditions, allergies);
        console.log('Shop Well: Filtered profile for', productCategory, 'category');
      } else {
        console.log('Shop Well: No health profile found, using legacy guidance');
      }
    } catch (error) {
      console.warn('Shop Well: Failed to load health profile:', error);
    }

    const { systemPrompt, userPrompt } = preparePrompts(facts, conditions, allergies, language, firstName, healthProfile, productCategory);
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
    console.log('Shop Well: Response type:', typeof response);
    console.log('Shop Well: Response length:', response?.length || 0);

    // Validate AI response
    if (!response || typeof response !== 'string' || response.trim().length === 0) {
      console.error('Shop Well: AI returned invalid/empty response');
      console.log('Shop Well: Session state:', session ? 'exists' : 'null');
      console.log('Shop Well: Falling back to basic verdict generation');

      // Fall back to basic verdict
      const verdict = createFallbackVerdict(facts, allergies, conditions);
      console.log('Shop Well: Generated fallback verdict:', verdict);
      return { verdict, languageModel: session };
    }

    const verdict = parseVerdictResponse(response, facts, allergies, conditions);
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

/**
 * Detects the product category based on title, facts, and content.
 * This determines which health aspects are relevant for analysis.
 *
 * @param {Object} productData - Product information (title, bullets, etc.)
 * @param {Object} facts - Extracted product facts
 * @returns {string} - Product category
 */
function detectProductCategory(productData, facts) {
  const titleLower = (productData.title || '').toLowerCase();
  const bulletsText = (productData.bullets || []).join(' ').toLowerCase();
  const hasIngredients = !!(productData.ingredients && productData.ingredients.length > 0);
  const pricePerUnit = (productData.pricePerUnit || '').toLowerCase();

  // PRIORITY 1: Nutrition facts detected = FOOD (very high confidence)
  if (facts.gluten_free || facts.high_sugar || facts.high_sodium || facts.dietary_claims.length > 0) {
    // Distinguish supplements from regular food
    if (titleLower.match(/\b(vitamin|supplement|probiotic|mineral|omega|capsule|tablet|softgel)\b/)) {
      console.log('Category: supplement (nutrition + supplement keywords)');
      return 'supplement';
    }
    console.log('Category: food (nutrition facts detected)');
    return 'food';
  }

  // PRIORITY 2: Comprehensive food keywords in title (HIGH PRIORITY)
  const foodKeywords = [
    // Frozen desserts
    'ice cream', 'icecream', 'frozen yogurt', 'sherbet', 'sorbet', 'gelato',
    'frozen dessert', 'popsicle', 'ice pop',
    // Dairy
    'milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy', 'whipped cream',
    // Snacks & treats
    'chips', 'crackers', 'cookies', 'candy', 'chocolate', 'snack', 'popcorn',
    'pretzels', 'nuts', 'trail mix', 'granola',
    // Meals & ingredients
    'cereal', 'bread', 'pasta', 'rice', 'beans', 'soup', 'sauce', 'salsa',
    'tortilla', 'burrito', 'pizza', 'sandwich',
    // Beverages
    'juice', 'water', 'soda', 'coffee', 'tea', 'drink', 'beverage', 'smoothie',
    'lemonade', 'energy drink',
    // Prepared foods
    'meal', 'dinner', 'lunch', 'breakfast', 'food', 'entree', 'appetizer',
    // Baking & cooking
    'flour', 'sugar', 'baking', 'mix', 'seasoning', 'spice', 'oil',
    // Protein & nutrition
    'protein', 'bar', 'shake', 'powder', 'supplement bar'
  ];

  for (const keyword of foodKeywords) {
    if (titleLower.includes(keyword)) {
      // Check if it's a supplement type
      if (titleLower.match(/\b(vitamin|supplement|probiotic|mineral|omega|capsule|tablet|softgel)\b/)) {
        console.log('Category: supplement (food keyword + supplement type)');
        return 'supplement';
      }
      console.log(`Category: food (keyword: "${keyword}")`);
      return 'food';
    }
  }

  // PRIORITY 3: Price per weight/volume = likely food
  if (pricePerUnit && pricePerUnit.match(/¢?\/?(\boz\b|\blb\b|fl oz|\bg\b|\bkg\b|\bml\b|\bl\b)/)) {
    console.log('Category: food (price per weight/volume)');
    return 'food';
  }

  // PRIORITY 4: Explicit ingredients list = FOOD
  if (hasIngredients && productData.ingredients.length > 20) {
    console.log('Category: food (has ingredient list)');
    return 'food';
  }

  // Supplements (after food checks)
  if (titleLower.match(/\b(vitamin|supplement|probiotic|mineral|omega|capsule|tablet|pill|softgel)\b/)) {
    console.log('Category: supplement');
    return 'supplement';
  }

  // Mobility & Assistive Devices
  if (titleLower.match(/\b(cane|walker|wheelchair|mobility|grab bar|handrail|seat|stool|cushion|lift|ramp|reacher|gripper)\b/) ||
      facts.ergonomic_design || facts.lightweight) {
    return 'mobility';
  }

  // Clothing & Compression Garments
  if (facts.compression_garment ||
      titleLower.match(/\b(sock|stocking|sleeve|shirt|garment|clothing|compression|brace|wrap|band|support|belt)\b/)) {
    return 'clothing';
  }

  // Household Products
  if (titleLower.match(/\b(cleaner|cleaning|soap|detergent|spray|wipe|disinfect|laundry|dish|surface|floor)\b/)) {
    return 'household';
  }

  // Personal Care
  if (titleLower.match(/\b(shampoo|conditioner|lotion|cream|cosmetic|perfume|cologne|deodorant|hygiene|skincare|moisturizer|sunscreen|toothpaste)\b/)) {
    return 'personal-care';
  }

  // Medical Equipment
  if (titleLower.match(/\b(monitor|device|equipment|medical|pill organizer|thermometer|blood pressure|glucose|oximeter|nebulizer|inhaler)\b/)) {
    return 'medical-equipment';
  }

  // Default to general if no specific category detected
  return 'general';
}

/**
 * Filters health profile to only include aspects relevant to the product category.
 * This prevents irrelevant health advice (e.g., ergonomics for food items).
 *
 * @param {string} healthProfile - Full health profile text
 * @param {string} category - Product category
 * @param {Array} conditions - User's conditions
 * @param {Array} allergies - User's allergies
 * @returns {string} - Filtered health profile focusing on relevant aspects
 */
function filterHealthProfileByCategory(healthProfile, category, conditions = [], allergies = []) {
  const categoryLabel = category.replace('-', ' ');

  // For FOOD and SUPPLEMENTS: Aggressively remove non-food content
  if (category === 'food' || category === 'supplement') {
    console.log(`Filtering health profile for ${category} - removing non-food content`);

    let filtered = healthProfile;

    // REMOVE: Fragrance/scent-related content (not relevant for food)
    filtered = filtered.replace(/[^.]*\bfragrance[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\bscent[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\bperfume[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\bodor[^.]*\./gi, '');

    // REMOVE: Ergonomics/physical handling (not relevant for food)
    filtered = filtered.replace(/[^.]*\bergonomic[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\blightweight[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\bease of use[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\bphysical demand[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\bgrip[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\blifting[^.]*\./gi, '');

    // REMOVE: Household chemicals (not relevant for food)
    filtered = filtered.replace(/[^.]*\bchemical[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\birritant[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\bcleaning[^.]*\./gi, '');

    // REMOVE: Personal care/skin (not relevant for food)
    filtered = filtered.replace(/[^.]*\bskin sensitive[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\btopical[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\bappl(y|ied|ying)[^.]*skin[^.]*\./gi, '');

    // Clean up extra whitespace and empty lines
    filtered = filtered.replace(/\n\s*\n/g, '\n\n');
    filtered = filtered.replace(/\s+/g, ' ');
    filtered = filtered.trim();

    // Add header
    const header = `**Relevant for ${categoryLabel} products:**\n\n`;

    console.log(`Filtered profile length: ${filtered.length} chars (original: ${healthProfile.length})`);
    return header + filtered;
  }

  // For HOUSEHOLD products: Keep fragrance/chemical content, remove food content
  if (category === 'household') {
    console.log('Filtering health profile for household - removing food/nutrition content');

    let filtered = healthProfile;

    // REMOVE: Nutrition/dietary content (not relevant for household)
    filtered = filtered.replace(/[^.]*\bnutrition[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\bdietary[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\bcalories[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\bsodium[^.]*content[^.]*\./gi, '');
    filtered = filtered.replace(/[^.]*\bsugar[^.]*content[^.]*\./gi, '');

    filtered = filtered.replace(/\n\s*\n/g, '\n\n');
    filtered = filtered.replace(/\s+/g, ' ');
    filtered = filtered.trim();

    const header = `**Relevant for ${categoryLabel} products:**\n\n`;
    return header + filtered;
  }

  // For other categories: Use keyword-based positive filtering
  const relevanceMap = {
    mobility: ['physical', 'mobility', 'movement', 'ergonomic', 'lightweight', 'ease of use', 'energy', 'fatigue', 'pain', 'joint', 'muscle'],
    clothing: ['physical', 'compression', 'support', 'circulation', 'temperature', 'comfort', 'mobility', 'skin'],
    'personal-care': ['skin', 'fragrance', 'scent', 'chemical', 'sensitive', 'allergen', 'irritant', 'ingredient'],
    'medical-equipment': ['physical', 'ease of use', 'cognitive', 'mobility', 'symptom', 'monitoring', 'ergonomic'],
    general: null
  };

  const relevantTerms = relevanceMap[category];

  // If general category or no mapping, return full profile
  if (!relevantTerms) {
    return healthProfile;
  }

  // Split profile into sentences
  const sentences = healthProfile.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Filter sentences that contain relevant terms
  const relevantSentences = sentences.filter(sentence => {
    const sentenceLower = sentence.toLowerCase();
    return relevantTerms.some(term => sentenceLower.includes(term));
  });

  let filteredProfile = relevantSentences.join('. ') + '.';

  // Ensure we have meaningful content
  if (filteredProfile.length < 100) {
    filteredProfile = `For ${categoryLabel} products, focus on: ${relevantTerms.slice(0, 5).join(', ')}.`;
  }

  const header = `**Relevant for ${categoryLabel} products:**\n\n`;
  return header + filteredProfile;
}

/**
 * Generates a personalized health profile for the user based on their conditions and allergies.
 * This profile is stored locally and used as context for all product analyses.
 *
 * @param {Array} conditions - Array of standard condition names
 * @param {Array} customConditions - Array of custom condition names
 * @param {Array} allergies - Array of standard allergens
 * @param {Array} customAllergies - Array of custom allergens
 * @returns {Promise<string>} - Generated health profile text
 */
async function generateHealthProfile(conditions = [], customConditions = [], allergies = [], customAllergies = []) {
  console.log('Shop Well: Generating personalized health profile...');

  try {
    // Combine all conditions and allergies
    const allConditions = [...conditions, ...customConditions];
    const allAllergies = [...allergies, ...customAllergies];

    // Handle case where user has no conditions or allergies
    if (allConditions.length === 0 && allAllergies.length === 0) {
      return 'General wellness focus. User has no specific health conditions or allergies specified.';
    }

    // Check if LanguageModel is available
    if (typeof LanguageModel === 'undefined') {
      console.warn('Shop Well: LanguageModel not available for profile generation');
      return generateFallbackProfile(allConditions, allAllergies);
    }

    // Create AI session
    const session = await LanguageModel.create({
      temperature: 0.7,
      topK: 3
    });

    // Create prompt for profile generation
    const profilePrompt = `You are a health profile analyst. Create a comprehensive, personalized health profile for someone with the following conditions and allergies.

**Conditions:** ${allConditions.length > 0 ? allConditions.join(', ') : 'None'}
**Allergies/Sensitivities:** ${allAllergies.length > 0 ? allAllergies.join(', ') : 'None'}

Generate a detailed health profile that includes:

1. **Key Health Considerations:**
   - For each condition, explain the primary symptoms and challenges
   - Note any interactions or compounding effects between multiple conditions
   - Explain how these conditions affect daily product choices

2. **Ingredients & Features to AVOID:**
   - List specific ingredients that could worsen symptoms or trigger reactions
   - Explain WHY each ingredient is problematic for this specific health profile
   - Include both obvious allergens and hidden triggers

3. **Ingredients & Features to SEEK:**
   - List beneficial ingredients, nutrients, or product features
   - Explain HOW each helps manage symptoms or support health
   - Prioritize evidence-based recommendations

4. **Product Category Guidance:**
   - Foods: Key nutritional needs and dietary restrictions
   - Household items: Sensitivities to fragrances, chemicals, textures
   - Wellness products: Ergonomics, ease-of-use, physical demands
   - General: Any product considerations unique to this health profile

5. **Special Considerations:**
   - Note any unique aspects of this particular combination of conditions
   - Highlight potential conflicts (e.g., "POTS needs high sodium but hypertension needs low sodium")
   - Provide nuanced guidance for complex situations

Write 300-400 words in a clear, factual tone. Focus on actionable insights that will help analyze products for this specific health profile. This profile will be used by an AI assistant to evaluate products, so be thorough and specific.`;

    const response = await withTimeout(
      session.prompt(profilePrompt),
      60000,
      'Health profile generation'
    );

    console.log('Shop Well: Health profile generated successfully');
    session.destroy(); // Clean up session

    return response.trim();

  } catch (error) {
    console.error('Shop Well: Health profile generation failed:', error);
    // Fall back to basic profile
    return generateFallbackProfile(
      [...conditions, ...customConditions],
      [...allergies, ...customAllergies]
    );
  }
}

/**
 * Generates a basic fallback profile when AI is unavailable
 */
function generateFallbackProfile(allConditions, allAllergies) {
  let profile = 'Health Profile:\n\n';

  if (allConditions.length > 0) {
    profile += `Conditions: ${allConditions.join(', ')}\n`;
    profile += 'Focus on products that support symptom management and daily comfort.\n\n';
  }

  if (allAllergies.length > 0) {
    profile += `Allergies/Sensitivities: ${allAllergies.join(', ')}\n`;
    profile += 'Avoid products containing these allergens. Check ingredient lists carefully.\n';
  }

  return profile;
}

function preparePrompts(facts, conditions, allergies, language, firstName, healthProfile, productCategory = 'general') {
  const languageInstruction = getLanguageInstruction(language.code);

  // Handle conditions array
  const conditionsArray = Array.isArray(conditions) ? conditions : [conditions];
  const conditionsList = conditionsArray.length > 0 ? conditionsArray.join(', ') : 'general wellness';

  // Category-specific focus instructions
  const categoryLabels = {
    food: 'food/beverage product',
    supplement: 'dietary supplement',
    mobility: 'mobility/assistive device',
    clothing: 'clothing/compression garment',
    household: 'household product',
    'personal-care': 'personal care product',
    'medical-equipment': 'medical equipment',
    general: 'general product'
  };
  const categoryLabel = categoryLabels[productCategory] || 'general product';

  const systemPrompt = `You are a wellness shopping assistant that provides informational guidance only.

CRITICAL RULES:
- ${languageInstruction}
- Never provide medical advice, diagnosis, or treatment recommendations
- Use supportive language like "may be helpful", "could support", "consider"
- Always include appropriate disclaimers
- Output ONLY valid JSON format
- Be supportive but not prescriptive
- Provide detailed, actionable insights
- ALWAYS address the user directly as "you/your" (second person) - never use third person
- FOCUS ONLY on health aspects relevant to ${categoryLabel} products
- DO NOT discuss unrelated health concerns (e.g., no ergonomics for food items)

You help people with chronic conditions make informed shopping decisions based on product features.`;

  const allergenList = allergies.length > 0
    ? `User allergies to check: ${allergies.join(', ')}`
    : 'No specific allergies to check';

  // Use health profile if provided, otherwise fall back to legacy guidance
  const profileGuidance = healthProfile || getConditionSpecificGuidance(conditionsArray);

  // Category-specific validation instructions
  const categoryInstructions = {
    food: `
⚠️ CRITICAL PRODUCT TYPE VALIDATION:
This is a FOOD/BEVERAGE product (ice cream, snack, meal, etc.). You MUST:
- ONLY discuss nutritional aspects (sugar, sodium, calories, ingredients, nutrients)
- ONLY discuss FOOD allergens (eggs, milk, soy, wheat, peanuts, tree nuts, fish, shellfish, sesame)
- ONLY discuss how this FOOD affects health conditions (dietary restrictions, blood sugar, sodium intake, etc.)
- DO NOT mention: fragrance, scent, perfume, chemicals (cleaning), irritants (topical), ergonomics, ease-of-use, physical handling
- DO NOT call this a "personal care item" or "household product" or any non-food category
- DO NOT discuss physical strength needed or handling ease - this is FOOD, not equipment
- If the product has "fragrance-free" mentioned, IGNORE IT - fragrances are not relevant for food products`,

    supplement: `
⚠️ CRITICAL PRODUCT TYPE VALIDATION:
This is a DIETARY SUPPLEMENT (vitamin, mineral, etc.). You MUST:
- ONLY discuss nutritional/supplement aspects (dosage, ingredients, interactions, nutrients)
- ONLY discuss food allergens and supplement-specific concerns
- DO NOT mention: fragrance, scent, ergonomics, physical handling, household chemicals`,

    household: `
This is a HOUSEHOLD/CLEANING product. Focus on:
- Chemical sensitivities and fragrances/scents
- Potential irritants for sensitive skin or airways
- Physical ease of use if relevant for conditions
- DO NOT discuss nutritional content, dietary restrictions, or food allergens`,

    'personal-care': `
This is a PERSONAL CARE product. Focus on:
- Skin sensitivities and fragrance/scent concerns
- Topical ingredients and potential irritants
- DO NOT discuss nutritional content or dietary aspects`,

    mobility: `
This is a MOBILITY/ASSISTIVE device. Focus on:
- Ergonomics and ease of use
- Physical demands and energy requirements
- Weight and handling considerations
- DO NOT discuss nutritional content, fragrance, or dietary aspects`,

    general: ''
  };

  const categoryInstruction = categoryInstructions[productCategory] || '';

  const userPrompt = `
PRODUCT CATEGORY: ${categoryLabel}

${categoryInstruction}

Analyze this ${categoryLabel} for someone with: ${conditionsList}

USER HEALTH PROFILE (filtered for ${categoryLabel} products):
${profileGuidance}

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

Return ONLY this JSON structure (evaluate ALL user conditions and allergies listed above):

⚠️ CRITICAL FORMATTING RULES:
- MUST wrap your response in markdown code fences: \`\`\`json ... \`\`\`
- Return ONLY the JSON object with NO additional text before or after the code block
- DO NOT add explanations, notes, or commentary outside the code block
- Inside the code block, output valid JSON starting with { and ending with }
- Use proper JSON string escaping: \\n for newlines, \\t for tabs, \\" for quotes
- NEVER use literal newline characters (pressing Enter) inside JSON strings - always use \\n
- For multi-line text, use \\n\\n to separate paragraphs (e.g., "First paragraph\\n\\nSecond paragraph")
- Ensure all quotes and commas are valid JSON syntax
- The JSON object must be complete and parseable

CORRECT formatting example:
{
  "insights": "First sentence about the product.\\n\\nSecond sentence with more details."
}

INCORRECT - DO NOT use literal line breaks like this:
{
  "insights": "First sentence
Second sentence"
}

{
  "conditions": [
    ${conditionsArray.map(c => `{"name": "${c}", "verdict": "good|warning|bad|inconclusive", "brief_reason": "..."}`).join(',\n    ')}
  ],
  "allergies": [
    ${allergies.map(a => `{"name": "${a}", "verdict": "good|warning|bad|inconclusive", "brief_reason": "..."}`).join(',\n    ')}
  ],
  "insights": "First sentence about product interaction. Second sentence with specific advice.\n\nThird sentence about risks. Fourth sentence with recommendation.",
  "caveat": "Brief important warning (40-50 words max)"
}

VERDICT DEFINITIONS:
- "good": Product is safe/helpful for this condition or allergen (e.g., allergen not present, beneficial ingredients)
- "warning": Mixed results or use with caution (e.g., some concerns but not critical)
- "bad": Product should be avoided (e.g., allergen present, harmful ingredients)
- "inconclusive": Insufficient data to make determination

For EACH condition in the conditions array, evaluate how this specific product affects that condition. Provide a verdict and brief_reason (1-2 sentences) explaining why.

For EACH allergen in the allergies array, check if the product contains that allergen and provide a verdict:
- If allergen is NOT detected in ingredients: "good"
- If allergen is detected: "bad"
- If uncertain: "warning" or "inconclusive"

Write 100-150 words total in the insights field as 2-3 short paragraphs of EXACTLY 2 sentences each. Separate paragraphs with blank lines (use natural paragraph breaks). Directly address the user with "you/your" language. Provide personalized insights based on their ${conditionsList}${allergies && allergies.length > 0 ? ` and allergen sensitivities (${allergies.join(', ')})` : ''}. Use **bold** for important ingredients or concerns, *italic* for emphasis. Focus on WHY this product matters for their specific health profile. Make it conversational as if speaking directly to them.

IMPORTANT:
- Always use "you/your" (e.g., "Given your ${conditionsList}...", "this could help you manage...") - NEVER use third person
${conditionsArray.length > 1 ? `- Consider ALL conditions (${conditionsList}) when providing insights\n` : ''}- Keep insights paragraphs to EXACTLY 2 sentences each for readability
- Separate each 2-sentence paragraph with blank lines (natural paragraph formatting in JSON strings)
- brief_reason fields should be 1-2 sentences, concise and specific to that condition/allergen

For the caveat: Write a single concise sentence (40-50 words maximum) highlighting the most critical limitation or warning. Use **bold** for key terms if needed.`;

  return { systemPrompt, userPrompt };
}

function getConditionSpecificGuidance(conditions) {
  // Handle single condition (backward compatibility) or array
  const conditionsArray = Array.isArray(conditions) ? conditions : [conditions];

  if (conditionsArray.length === 0) {
    return 'Provide general wellness and comfort analysis with specific reasoning for each point.';
  }

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

  // Build combined guidance for all conditions
  const guidanceTexts = conditionsArray.map(condition => {
    return guidance[condition] || generateEnhancedCustomGuidance(condition);
  });

  return guidanceTexts.join('\n\n');
}

/**
 * Generates enhanced, structured guidance for custom conditions.
 * Provides the AI with a comprehensive framework to analyze products
 * for conditions not in the predefined list.
 *
 * @param {string} condition - Custom condition name (e.g., "Fibromyalgia", "IBS")
 * @returns {string} Structured guidance prompt
 */
function generateEnhancedCustomGuidance(condition) {
  return `${condition} considerations - Provide detailed, evidence-based analysis:

**Symptom Management & Triggers:**
- Identify how product features, ingredients, or characteristics may affect ${condition} symptoms
- Consider common triggers, flare-up factors, or symptom exacerbators for ${condition}
- Evaluate whether this product could help manage or worsen specific ${condition} symptoms
- Explain the physiological or practical mechanisms involved

**Dietary & Ingredient Considerations:**
- Analyze ingredients for known sensitivities or beneficial compounds related to ${condition}
- Consider nutritional needs, deficiencies, or dietary restrictions common with ${condition}
- Evaluate food additives, preservatives, or compounds that may impact ${condition}
- Reference any established dietary guidelines or patterns for ${condition} management

**Usability & Lifestyle Factors:**
- Assess ease of use, preparation requirements, and physical demands for someone with ${condition}
- Consider cognitive load, energy expenditure, and accessibility challenges related to ${condition}
- Evaluate whether product design accommodates common functional limitations of ${condition}
- Identify features that support independence and quality of life with ${condition}

**Condition-Specific Product Suitability:**
- Determine if this product category is generally helpful, neutral, or problematic for ${condition}
- Consider timing, frequency, and context of use relative to ${condition} management
- Evaluate alignment with medical recommendations or therapeutic approaches for ${condition}
- Highlight any red flags or particularly beneficial aspects specific to ${condition}

**Evidence & Recommendations:**
- Reference established medical guidelines, research, or clinical recommendations for ${condition} when applicable
- Distinguish between evidence-based concerns and theoretical considerations
- Provide practical, actionable insights for someone managing ${condition} daily
- Explain WHY and HOW each factor matters specifically for ${condition}`;
}

/**
 * Intelligently fixes literal control characters in JSON strings.
 * Uses a state machine to only escape characters inside string values,
 * preserving structural whitespace outside strings.
 *
 * This is needed because the AI sometimes returns literal newlines
 * instead of escaped \n sequences, which breaks JSON.parse().
 *
 * @param {string} jsonStr - Raw JSON string potentially containing literal control chars
 * @returns {string} - JSON string with control chars properly escaped
 */
function fixLiteralControlChars(jsonStr) {
  let result = '';
  let inString = false;
  let prevChar = '';

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    // Track if we're inside a string value (respect escaped quotes)
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
      result += char;
    }
    // If inside string, escape control characters
    else if (inString) {
      if (char === '\n') result += '\\n';
      else if (char === '\r') result += '\\r';
      else if (char === '\t') result += '\\t';
      else result += char;
    }
    // Outside string, keep as-is (structural whitespace is OK)
    else {
      result += char;
    }

    prevChar = char;
  }

  return result;
}

/**
 * Parses AI verdict response with robust single-strategy approach.
 *
 * Process:
 * 1. Extract JSON from markdown code fences if present
 * 2. Pre-process with fixLiteralControlChars() to escape control characters
 * 3. Parse with JSON.parse()
 * 4. Validate and return, or fallback if parsing fails
 *
 * @param {string} response - Raw AI response
 * @param {Object} facts - Product facts
 * @param {Array} allergies - User allergies
 * @param {Array} conditions - User health conditions
 * @returns {Object} - Validated verdict object
 */
function parseVerdictResponse(response, facts, allergies, conditions = []) {
  console.log('Shop Well: Parsing AI response (length:', response.length, 'chars)');
  console.log('Shop Well: Response preview:', response.substring(0, 200));

  // Step 1: Extract JSON from markdown code block if present
  let jsonStr = response.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
    console.log('Shop Well: Extracted from markdown code block (length:', jsonStr.length, ')');
  } else {
    console.log('Shop Well: No markdown wrapper found, using raw response');
  }

  // Step 2: Pre-process to fix literal control characters (defensive safety net)
  const fixedJSON = fixLiteralControlChars(jsonStr);
  if (fixedJSON !== jsonStr) {
    console.log('Shop Well: Pre-processed to escape literal control characters');
  }

  // Step 3: Parse JSON
  try {
    const verdict = JSON.parse(fixedJSON);
    console.log('Shop Well: ✓ Successfully parsed AI response');
    return validateVerdict(verdict, facts, allergies, conditions);
  } catch (e) {
    // Parsing failed - log detailed error and use fallback
    console.error('Shop Well: ✗ JSON parsing failed:', e.message);
    console.error('Error position:', e.message.match(/position (\d+)/)?.[1] || 'unknown');
    console.error('Problematic JSON (first 500 chars):', fixedJSON.substring(0, 500));
    console.error('Problematic JSON (last 200 chars):', fixedJSON.substring(fixedJSON.length - 200));

    const verdict = createFallbackVerdict(facts, allergies, conditions);
    return validateVerdict(verdict, facts, allergies, conditions);
  }
}

function validateVerdict(verdict, facts, allergies, conditions = []) {
  const sanitized = {
    conditions: [],
    allergies: [],
    insights: typeof verdict.insights === 'string' ? verdict.insights : 'Analysis available.',
    caveat: typeof verdict.caveat === 'string' ? verdict.caveat : 'Please verify product details'
  };

  // Validate conditions array
  if (Array.isArray(verdict.conditions) && verdict.conditions.length > 0) {
    sanitized.conditions = verdict.conditions.map(c => ({
      name: c.name || 'Unknown',
      verdict: ['good', 'warning', 'bad', 'inconclusive'].includes(c.verdict) ? c.verdict : 'inconclusive',
      brief_reason: typeof c.brief_reason === 'string' ? c.brief_reason : 'Analysis unavailable'
    }));
  } else {
    // If AI didn't return conditions, create fallback entries for each user condition
    sanitized.conditions = conditions.map(name => ({
      name,
      verdict: 'inconclusive',
      brief_reason: 'Analysis unavailable for this condition'
    }));
  }

  // Validate allergies array
  if (Array.isArray(verdict.allergies) && verdict.allergies.length > 0) {
    sanitized.allergies = verdict.allergies.map(a => ({
      name: a.name || 'Unknown',
      verdict: ['good', 'warning', 'bad', 'inconclusive'].includes(a.verdict) ? a.verdict : 'inconclusive',
      brief_reason: typeof a.brief_reason === 'string' ? a.brief_reason : 'Analysis unavailable'
    }));
  } else {
    // If AI didn't return allergies, create fallback entries for each user allergen
    sanitized.allergies = allergies.map(name => {
      // Simple allergen check based on detected warnings
      const allergenLower = name.toLowerCase();
      const detected = facts.allergen_warnings.some(warning =>
        warning.toLowerCase().includes(allergenLower) ||
        allergenLower.includes(warning.toLowerCase())
      );

      return {
        name,
        verdict: detected ? 'bad' : 'good',
        brief_reason: detected
          ? 'Allergen detected in product'
          : 'No allergen detected in available information'
      };
    });
  }

  // Limit caveat length (up to 300 characters for ~50 words)
  if (sanitized.caveat.length > 300) {
    sanitized.caveat = sanitized.caveat.substring(0, 297) + '...';
  }

  return sanitized;
}

function createFallbackVerdict(facts, allergies = [], conditions = []) {
  console.log('Shop Well: Creating fallback verdict (no AI)');

  const caveat = 'AI analysis unavailable. Please verify details manually.';

  // Build conditions verdicts (all inconclusive when AI unavailable)
  const conditionsArray = conditions.map(condition => ({
    name: condition,
    verdict: 'inconclusive',
    brief_reason: 'AI analysis unavailable - please review product details manually'
  }));

  // Build allergies verdicts based on detected allergen warnings
  const allergiesArray = allergies.map(allergen => {
    const allergenLower = allergen.toLowerCase();
    const detected = facts.allergen_warnings.some(warning =>
      warning.toLowerCase().includes(allergenLower) ||
      allergenLower.includes(warning.toLowerCase())
    );

    if (detected) {
      return {
        name: allergen,
        verdict: 'bad',
        brief_reason: 'Allergen detected in product ingredients or warnings'
      };
    } else {
      return {
        name: allergen,
        verdict: 'good',
        brief_reason: 'No allergen detected in available product information'
      };
    }
  });

  // Build general insights
  const bullets = [];
  if (facts.allergen_warnings.length > 0) {
    const userAllergens = facts.allergen_warnings.filter(a => allergies.includes(a));
    if (userAllergens.length > 0) {
      bullets.push(`Contains allergens: ${userAllergens.join(', ')}`);
    } else {
      bullets.push('Contains allergens - check if relevant to you');
    }
  }

  if (facts.compression_garment) {
    bullets.push('Compression garment - may support circulation');
  }

  if (facts.gluten_free) {
    bullets.push('Labeled gluten-free');
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

  // Build insights from bullets
  const insights = bullets.map(b => `${b}.`).join(' ');

  return {
    conditions: conditionsArray,
    allergies: allergiesArray,
    insights: insights,
    caveat: caveat
  };
}

/* =============================================================================
   HTML PARSING UTILITIES (for cross-page analysis)
   ============================================================================= */

/**
 * Fetch product HTML from background worker with automated expansion
 * First tries automated browser automation, then falls back to simple fetch
 * @param {string} url - Product URL to fetch
 * @returns {Promise<Object>} { html: string, extractedData: Object|null, method: string }
 */
async function fetchProductHTML(url) {
  console.log('Shop Well: Requesting automated product extraction from background...');

  return new Promise((resolve, reject) => {
    // Try automated extraction first (browser automation with click expansion)
    chrome.runtime.sendMessage(
      { type: 'FETCH_PRODUCT_HTML_AUTOMATED', url },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Shop Well: Automated extraction unavailable:', chrome.runtime.lastError.message);
          // Fall back to simple fetch
          fetchProductHTMLFallback(url).then(resolve).catch(reject);
          return;
        }

        if (!response.ok) {
          console.warn('Shop Well: Automated extraction failed:', response.error);
          // Fall back to simple fetch
          fetchProductHTMLFallback(url).then(resolve).catch(reject);
          return;
        }

        console.log('Shop Well: Product data received via', response.method);
        resolve({
          html: response.html,
          extractedData: response.extractedData || null,
          method: response.method || 'automated',
          duration: response.duration
        });
      }
    );
  });
}

/**
 * Fallback: Simple HTML fetch without automation
 * @param {string} url - Product URL to fetch
 * @returns {Promise<Object>} { html: string, extractedData: null, method: string }
 */
async function fetchProductHTMLFallback(url) {
  console.log('Shop Well: Using fallback fetch method...');

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'FETCH_PRODUCT_HTML', url },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!response.ok) {
          reject(new Error(response.error || 'Fetch failed'));
        } else {
          resolve({
            html: response.html,
            extractedData: null,
            method: 'fallback-fetch'
          });
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

    // Profile building state
    this.profilePollingInterval = null;
    this.profilePollingStartTime = null;
    this.pendingProductData = null; // Store product data to analyze after profile completes

    this.elements = {
      loading: document.querySelector('.shop-well-loading'),
      profileBuilding: document.querySelector('.shop-well-profile-building'),
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
      'firstName', 'email',
      'condition', 'conditions', 'customConditions',
      'allergies', 'customAllergies'
    ]);
    this.settings.firstName = this.settings.firstName || '';
    this.settings.email = this.settings.email || '';

    // === BACKWARD COMPATIBILITY: Migrate old single condition to array ===
    if (!this.settings.conditions && this.settings.condition) {
      this.settings.conditions = [this.settings.condition];
      console.log('Side Panel: Migrated old condition to array:', this.settings.condition);
    }
    this.settings.conditions = this.settings.conditions || [];
    this.settings.customConditions = this.settings.customConditions || [];

    // Combine all conditions into single array for analysis
    this.settings.allConditions = [
      ...this.settings.conditions,
      ...this.settings.customConditions
    ];

    this.settings.allergies = this.settings.allergies || [];
    this.settings.customAllergies = this.settings.customAllergies || [];

    console.log('Side Panel: Loaded conditions:', this.settings.allConditions);

    // Check AI availability
    this.aiCapabilities = await checkAIAvailability();
    console.log('Shop Well: AI Capabilities:', this.aiCapabilities);

    // AUTO-GENERATE MISSING HEALTH PROFILES
    // Check if user has conditions/allergies but no profile → auto-generate
    await this.checkAndGenerateProfileIfNeeded();

    // Setup event listeners
    this.setupEventListeners();

    // Detect side panel close and perform comprehensive cleanup
    window.addEventListener('beforeunload', () => {
      console.log('Shop Well: Side panel closing...');

      // Perform comprehensive cleanup
      this.cleanup();

      // Notify content script to reset ALL badge states
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'side-panel-closed'
          });
          console.log('Shop Well: Sent side-panel-closed message to content script');
        }
      });
    });

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

    // Notify background that side panel is now open (for close detection)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.runtime.sendMessage({
          type: 'sidepanel-opened',
          tabId: tabs[0].id
        });
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

  /**
   * Comprehensive cleanup method called when analysis is cancelled or panel closes.
   * Clears all cached data, timers, AI sessions, and resets UI state.
   */
  cleanup() {
    console.log('Shop Well: Performing comprehensive cleanup...');

    // 1. Reset analyzing state (allows new analyses after reopen)
    this.isAnalyzing = false;
    console.log('Shop Well: Reset isAnalyzing flag');

    // 2. Clear all product data
    this.currentProductData = null;
    this.currentFacts = null;
    this.pendingProductData = null;
    console.log('Shop Well: Cleared product data');

    // 3. Clear all timers to prevent memory leaks
    if (this.timeoutWarningTimer) {
      clearTimeout(this.timeoutWarningTimer);
      this.timeoutWarningTimer = null;
      console.log('Shop Well: Cleared timeout warning timer');
    }
    if (this.messageReceivedTimer) {
      clearTimeout(this.messageReceivedTimer);
      this.messageReceivedTimer = null;
      console.log('Shop Well: Cleared message received timer');
    }
    if (this.profilePollingInterval) {
      clearInterval(this.profilePollingInterval);
      this.profilePollingInterval = null;
      console.log('Shop Well: Cleared profile polling interval');
    }

    // 4. Clear profile building state
    this.profilePollingStartTime = null;

    // 5. Destroy cached AI sessions to free memory
    if (this.cachedSummarizer) {
      try {
        this.cachedSummarizer.destroy();
        console.log('Shop Well: Destroyed cached Summarizer session');
      } catch (err) {
        console.warn('Shop Well: Failed to destroy summarizer:', err);
      }
      this.cachedSummarizer = null;
    }
    if (this.cachedLanguageModel) {
      try {
        this.cachedLanguageModel.destroy();
        console.log('Shop Well: Destroyed cached LanguageModel session');
      } catch (err) {
        console.warn('Shop Well: Failed to destroy language model:', err);
      }
      this.cachedLanguageModel = null;
    }
    this.hasSuccessfulAICall = false;
    console.log('Shop Well: Reset AI state');

    // 6. Clear chat history and UI
    this.chatHistory = [];
    if (this.elements.chatMessages) {
      this.elements.chatMessages.innerHTML = '';
    }
    if (this.elements.chatInput) {
      this.elements.chatInput.value = '';
    }
    console.log('Shop Well: Cleared chat state');

    // 7. Reset UI state to welcome (ready for next use)
    this.currentState = 'welcome';

    console.log('Shop Well: Cleanup complete');
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
        // Prevent starting new analysis if one is already in progress
        if (this.isAnalyzing) {
          console.warn('Shop Well: Analysis already in progress, ignoring analyze-product request');
          sendResponse({ success: false, error: 'Analysis in progress' });
          return true;
        }

        // Clear the message received timer
        if (this.messageReceivedTimer) {
          clearTimeout(this.messageReceivedTimer);
          this.messageReceivedTimer = null;
        }
        this.analyzeProduct(message.productData);
        sendResponse({ success: true });
      } else if (message.type === 'analyze-listing-product') {
        // Prevent starting new analysis if one is already in progress
        if (this.isAnalyzing) {
          console.warn('Shop Well: Analysis already in progress, ignoring analyze-listing-product request');
          sendResponse({ success: false, error: 'Analysis in progress' });
          return true;
        }

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
      this.elements.profileBuilding,
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
    if (loadingText) loadingText.textContent = 'Analyzing product...';
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

  showProfileBuilding(isAutoGeneration = false) {
    this.hideAllStates();
    if (this.elements.profileBuilding) {
      this.elements.profileBuilding.classList.remove('hidden');

      // Update message based on context
      const messageElement = this.elements.profileBuilding.querySelector('p');
      const submessageElement = this.elements.profileBuilding.querySelector('small');

      if (isAutoGeneration) {
        if (messageElement) {
          messageElement.textContent = '🤖 Building your personalized health profile...';
        }
        if (submessageElement) {
          submessageElement.textContent = 'This only happens once and takes about 10-15 seconds.';
        }
        console.log('Shop Well: Auto-generating health profile');
      } else {
        if (messageElement) {
          messageElement.textContent = 'Your health profile is being built...';
        }
        if (submessageElement) {
          submessageElement.textContent = 'This was started in the Settings page. Please wait...';
        }
        console.log('Shop Well: Waiting for profile to build');
      }
    }
    this.currentState = 'profileBuilding';
    console.log('Shop Well: Showing profile building state');

    // Only start polling if NOT auto-generating (auto-generation handles its own completion)
    if (!isAutoGeneration) {
      this.startProfilePolling();
    }
  }

  /**
   * Check the current health profile status
   * @returns {Promise<Object>} Profile status object
   */
  async checkProfileStatus() {
    try {
      const result = await chrome.storage.local.get(['profileStatus', 'healthProfile']);
      const profileStatus = result.profileStatus;
      const healthProfile = result.healthProfile;

      // If profileStatus exists, use it
      if (profileStatus && profileStatus.status) {
        return profileStatus;
      }

      // Migration: Check if old healthProfile exists (backward compatibility)
      if (healthProfile && healthProfile.profile) {
        console.log('Shop Well: Found existing healthProfile without profileStatus - migrating to complete status');

        // Auto-create profileStatus for existing users
        const migratedStatus = {
          status: 'complete',
          completedAt: healthProfile.generatedAt || new Date().toISOString()
        };

        // Save the migrated status
        await chrome.storage.local.set({ profileStatus: migratedStatus });

        return migratedStatus;
      }

      // No profile exists at all - truly not started
      return { status: 'not-started' };
    } catch (error) {
      console.error('Shop Well: Error checking profile status:', error);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Check if profile needs to be generated and auto-generate if needed
   * Called during sidepanel initialization
   */
  async checkAndGenerateProfileIfNeeded() {
    // Check if user has any conditions or allergies
    const hasConditionsOrAllergies =
      this.settings.allConditions.length > 0 ||
      this.settings.allergies.length > 0 ||
      this.settings.customAllergies.length > 0;

    if (!hasConditionsOrAllergies) {
      console.log('Shop Well: No conditions or allergies - profile not needed');
      return;
    }

    // Check current profile status
    const profileCheck = await this.checkProfileStatus();
    console.log('Shop Well: Profile check result:', profileCheck.status);

    // Auto-generate if profile is missing or not started
    if (profileCheck.status === 'not-started') {
      console.log('Shop Well: Profile not found - auto-generating...');
      console.log('Shop Well: User has', this.settings.allConditions.length, 'conditions and',
                  (this.settings.allergies.length + this.settings.customAllergies.length), 'allergies');

      await this.autoGenerateHealthProfile();
    } else if (profileCheck.status === 'complete') {
      console.log('Shop Well: Existing health profile found - using cached profile');
    } else if (profileCheck.status === 'building') {
      console.log('Shop Well: Profile is currently building (started elsewhere)');
    } else if (profileCheck.status === 'error') {
      console.log('Shop Well: Previous profile generation failed - attempting regeneration...');
      await this.autoGenerateHealthProfile();
    }
  }

  /**
   * Automatically generate health profile in the background
   * Runs during sidepanel initialization if profile is missing
   */
  async autoGenerateHealthProfile() {
    try {
      console.log('Shop Well: Starting automatic health profile generation...');

      // Show UI feedback
      this.showProfileBuilding(true); // true = auto-generation mode

      // Set status to building
      await chrome.storage.local.set({
        profileStatus: {
          status: 'building',
          startedAt: new Date().toISOString(),
          autoGenerated: true
        }
      });

      const allConditions = this.settings.allConditions;
      const allAllergies = [...this.settings.allergies, ...this.settings.customAllergies];

      // Generate profile using AI (same logic as options.js)
      const healthProfile = await this.generateHealthProfileWithAI(allConditions, allAllergies);

      if (healthProfile) {
        // Save generated profile
        await chrome.storage.local.set({
          healthProfile: {
            conditions: this.settings.conditions,
            customConditions: this.settings.customConditions,
            allergies: this.settings.allergies,
            customAllergies: this.settings.customAllergies,
            profile: healthProfile,
            generatedAt: new Date().toISOString()
          },
          profileStatus: {
            status: 'complete',
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            autoGenerated: true
          }
        });

        console.log('Shop Well: Health profile auto-generated successfully');
        console.log('Shop Well: Profile length:', healthProfile.length, 'characters');

        // Continue to show welcome state
        this.showWelcome();
      } else {
        throw new Error('Profile generation returned null');
      }

    } catch (error) {
      console.error('Shop Well: Auto-generation failed:', error);

      // Set error status
      await chrome.storage.local.set({
        profileStatus: {
          status: 'error',
          startedAt: new Date().toISOString(),
          error: error.message || 'Profile generation failed',
          autoGenerated: true
        }
      });

      // Show welcome anyway - will use fallback guidance
      this.showWelcome();
    }
  }

  /**
   * Generate health profile using AI (LanguageModel API)
   * Same logic as options.js generateHealthProfile()
   */
  async generateHealthProfileWithAI(conditions = [], allergies = []) {
    console.log('Shop Well: Generating AI profile for', conditions.length, 'conditions and', allergies.length, 'allergies');

    try {
      const allConditions = conditions;
      const allAllergies = allergies;

      // Handle empty profile
      if (allConditions.length === 0 && allAllergies.length === 0) {
        return 'General wellness focus. User has no specific health conditions or allergies specified.';
      }

      // Check if LanguageModel is available
      if (typeof LanguageModel === 'undefined') {
        console.warn('Shop Well: LanguageModel not available, using fallback profile');
        return this.generateFallbackProfile(allConditions, allAllergies);
      }

      // Create AI session
      const session = await LanguageModel.create({
        temperature: 0.7,
        topK: 3
      });

      const profilePrompt = `You are a health profile analyst. Create a comprehensive, personalized health profile for someone with the following conditions and allergies.

**Conditions:** ${allConditions.length > 0 ? allConditions.join(', ') : 'None'}
**Allergies/Sensitivities:** ${allAllergies.length > 0 ? allAllergies.join(', ') : 'None'}

Generate a detailed health profile that includes:

1. **Key Health Considerations:**
   - For each condition, explain the primary symptoms and challenges
   - Note any interactions or compounding effects between multiple conditions
   - Explain how these conditions affect daily product choices

2. **Ingredients & Features to AVOID:**
   - List specific ingredients that could worsen symptoms or trigger reactions
   - Explain WHY each ingredient is problematic for this specific health profile
   - Include both obvious allergens and hidden triggers

3. **Ingredients & Features to SEEK:**
   - List beneficial ingredients, nutrients, or product features
   - Explain HOW each helps manage symptoms or support health
   - Prioritize evidence-based recommendations

4. **Product Category Guidance:**
   - Foods: Key nutritional needs and dietary restrictions
   - Household items: Sensitivities to fragrances, chemicals, textures
   - Wellness products: Ergonomics, ease-of-use, physical demands
   - General: Any product considerations unique to this health profile

5. **Special Considerations:**
   - Note any unique aspects of this particular combination of conditions
   - Highlight potential conflicts (e.g., "POTS needs high sodium but hypertension needs low sodium")
   - Provide nuanced guidance for complex situations

Write 300-400 words in a clear, factual tone. Focus on actionable insights that will help analyze products for this specific health profile. This profile will be used by an AI assistant to evaluate products, so be thorough and specific.`;

      const response = await session.prompt(profilePrompt);
      session.destroy();

      console.log('Shop Well: AI profile generated successfully, length:', response.length);
      return response.trim();

    } catch (error) {
      console.error('Shop Well: AI profile generation failed:', error);
      return this.generateFallbackProfile(conditions, allergies);
    }
  }

  /**
   * Generate basic fallback profile when AI is unavailable
   */
  generateFallbackProfile(allConditions, allAllergies) {
    let profile = 'Health Profile:\n\n';

    if (allConditions.length > 0) {
      profile += `Conditions: ${allConditions.join(', ')}\n`;
      profile += 'Focus on products that support symptom management and daily comfort.\n\n';
    }

    if (allAllergies.length > 0) {
      profile += `Allergies/Sensitivities: ${allAllergies.join(', ')}\n`;
      profile += 'Avoid products containing these allergens. Check ingredient lists carefully.\n';
    }

    console.log('Shop Well: Using fallback profile (AI unavailable)');
    return profile;
  }

  /**
   * Start polling for health profile completion
   */
  startProfilePolling() {
    console.log('Shop Well: Starting profile completion polling');

    // Clear any existing polling interval
    if (this.profilePollingInterval) {
      clearInterval(this.profilePollingInterval);
    }

    this.profilePollingStartTime = Date.now();
    const MAX_POLLING_TIME = 120000; // 2 minutes

    this.profilePollingInterval = setInterval(async () => {
      const profileCheck = await this.checkProfileStatus();
      const elapsedTime = Date.now() - this.profilePollingStartTime;

      console.log('Shop Well: Polling profile status:', profileCheck.status);

      if (profileCheck.status === 'complete') {
        console.log('Shop Well: Profile completed! Continuing with analysis...');

        // Stop polling
        clearInterval(this.profilePollingInterval);
        this.profilePollingInterval = null;

        // If we have pending product data, analyze it now
        if (this.pendingProductData) {
          const productData = this.pendingProductData;
          this.pendingProductData = null;

          // Determine which analysis method to use based on product source
          if (productData.source && productData.source.includes('search')) {
            this.analyzeListingProduct(productData);
          } else {
            this.analyzeProduct(productData);
          }
        }

      } else if (profileCheck.status === 'error') {
        console.error('Shop Well: Profile generation failed during polling');

        // Stop polling
        clearInterval(this.profilePollingInterval);
        this.profilePollingInterval = null;

        this.showError('Health profile generation failed. Please visit the Settings page to regenerate your profile.');

      } else if (elapsedTime >= MAX_POLLING_TIME) {
        console.error('Shop Well: Profile polling timeout after 2 minutes');

        // Stop polling
        clearInterval(this.profilePollingInterval);
        this.profilePollingInterval = null;

        this.showError('Profile generation is taking longer than expected. Please check the Settings page or try again later.');
      }
    }, 2000); // Poll every 2 seconds
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

    // Notify content script that analysis ended with error (reset analyzing state)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'analysis-error'
        });
      }
    });
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

    // Hide verdict sections during analysis
    const conditionsSection = this.elements.analysis.querySelector('.conditions-section');
    if (conditionsSection) conditionsSection.classList.add('hidden');

    const allergiesSection = this.elements.analysis.querySelector('.allergies-section');
    if (allergiesSection) allergiesSection.classList.add('hidden');

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

    // Update conditions verdicts list
    const conditionsList = this.elements.analysis.querySelector('.conditions-list');
    const conditionsSection = this.elements.analysis.querySelector('.conditions-section');
    if (conditionsList && verdict.conditions && verdict.conditions.length > 0) {
      conditionsList.innerHTML = verdict.conditions.map(c => `
        <div class="verdict-item verdict-${c.verdict}">
          <div class="verdict-item-header">
            <div class="verdict-header-left">
              <span class="verdict-chevron">▶</span>
              <span class="verdict-name">${c.name}</span>
            </div>
            <span class="verdict-badge-inline">${getVerdictEmoji(c.verdict)} ${getVerdictLabel(c.verdict)}</span>
          </div>
          ${c.brief_reason ? `<div class="verdict-reason collapsed">${formatInlineMarkdown(c.brief_reason)}</div>` : ''}
        </div>
      `).join('');

      // Add click handlers for accordion toggle
      conditionsList.querySelectorAll('.verdict-item-header').forEach(header => {
        header.addEventListener('click', () => {
          const item = header.closest('.verdict-item');
          const reason = item.querySelector('.verdict-reason');
          if (reason) {
            item.classList.toggle('expanded');
            reason.classList.toggle('collapsed');
          }
        });
      });

      if (conditionsSection) conditionsSection.classList.remove('hidden');
    } else {
      if (conditionsSection) conditionsSection.classList.add('hidden');
    }

    // Update allergies verdicts list
    const allergiesList = this.elements.analysis.querySelector('.allergies-list');
    const allergiesSection = this.elements.analysis.querySelector('.allergies-section');
    if (allergiesList && verdict.allergies && verdict.allergies.length > 0) {
      allergiesList.innerHTML = verdict.allergies.map(a => `
        <div class="verdict-item verdict-${a.verdict}">
          <div class="verdict-item-header">
            <div class="verdict-header-left">
              <span class="verdict-chevron">▶</span>
              <span class="verdict-name">${a.name.charAt(0).toUpperCase() + a.name.slice(1)}</span>
            </div>
            <span class="verdict-badge-inline">${getVerdictEmoji(a.verdict)} ${getVerdictLabel(a.verdict)}</span>
          </div>
          ${a.brief_reason ? `<div class="verdict-reason collapsed">${formatInlineMarkdown(a.brief_reason)}</div>` : ''}
        </div>
      `).join('');

      // Add click handlers for accordion toggle
      allergiesList.querySelectorAll('.verdict-item-header').forEach(header => {
        header.addEventListener('click', () => {
          const item = header.closest('.verdict-item');
          const reason = item.querySelector('.verdict-reason');
          if (reason) {
            item.classList.toggle('expanded');
            reason.classList.toggle('collapsed');
          }
        });
      });

      if (allergiesSection) allergiesSection.classList.remove('hidden');
    } else {
      if (allergiesSection) allergiesSection.classList.add('hidden');
    }

    // Update condition info
    const conditionInfo = this.elements.analysis.querySelector('.condition-info');
    if (conditionInfo) {
      const personalization = getPersonalization(this.settings.firstName);
      if (personalization.hasName) {
        conditionInfo.textContent = `For ${personalization.subject}`;
      } else {
        conditionInfo.textContent = `For You`;
      }
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
    const insightsContent = this.elements.analysis.querySelector('.insights-content');
    if (insightsContent) {
      if (verdict.insights) {
        // Apply sentence splitting to ensure 2-sentence paragraphs
        const splitInsights = splitIntoTwoSentenceParagraphs(verdict.insights);
        // Parse markdown and render as HTML
        const htmlContent = parseMarkdownToHTML(splitInsights);
        insightsContent.innerHTML = htmlContent;
      } else if (verdict.bullets && verdict.bullets.length > 0) {
        // Fallback: Support old bullet format for backward compatibility
        const fallbackHTML = verdict.bullets
          .map(bullet => `<p>${bullet}</p>`)
          .join('');
        insightsContent.innerHTML = fallbackHTML;
      } else {
        insightsContent.innerHTML = '<p>No insights available.</p>';
      }
    }

    // Show caveat if any
    const caveatSection = this.elements.analysis.querySelector('.important-caveat');
    if (caveatSection && verdict.caveat) {
      caveatSection.classList.remove('hidden');
      const caveatContent = caveatSection.querySelector('.caveat-content');
      if (caveatContent) {
        // Parse markdown formatting (bold, italic)
        caveatContent.innerHTML = formatInlineMarkdown(verdict.caveat);
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

    // Notify content script that side panel analysis is complete (reset analyzing state)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'analysis-complete'
        });
      }
    });

    // Notify content script that analysis is complete (update badge to "Look!" and cache results)
    if (this.currentProductData && this.currentProductData.position !== undefined) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'badge-analysis-complete',
            productIndex: this.currentProductData.position,
            productId: this.currentProductData.id,
            analysisResults: {
              verdict: verdict,
              facts: facts
            }
          });
        }
      });
    }
  }

  cancelAnalysis() {
    console.log('Shop Well: Analysis cancelled by user');

    // Notify content script to revert badge to normal state
    if (this.currentProductData && this.currentProductData.id) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'badge-analysis-cancelled',
            productId: this.currentProductData.id
          });
        }
      });
    }

    // Perform comprehensive cleanup (clears all cache, timers, AI sessions)
    this.cleanup();

    // Close the side panel
    window.close();
  }

  async analyzeProduct(productData) {
    console.log('Shop Well: Starting product analysis...', productData);

    // Set analyzing state IMMEDIATELY (before any async operations)
    this.isAnalyzing = true;
    this.currentProductData = productData;

    // Check profile status before starting analysis
    const profileCheck = await this.checkProfileStatus();

    if (profileCheck.status === 'building' || profileCheck.status === 'not-started') {
      console.log('Shop Well: Health profile is still building or not started, waiting...');
      this.pendingProductData = productData;
      this.showProfileBuilding();
      // Keep isAnalyzing = true during profile building
      return;
    } else if (profileCheck.status === 'error') {
      console.log('Shop Well: Health profile generation failed');
      this.isAnalyzing = false; // Reset flag on error
      this.showError('Health profile generation failed. Please visit the Settings page to regenerate your profile.');
      return;
    }

    // Profile is complete, proceed with analysis
    this.showLoading();

    console.log('Shop Well: Profile ready, continuing with analysis...');

    // Clear all other "Look!" badges before analyzing new product
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'clear-all-active-badges'
        });
      }
    });

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
          this.settings.allConditions,
          allAllergies,
          this.cachedLanguageModel,
          this.settings.firstName,
          productData
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
        verdict = createFallbackVerdict(facts, allAllergies, this.settings.allConditions);
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
    console.log('Shop Well: Analyzing listing product with progressive loading...', productData);

    // Set analyzing state IMMEDIATELY (before any async operations)
    this.isAnalyzing = true;
    this.currentProductData = productData;

    // Check profile status before starting analysis
    const profileCheck = await this.checkProfileStatus();

    if (profileCheck.status === 'building' || profileCheck.status === 'not-started') {
      console.log('Shop Well: Health profile is still building or not started, waiting...');
      this.pendingProductData = productData;
      this.showProfileBuilding();
      // Keep isAnalyzing = true during profile building
      return;
    } else if (profileCheck.status === 'error') {
      console.log('Shop Well: Health profile generation failed');
      this.isAnalyzing = false; // Reset flag on error
      this.showError('Health profile generation failed. Please visit the Settings page to regenerate your profile.');
      return;
    }

    // Profile is complete, proceed with analysis
    console.log('Shop Well: Profile ready, continuing with analysis...');

    // Clear all other "Look!" badges before analyzing new product
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'clear-all-active-badges'
        });
      }
    });

    try {
      // Re-check AI capabilities
      this.aiCapabilities = await checkAIAvailability();
      const allAllergies = [...this.settings.allergies, ...this.settings.customAllergies];

      // ===================================================================
      // PHASE 1: Show clean loading state
      // ===================================================================
      this.showLoading();

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
      // PHASE 2: Fetch full product HTML (with automated expansion)
      // ===================================================================
      this.updateProgressMessage('🌐 Fetching full product details...');
      console.log('Shop Well: Fetching product URL:', productData.url);

      let fetchResult;
      let fullProductData;

      try {
        fetchResult = await fetchProductHTML(productData.url);
        console.log('Shop Well: Product data fetched via', fetchResult.method);

        if (fetchResult.duration) {
          console.log('Shop Well: Fetch duration:', fetchResult.duration, 'ms');
        }
      } catch (error) {
        console.warn('Shop Well: Failed to fetch product data:', error);
        // Fall back to title-only analysis
        fetchResult = null;
      }

      // Abort check: Stop if panel was closed during product fetch
      if (!this.isAnalyzing) {
        console.log('Shop Well: Analysis aborted after product fetch (panel closed)');
        return;
      }

      // ===================================================================
      // PHASE 3: Parse full product data
      // ===================================================================
      if (fetchResult) {
        // If automated extraction provided structured data, use it directly
        if (fetchResult.extractedData) {
          this.updateProgressMessage('📋 Processing extracted product data...');
          console.log('Shop Well: Using automated extraction data (skipping HTML parsing)');
          fullProductData = fetchResult.extractedData;

          // Log what data we got
          console.log('Shop Well: Automated extraction results:', {
            hasTitle: !!fullProductData.title,
            hasIngredients: !!fullProductData.ingredients,
            ingredientsLength: fullProductData.ingredients?.length || 0,
            bulletCount: fullProductData.bullets?.length || 0,
            descriptionLength: fullProductData.description?.length || 0,
            hasSpecifications: fullProductData.specifications?.length > 0
          });
        } else {
          // Fall back to HTML parsing
          this.updateProgressMessage('📋 Extracting ingredients and details...');
          console.log('Shop Well: No extractedData, parsing HTML...');

          fullProductData = parseProductHTML(fetchResult.html, productData.url);

          if (!fullProductData) {
            console.warn('Shop Well: HTML parsing failed, using title-only data');
            fullProductData = productData; // Fallback to search card data
          } else {
            console.log('Shop Well: Full product data extracted:', {
              hasIngredients: !!fullProductData.ingredients,
              bulletCount: fullProductData.bullets?.length || 0,
              descriptionLength: fullProductData.description?.length || 0
            });
          }
        }

        // Merge search card data with extracted/parsed data
        if (fullProductData && fullProductData !== productData) {
          fullProductData = {
            ...fullProductData,
            // Preserve search card specific data
            id: productData.id,
            image: productData.image,
            rating: productData.rating,
            position: productData.position,
            source: productData.source,
            // Only preserve pricePerUnit if extracted data didn't provide one
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

        // Abort check: Stop if panel was closed during fact extraction
        if (!this.isAnalyzing) {
          console.log('Shop Well: Analysis aborted after fact extraction (panel closed)');
          return;
        }

        // Create facts if summarizer didn't work
        if (!facts) {
          facts = createFallbackFacts(fullProductData);
        }

        // Generate verdict with AI
        if (this.aiCapabilities && this.aiCapabilities.prompt) {
          const verdictResult = await generateVerdict(
            facts,
            this.settings.allConditions,
            allAllergies,
            this.cachedLanguageModel,
            this.settings.firstName,
            fullProductData
          );
          verdict = verdictResult.verdict;
          if (verdictResult.languageModel) {
            this.cachedLanguageModel = verdictResult.languageModel;
          }
        }

        // Abort check: Stop if panel was closed during verdict generation
        if (!this.isAnalyzing) {
          console.log('Shop Well: Analysis aborted after verdict generation (panel closed)');
          return;
        }

        if (!verdict) {
          verdict = createFallbackVerdict(facts, allAllergies, this.settings.allConditions);
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
            this.settings.allConditions,
            allAllergies,
            this.cachedLanguageModel,
            this.settings.firstName,
            fullProductData
          );
          verdict = verdictResult.verdict;
          if (verdictResult.languageModel) {
            this.cachedLanguageModel = verdictResult.languageModel;
          }
        }

        if (!verdict) {
          verdict = createFallbackVerdict(facts, allAllergies, this.settings.allConditions);
        }

        verdict.caveat = `Limited data available. ${verdict.caveat || 'Visit product page for complete details.'}`;
      }

      // ===================================================================
      // PHASE 5: Display final results
      // ===================================================================
      this.isAnalyzing = false;
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
      const conditionsList = this.settings.allConditions.join(', ') || 'general wellness';

      const contextPrompt = `You are a wellness shopping assistant helping someone with ${conditionsList}.

PRODUCT CONTEXT:
- Product: ${this.currentProductData.title || 'Unknown'}
- High sodium: ${this.currentFacts.high_sodium || false}
- High sugar: ${this.currentFacts.high_sugar || false}
- Gluten-free: ${this.currentFacts.gluten_free || false}
- Allergen warnings: ${this.currentFacts.allergen_warnings?.join(', ') || 'none'}

CRITICAL RULES:
- Answer questions about THIS specific product for someone with ${conditionsList}
- ALWAYS address the user directly as "you/your" (e.g., "This could help you...", "For your POTS...")
- Use supportive language like "may", "could", "consider"
- Never provide medical advice or diagnosis
- Keep responses under 100 words
- Be specific and actionable
- Reference the product features when answering

User question: ${userMessage}

Provide a helpful, informative response addressing the user directly with "you/your":`;

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

    // For AI responses, parse markdown and handle line breaks
    if (type === 'ai') {
      // Try to detect and parse JSON responses
      let processedMessage = message;
      try {
        const jsonMatch = message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          // Extract text content from JSON structure
          processedMessage = parsed.response || parsed.answer || parsed.text || message;
        }
      } catch (e) {
        // Not JSON or invalid JSON, use original message
      }

      // Apply markdown formatting (bold, italic)
      processedMessage = formatInlineMarkdown(processedMessage);

      // Convert line breaks: double newlines -> paragraph break, single newlines -> line break
      processedMessage = processedMessage.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

      bubble.innerHTML = processedMessage;
    } else {
      // User messages remain plain text
      bubble.textContent = message;
    }

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
