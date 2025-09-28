// Chrome Built-in AI Prompt Implementation

/**
 * Generate wellness verdict using Chrome's Prompt API
 * @param {Object} facts - Structured facts from summarizer
 * @param {string} condition - User's health condition
 * @param {Array} allergies - User's allergies (preset + custom)
 * @param {string} customCondition - Custom condition text if applicable
 * @returns {Promise<Object|null>} Verdict object or null if failed
 */
export async function generateVerdict(facts, condition, allergies = [], customCondition = '') {
  try {
    console.log('Shop Well: Starting AI verdict generation...');

    // Check if Prompt API is available
    if (!window.ai?.languageModel) {
      console.warn('Shop Well: Prompt API not available');
      return null;
    }

    // Prepare the prompt
    const { systemPrompt, userPrompt } = preparePrompts(facts, condition, allergies, customCondition);

    console.log('Shop Well: Prompt length:', userPrompt.length);

    // Create language model session
    const session = await window.ai.languageModel.create({
      systemPrompt: systemPrompt
    });

    // Generate response
    const response = await session.prompt(userPrompt);

    console.log('Shop Well: Raw AI response:', response);

    // Parse the JSON response
    const verdict = parseVerdictResponse(response, facts, allergies);

    console.log('Shop Well: Generated verdict:', verdict);

    return verdict;

  } catch (error) {
    console.error('Shop Well: Verdict generation failed:', error);
    return null;
  }
}

/**
 * Prepare system and user prompts for the AI
 * @param {Object} facts - Product facts
 * @param {string} condition - Health condition
 * @param {Array} allergies - Allergies list
 * @param {string} customCondition - Custom condition text
 * @returns {Object} System and user prompts
 */
function preparePrompts(facts, condition, allergies, customCondition) {
  const systemPrompt = `You are a wellness shopping assistant that provides informational guidance only.

CRITICAL RULES:
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

/**
 * Get condition-specific guidance for prompts
 * @param {string} condition - Health condition
 * @returns {string} Guidance text
 */
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

/**
 * Parse and validate the AI verdict response
 * @param {string} response - Raw AI response
 * @param {Object} facts - Product facts for fallback
 * @param {Array} allergies - User allergies
 * @returns {Object} Parsed verdict
 */
function parseVerdictResponse(response, facts, allergies) {
  let verdict;

  try {
    // Try to parse JSON response
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

  // Validate and sanitize verdict
  verdict = validateVerdict(verdict, facts, allergies);

  // Add allergen alert if needed
  if (facts.allergen_warnings.length > 0) {
    verdict.allergen_alert = true;
    if (!verdict.caveat.includes('allergen')) {
      verdict.caveat = `Contains potential allergens: ${facts.allergen_warnings.join(', ')}. ${verdict.caveat}`;
    }
  }

  return verdict;
}

/**
 * Validate and sanitize verdict object
 * @param {Object} verdict - Parsed verdict
 * @param {Object} facts - Product facts
 * @param {Array} allergies - User allergies
 * @returns {Object} Validated verdict
 */
function validateVerdict(verdict, facts, allergies) {
  // Ensure required fields exist
  const sanitized = {
    verdict: ['helpful', 'mixed', 'not_ideal'].includes(verdict.verdict) ? verdict.verdict : 'mixed',
    bullets: Array.isArray(verdict.bullets) ? verdict.bullets.slice(0, 3) : ['Analysis available'],
    caveat: typeof verdict.caveat === 'string' ? verdict.caveat : 'Please verify product details',
    allergen_alert: false
  };

  // Ensure we have 2-3 bullets
  while (sanitized.bullets.length < 2) {
    sanitized.bullets.push('Additional analysis available');
  }

  // Truncate bullets if too long
  sanitized.bullets = sanitized.bullets.map(bullet =>
    bullet.length > 80 ? bullet.substring(0, 77) + '...' : bullet
  );

  // Truncate caveat if too long
  if (sanitized.caveat.length > 100) {
    sanitized.caveat = sanitized.caveat.substring(0, 97) + '...';
  }

  // Override verdict if allergens detected
  if (facts.allergen_warnings.length > 0) {
    const userAllergens = facts.allergen_warnings.filter(a => allergies.includes(a));
    if (userAllergens.length > 0) {
      sanitized.verdict = 'not_ideal';
      sanitized.allergen_alert = true;
    }
  }

  return sanitized;
}

/**
 * Create fallback verdict when AI fails
 * @param {Object} facts - Product facts
 * @param {Array} allergies - User allergies
 * @returns {Object} Fallback verdict
 */
export function createFallbackVerdict(facts, allergies = []) {
  console.log('Shop Well: Creating fallback verdict (no AI)');

  let verdict = 'mixed';
  const bullets = [];
  let caveat = 'AI analysis unavailable. Please verify details manually.';

  // Basic logic for common scenarios
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

  // Ensure we have at least 2 bullets
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