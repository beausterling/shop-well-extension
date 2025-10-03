// Language Detection Utility for Chrome Built-in AI

/**
 * Supported languages for AI analysis
 */
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'ja': 'Japanese',
  'fr': 'French',
  'de': 'German'
};

/**
 * Get the user's preferred language for AI analysis
 * Priority: User preference > Browser auto-detect > Default (English)
 * @returns {Promise<Object>} Language info with code and display name
 */
export async function getUserLanguage() {
  try {
    // Get user's language preference from storage
    const settings = await chrome.storage.local.get(['languagePreference']);
    const preference = settings.languagePreference || 'auto';

    let languageCode;

    if (preference === 'auto') {
      // Auto-detect from browser
      languageCode = detectBrowserLanguage();
    } else {
      // Use user's explicit preference
      languageCode = preference;
    }

    // Validate and return
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
    return {
      code: 'en',
      name: 'English',
      isAuto: false
    };
  }
}

/**
 * Detect language from browser settings
 * @returns {string} Language code (2-letter ISO 639-1)
 */
function detectBrowserLanguage() {
  // Get browser language (e.g., 'en-US', 'es-ES', 'ja')
  const browserLang = navigator.language || navigator.userLanguage || 'en';

  // Extract primary language code (e.g., 'en' from 'en-US')
  const primaryLang = browserLang.split('-')[0].toLowerCase();

  // Return if supported, otherwise default to English
  return SUPPORTED_LANGUAGES[primaryLang] ? primaryLang : 'en';
}

/**
 * Get language instruction for AI system prompt
 * @param {string} languageCode - The language code
 * @returns {string} Language instruction text
 */
export function getLanguageInstruction(languageCode) {
  const languageName = SUPPORTED_LANGUAGES[languageCode] || 'English';
  return `Your response must be in ${languageName}.`;
}

/**
 * Get all supported languages for UI display
 * @returns {Object} Language code to display name mapping
 */
export function getSupportedLanguages() {
  return { ...SUPPORTED_LANGUAGES };
}
