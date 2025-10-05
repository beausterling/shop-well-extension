// Chrome Built-in AI Feature Detection

/**
 * Check if Chrome Built-in AI APIs are available
 * @returns {Promise<Object>} AI capability status
 */
export async function checkAIAvailability() {
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
        const availability = await LanguageModel.availability({ language: 'en' });
        result.prompt = availability === 'readily';
        result.details.prompt = { available: availability };
        result.available = true;
        console.log('Shop Well: LanguageModel found, availability:', availability);
      } catch (error) {
        console.warn('Shop Well: LanguageModel availability check failed:', error);
        result.details.promptError = error.message;
      }
    }

    // Check for Summarizer API - Official Chrome API
    if (typeof Summarizer !== 'undefined') {
      try {
        const availability = await Summarizer.availability({ language: 'en' });
        result.summarizer = availability === 'readily';
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
      result.error = 'Chrome Built-in AI not available. Please enable the Chrome AI flags and restart Chrome completely (Cmd+Q on Mac). Check chrome://on-device-internals for model download status.';
      return result;
    }

    // Overall assessment
    if (!result.summarizer && !result.prompt) {
      result.error = 'Chrome AI APIs are not ready. Please ensure all three flags are enabled and restart Chrome completely. Wait 2-3 minutes for models to download. Check chrome://on-device-internals for status.';
    } else if (!result.summarizer) {
      result.error = 'Summarizer API not available. Enable the summarization-api-for-gemini-nano flag and restart Chrome. Models may still be downloading.';
    } else if (!result.prompt) {
      result.error = 'Prompt API not available. Enable the prompt-api-for-gemini-nano flag and restart Chrome. Models may still be downloading.';
    }

  } catch (error) {
    result.error = `AI detection failed: ${error.message}`;
    console.error('Shop Well: AI detection error:', error);
  }

  return result;
}

/**
 * Get user-friendly status message for AI availability
 * @param {Object} availability - Result from checkAIAvailability
 * @returns {string} User-friendly status message
 */
export function getAIStatusMessage(availability) {
  if (!availability.available) {
    return 'Chrome Built-in AI not detected. Basic analysis will be used.';
  }

  if (availability.summarizer && availability.prompt) {
    return 'Chrome Built-in AI fully available. Enhanced analysis enabled.';
  }

  if (availability.summarizer) {
    return 'Chrome AI Summarizer available. Limited wellness analysis enabled.';
  }

  if (availability.prompt) {
    return 'Chrome AI Prompt available. Basic wellness analysis enabled.';
  }

  return 'Chrome AI detected but not ready. Using fallback analysis.';
}

/**
 * Check if we can perform AI-enhanced analysis
 * @param {Object} availability - Result from checkAIAvailability
 * @returns {boolean} Whether AI analysis is possible
 */
export function canUseAIAnalysis(availability) {
  return availability.available && (availability.summarizer || availability.prompt);
}

/**
 * Get Chrome AI setup instructions for users
 * @returns {Object} Setup instructions
 */
export function getSetupInstructions() {
  return {
    title: 'Enable Chrome Built-in AI',
    steps: [
      'Open Chrome and go to chrome://flags',
      'Search for and enable these flags:',
      '  • optimization-guide-on-device-model',
      '  • prompt-api-for-gemini-nano',
      '  • summarization-api-for-gemini-nano',
      'Restart Chrome',
      'Refresh this page and Shop Well will detect the AI features'
    ],
    requirements: [
      'Chrome version 128 or higher',
      '22 GB of free storage space for AI model download',
      'GPU with more than 4 GB VRAM',
      'Unmetered internet connection for model download',
      'Allow 2-3 minutes after restart for model download'
    ]
  };
}

/**
 * Log AI capabilities for debugging
 * @param {Object} availability - Result from checkAIAvailability
 */
export function logAICapabilities(availability) {
  console.log('Shop Well: Chrome AI Capabilities:', {
    available: availability.available,
    summarizer: availability.summarizer,
    prompt: availability.prompt,
    canUseAI: canUseAIAnalysis(availability),
    error: availability.error,
    details: availability.details
  });

  if (availability.error) {
    console.warn('Shop Well: AI Limitation:', availability.error);
  }

  if (availability.available) {
    console.log('Shop Well: ' + getAIStatusMessage(availability));
  }
}