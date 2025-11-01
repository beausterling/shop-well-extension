# Shop Well Privacy Policy

**Last Updated:** January 2025

**Version:** 1.0

---

## Our Privacy Commitment

Shop Well is designed with your privacy as a top priority. We believe that your health information is deeply personal and should remain under your control at all times.

### Core Privacy Principles

1. **Local-First Architecture**: All product analysis, wellness recommendations, and your personal health data are stored **locally on your device** by default.

2. **Zero Tracking**: We do not track your browsing behavior, shopping habits, or the products you analyze.

3. **No External AI Services**: All AI-powered analysis happens **on your device** using Chrome's Built-in AI (Gemini Nano). Your product data never leaves your computer.

4. **Optional Data Sharing**: Email sharing is **entirely optional** and requires explicit opt-in consent.

---

## What Data We Collect

### Data Stored Locally (Always)

The following information is stored **exclusively on your device** using Chrome's `storage.local` API and never leaves your computer:

- **First Name** (optional)
- **Email Address**
- **Health Conditions** (standard and custom)
- **Allergies/Sensitivities** (standard and custom)
- **Onboarding Completion Status**
- **Setup Date**
- **Language Preference**
- **Extension Settings** (auto-show preference, etc.)

### Data Shared with Shop Well (Opt-In Only)

If you **explicitly check the opt-in box** during onboarding or in settings, we collect:

- **First Name** (if provided)
- **Email Address**
- **Selected Health Conditions**
- **Selected Allergies/Sensitivities**
- **Timestamp of opt-in**
- **Browser User Agent** (for compatibility tracking only)

This data is sent to our secure backend (Google Cloud Functions) and stored in a private Google Sheet accessible only to Shop Well developers.

---

## How We Use Your Data

### Local Data (Stored on Your Device)

- **Product Analysis**: Your health conditions and allergens are used to provide personalized wellness recommendations when analyzing products.
- **UI Personalization**: Your first name is used to personalize insights (e.g., "For Sarah with POTS").
- **Settings Persistence**: Your preferences are saved so you don't have to re-enter them each time.

### Opt-In Data (Shared with Shop Well)

If you opt in to share your email, we use it to:

1. **Send Product Alerts**: Notify you of product recalls or safety issues related to your health conditions (future feature).
2. **Extension Updates**: Inform you about new features, condition-specific improvements, or important changes.
3. **Wellness Tips**: Provide personalized health and shopping tips (optional, can unsubscribe anytime).
4. **Research & Development**: Understand which conditions our users manage to prioritize feature development.

**We will NEVER:**
- Sell your data to third parties
- Share your email with advertisers
- Send spam or promotional content unrelated to Shop Well
- Use your data for purposes beyond those listed above

---

## Data Retention

### Local Data

- **Retention Period**: Indefinitely, until you manually clear it or uninstall the extension.
- **Deletion**: Clearing your Chrome extension data or uninstalling Shop Well permanently deletes all local data.

### Opt-In Data

- **Retention Period**: Until you request deletion or unsubscribe from communications.
- **Deletion Rights**: You can request immediate deletion of your opt-in data at any time by emailing us (contact info below).

---

## Data Security

### Technical Safeguards

1. **Local Storage Encryption**: Chrome's `storage.local` is isolated per-extension and protected by Chrome's security model.
2. **HTTPS Only**: All communication with our backend uses HTTPS encryption.
3. **Service Account Authentication**: Our backend uses Google service account credentials (not keys in code).
4. **No Third-Party Analytics**: We do not use Google Analytics, Facebook Pixel, or any third-party tracking tools.
5. **Minimal Permissions**: Shop Well only requests Chrome permissions necessary for core functionality:
   - `storage`: Save your settings locally
   - `scripting` + `activeTab`: Extract product data from Amazon/Walmart pages
   - `sidePanel`: Display analysis UI
   - `tabs`: Manage side panel context

### Data Breach Protocol

In the unlikely event of a data breach affecting opt-in user data:
1. We will notify affected users via email within 72 hours.
2. We will detail what data was potentially compromised.
3. We will provide steps to protect yourself and options for account deletion.

---

## Your Privacy Rights

You have the following rights regarding your data:

### 1. **Right to Access**
Request a copy of any opt-in data we have stored about you.

### 2. **Right to Rectification**
Update incorrect or outdated information in your profile.

### 3. **Right to Erasure ("Right to be Forgotten")**
Request immediate deletion of all opt-in data we have collected.

### 4. **Right to Withdraw Consent**
Opt out of email communications at any time by:
- Unchecking the opt-in box in extension settings
- Clicking "Unsubscribe" in any email we send
- Emailing us directly to request removal

### 5. **Right to Data Portability**
Request your opt-in data in a machine-readable format (JSON or CSV).

To exercise any of these rights, email us at: **info@vibecheckit.com**

---

## Third-Party Services

### Chrome Built-in AI (Gemini Nano)

- Shop Well uses Chrome's on-device AI for product analysis.
- **Data Processing**: All AI processing happens **locally on your device**. Product data is NOT sent to Google's servers.
- **Privacy**: Google does not receive your product data, health conditions, or analysis results.
- **Learn More**: [Chrome Built-in AI Privacy](https://developer.chrome.com/docs/ai/built-in-ai-privacy)

### Google Cloud Functions & Google Sheets

- **Used For**: Storing opt-in email data only (if you consent).
- **Data Shared**: First name, email, conditions, allergies (see "What Data We Collect" above).
- **Access**: Only Shop Well developers have access to the Google Sheet.
- **Google's Role**: Google Cloud acts as infrastructure provider (not data processor with access to contents).

### Amazon & Walmart

- **Data Extracted**: When you analyze a product, Shop Well reads product title, ingredients, features, and price from the webpage DOM.
- **No Communication**: Shop Well does NOT send requests to Amazon/Walmart servers or communicate with their APIs.
- **Your Privacy**: Amazon/Walmart are not aware that you're using Shop Well unless you explicitly purchase products through their websites.

---

## Changes to This Privacy Policy

We may update this Privacy Policy periodically to reflect:
- New features or functionality
- Changes in data practices
- Legal or regulatory requirements

**Notification Method:**
- Major changes will be announced via email (if you opted in)
- You will be prompted to review and accept the updated policy when opening the extension after an update
- The "Last Updated" date at the top of this policy will always reflect the most recent version

**Your Continued Use:**
Continuing to use Shop Well after policy updates indicates acceptance of the new terms. If you disagree, you may uninstall the extension and request data deletion.

---

## Children's Privacy

Shop Well is not intended for use by individuals under 13 years of age. We do not knowingly collect data from children. If you believe a child has provided us with personal information, please contact us immediately for deletion.

---

## International Users

Shop Well is designed for users worldwide. However, opt-in data is stored on Google Cloud servers in the United States (region: `us-central1`).

If you are located in the **European Union (EU)** or **European Economic Area (EEA)**, you have additional rights under GDPR:
- Right to object to processing
- Right to lodge a complaint with your local data protection authority
- Right to be informed about international data transfers

By opting in to share your email, you consent to the transfer of your data to the United States for processing and storage.

---

## California Privacy Rights (CCPA)

If you are a California resident, you have the right to:
1. Know what personal information is collected
2. Know whether your personal information is sold or disclosed (we do NOT sell or disclose)
3. Say no to the sale of personal information (not applicable - we don't sell data)
4. Access your personal information
5. Request deletion of your personal information

California users can exercise these rights by emailing: **info@vibecheckit.com**

---

## Contact Us

For questions, concerns, or requests regarding your privacy:

**Email:** info@vibecheckit.com

**Response Time:** We aim to respond to all privacy inquiries within 7 business days.

**Data Deletion Requests:** Processed within 30 days of receipt.

---

## Open Source & Transparency

Shop Well is committed to transparency. Our code is open source and available for review:

**GitHub Repository:** [github.com/beausterling/shop-well-extension](https://github.com/beausterling/shop-well-extension)

You can inspect the code to verify our privacy claims, including:
- Local-only data storage implementation (`src/welcome/welcome.js`, `src/options/options.js`)
- Opt-in backend integration (`src/welcome/welcome.js`, `backend/index.js`)
- Absence of third-party trackers or analytics

---

## Legal Basis for Processing (GDPR)

For EU/EEA users, our legal basis for processing your data is:

1. **Consent**: Opt-in email collection (GDPR Art. 6(1)(a))
2. **Legitimate Interest**: Local data storage for extension functionality (GDPR Art. 6(1)(f))
3. **Contract**: Providing the service you requested (analyzing products for your health conditions) (GDPR Art. 6(1)(b))

You may withdraw consent at any time without affecting the lawfulness of processing based on consent before withdrawal.

---

## Acknowledgment

By using Shop Well, you acknowledge that you have read, understood, and agree to this Privacy Policy.

**Last Updated:** January 2025

---

*This privacy policy was crafted with user trust and transparency as core values. If you have suggestions for improvement, please let us know.*
