// Chrome Built-in AI Summarizer Implementation
import { getUserLanguage } from '../utils/language.js';

/**
 * Extract structured wellness facts from product data using Chrome's Summarizer API
 * @param {Object} productData - Raw product data from parsers
 * @returns {Promise<Object|null>} Structured facts or null if failed
 */
export async function summarizeProduct(productData) {
  try {
    console.log('Shop Well: Starting AI summarization...');

    // Check if Summarizer API is available
    if (typeof Summarizer === 'undefined') {
      console.warn('Shop Well: Summarizer API not available');
      return null;
    }

    // Get user's language preference
    const language = await getUserLanguage();
    console.log('Shop Well: Summarizing in:', language.code, `(${language.name})`);

    // Prepare input text with structured format
    const inputText = prepareInputText(productData);

    if (!inputText) {
      console.warn('Shop Well: No suitable content for summarization');
      return null;
    }

    console.log('Shop Well: Summarizer input length:', inputText.length);

    // Create summarizer session
    const summarizer = await Summarizer.create({ language: language.code });

    // Generate summary with structured prompt
    const summary = await summarizer.summarize(inputText);

    console.log('Shop Well: Raw summarizer output:', summary);

    // Parse the structured output
    const facts = parseStructuredFacts(summary, productData);

    console.log('Shop Well: Extracted facts:', facts);

    return facts;

  } catch (error) {
    console.error('Shop Well: Summarization failed:', error);
    return null;
  }
}

/**
 * Prepare structured input text for the Summarizer API
 * @param {Object} productData - Raw product data
 * @returns {string} Formatted input text
 */
function prepareInputText(productData) {
  const sections = [];

  // Add product title
  if (productData.title) {
    sections.push(`PRODUCT: ${productData.title}`);
  }

  // Add key features
  if (productData.bullets && productData.bullets.length > 0) {
    sections.push(`FEATURES: ${productData.bullets.slice(0, 5).join('; ')}`);
  }

  // Add ingredients (crucial for allergen detection)
  if (productData.ingredients) {
    sections.push(`INGREDIENTS: ${productData.ingredients}`);
  }

  // Add description (truncated)
  if (productData.description) {
    const truncatedDesc = productData.description.substring(0, 800);
    sections.push(`DESCRIPTION: ${truncatedDesc}`);
  }

  // Add sample reviews for sentiment
  if (productData.reviews && productData.reviews.length > 0) {
    const reviewSample = productData.reviews.slice(0, 3).join('; ');
    sections.push(`REVIEWS: ${reviewSample.substring(0, 400)}`);
  }

  const inputText = sections.join('\n\n');

  // Ensure we stay within API limits (typically 3000 chars)
  if (inputText.length > 2800) {
    return inputText.substring(0, 2800) + '...';
  }

  return inputText;
}

/**
 * Parse structured facts from AI summary output
 * @param {string} summary - AI-generated summary
 * @param {Object} productData - Original product data for fallback
 * @returns {Object} Structured facts object
 */
function parseStructuredFacts(summary, productData) {
  const facts = {
    // Nutrition/dietary
    high_sodium: false,
    high_sugar: false,
    gluten_free: false,
    dietary_claims: [],

    // Physical properties
    lightweight: false,
    compression_garment: false,

    // Safety
    allergen_warnings: [],

    // General wellness
    ease_of_use: false,
    ergonomic_design: false,

    // Raw data for custom analysis
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

  // Gluten-free detection
  if (summaryLower.includes('gluten-free') || summaryLower.includes('gluten free') ||
      titleLower.includes('gluten-free') || bulletsText.includes('gluten-free')) {
    facts.gluten_free = true;
    facts.dietary_claims.push('gluten-free');
  }

  // Compression garment detection
  if (titleLower.includes('compression') || bulletsText.includes('compression') ||
      summaryLower.includes('compression') || titleLower.includes('socks') ||
      titleLower.includes('sleeve') || titleLower.includes('stocking')) {
    facts.compression_garment = true;
  }

  // Weight/ease of use analysis
  if (summaryLower.includes('lightweight') || summaryLower.includes('easy') ||
      summaryLower.includes('simple') || bulletsText.includes('lightweight') ||
      bulletsText.includes('easy to use')) {
    facts.lightweight = true;
    facts.ease_of_use = true;
  }

  // Ergonomic design
  if (summaryLower.includes('ergonomic') || summaryLower.includes('comfortable') ||
      bulletsText.includes('ergonomic') || bulletsText.includes('comfort')) {
    facts.ergonomic_design = true;
  }

  // Allergen detection (basic patterns)
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
  if (productData.ingredients || productData.bullets.length >= 3) {
    facts.confidence = 'high';
  } else if (productData.title && productData.description) {
    facts.confidence = 'medium';
  } else {
    facts.confidence = 'low';
  }

  return facts;
}

/**
 * Create fallback facts when AI is unavailable
 * @param {Object} productData - Raw product data
 * @returns {Object} Basic facts from pattern matching
 */
export function createFallbackFacts(productData) {
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

  // Use the same parsing logic as AI analysis but with original data
  return parseStructuredFacts(
    JSON.stringify(productData), // Use raw data as "summary"
    productData
  );
}