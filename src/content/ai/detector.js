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
    // Check if window.ai exists
    if (!window.ai) {
      result.error = 'Chrome Built-in AI not available. Please enable the Chrome AI flags and restart Chrome completely (Cmd+Q on Mac). Chrome may need a few minutes to download AI models after restart.';
      return result;
    }

    result.available = true;

    // Check Summarizer API
    if (window.ai.summarizer) {
      try {
        const summarizerCapabilities = await window.ai.summarizer.capabilities();
        result.summarizer = summarizerCapabilities.available === 'readily';
        result.details.summarizer = summarizerCapabilities;
      } catch (error) {
        console.warn('Shop Well: Summarizer capabilities check failed:', error);
        result.details.summarizerError = error.message;
      }
    }

    // Check Prompt API (Language Model)
    if (window.ai.languageModel) {
      try {
        const promptCapabilities = await window.ai.languageModel.capabilities();
        result.prompt = promptCapabilities.available === 'readily';
        result.details.prompt = promptCapabilities;
      } catch (error) {
        console.warn('Shop Well: Prompt API capabilities check failed:', error);
        result.details.promptError = error.message;
      }
    }

    // Overall assessment
    if (!result.summarizer && !result.prompt) {
      result.error = 'Chrome AI APIs are not ready. Please ensure all three flags are enabled and restart Chrome completely. Wait 2-3 minutes after restart for models to download.';
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
      'Sufficient device memory (4GB+ recommended)',
      'Stable internet connection for initial AI model download'
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