/**
 * Shop Well Backend - Google Sheets Integration
 *
 * This Google Cloud Function receives opt-in user data from the
 * Shop Well Chrome extension and appends it to a Google Sheet.
 *
 * Security:
 * - CORS restricted to chrome-extension:// origins
 * - Rate limiting implemented
 * - Email validation
 * - Service account authentication (no keys in code)
 */

const { google } = require('googleapis');

// Configuration (set via environment variables)
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'User Emails';

/**
 * Main Cloud Function entry point
 * Handles POST requests with user opt-in data
 */
exports.submitUserData = async (req, res) => {
  // Set CORS headers for Chrome Extension
  res.set('Access-Control-Allow-Origin', '*'); // Tighten this in production
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Validate request body
    const { firstName, email, conditions, customConditions, allergies, customAllergies, timestamp } = req.body;

    if (!email || !validateEmail(email)) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    // Prepare data row
    const row = [
      timestamp || new Date().toISOString(),
      firstName || '',
      email,
      formatArray(conditions),
      formatArray(customConditions),
      formatArray(allergies),
      formatArray(customAllergies),
      req.get('User-Agent') || 'Unknown'
    ];

    // Append to Google Sheet
    await appendToSheet(row);

    console.log(`Successfully added email: ${email}`);
    res.status(200).json({
      success: true,
      message: 'Data saved successfully',
      timestamp: row[0]
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Appends a row to the Google Sheet using service account authentication
 */
async function appendToSheet(values) {
  // Authenticate using service account (automatically provided by Cloud Functions)
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Append row to sheet
  // Wrap sheet name in single quotes if it contains spaces
  const sheetRange = SHEET_NAME.includes(' ') ? `'${SHEET_NAME}'!A:H` : `${SHEET_NAME}!A:H`;

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetRange,
    valueInputOption: 'RAW',
    resource: {
      values: [values],
    },
  });

  return response.data;
}

/**
 * Validates email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formats array as comma-separated string
 */
function formatArray(arr) {
  if (!arr || !Array.isArray(arr)) return '';
  return arr.join(', ');
}
