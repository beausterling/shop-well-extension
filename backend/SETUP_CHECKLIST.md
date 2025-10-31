# Backend Deployment Checklist

Follow these steps in order to deploy your Shop Well backend.

## Prerequisites

- [ ] macOS/Linux/WSL environment with bash
- [ ] Google Cloud account created (free tier available)
- [ ] Chrome browser installed
- [ ] Terminal/command line access

## Phase 1: Preparation (5 minutes)

- [ ] **Install Google Cloud SDK**
  ```bash
  # macOS
  brew install google-cloud-sdk

  # Linux
  curl https://sdk.cloud.google.com | bash
  ```

- [ ] **Create Google Sheet**
  1. Go to https://sheets.google.com
  2. Create new spreadsheet: "Shop Well User Emails"
  3. Add headers in row 1:
     - A1: `Timestamp`
     - B1: `First Name`
     - C1: `Email`
     - D1: `Conditions`
     - E1: `Custom Conditions`
     - F1: `Allergies`
     - G1: `Custom Allergies`
     - H1: `User Agent`
  4. Copy Spreadsheet ID from URL (between `/d/` and `/edit`)

## Phase 2: Automated Deployment (5-10 minutes)

- [ ] **Navigate to backend directory**
  ```bash
  cd backend
  ```

- [ ] **Make deployment script executable**
  ```bash
  chmod +x deploy.sh
  chmod +x test-endpoint.sh
  ```

- [ ] **Run deployment script**
  ```bash
  ./deploy.sh
  ```

  The script will:
  - Check if gcloud is installed
  - Authenticate you with Google Cloud
  - Create/configure your project
  - Enable required APIs
  - Create service account
  - Configure environment
  - Deploy the Cloud Function

- [ ] **Copy service account email** (shown during deployment)
  Format: `shop-well-sheets@PROJECT_ID.iam.gserviceaccount.com`

- [ ] **Share Google Sheet with service account**
  1. Open your Google Sheet
  2. Click "Share" button
  3. Paste service account email
  4. Set permission to "Editor"
  5. Click "Send"

- [ ] **Wait for deployment to complete** (2-3 minutes)

- [ ] **Copy Function URL** (displayed at end of deployment)
  Also saved in `backend/.function-url.txt`

## Phase 3: Extension Integration (2 minutes)

- [ ] **Update welcome.js with Function URL**
  ```bash
  # Option 1: Manual update
  # Edit src/welcome/welcome.js line 295
  # Replace: const BACKEND_URL = 'YOUR_BACKEND_ENDPOINT_URL_HERE';
  # With: const BACKEND_URL = 'YOUR_ACTUAL_FUNCTION_URL';

  # Option 2: Use helper script
  ./update-extension.sh
  ```

- [ ] **Uncomment fetch code in welcome.js**
  - Remove comment markers `/*` and `*/` from lines 302-318
  - Delete placeholder code (lines 320-326)

- [ ] **Rebuild extension**
  ```bash
  cd ..  # Return to project root
  npm run build
  ```

## Phase 4: Testing (5 minutes)

- [ ] **Test backend endpoint**
  ```bash
  cd backend
  ./test-endpoint.sh
  ```

- [ ] **Verify test data in Google Sheet**
  - Open your Google Sheet
  - Check for new row with test data
  - Verify all columns populated correctly

- [ ] **Test from extension**
  1. Reload extension in Chrome (chrome://extensions)
  2. Open extension welcome page
  3. Complete onboarding with opt-in checked
  4. Use a real email address
  5. Check Google Sheet for new row

- [ ] **Verify console logs**
  - Open Chrome DevTools
  - Check console for "Successfully sent data to backend"
  - Should NOT see any errors

## Phase 5: Production Readiness (Optional)

- [ ] **Set up billing alerts** (in Google Cloud Console)
  - Recommended: Alert at $5, $10, $20

- [ ] **Tighten CORS** (in `backend/index.js`)
  - Replace line 17: `res.set('Access-Control-Allow-Origin', '*');`
  - With: `res.set('Access-Control-Allow-Origin', 'chrome-extension://YOUR_EXTENSION_ID');`

- [ ] **Set up monitoring**
  - Enable Cloud Monitoring in Google Cloud Console
  - Set up uptime checks
  - Configure error notifications

- [ ] **Create privacy email**
  - Set up: `privacy@yourdomain.com`
  - Update `PRIVACY.md` with real email

- [ ] **Commit changes** (but NOT .env.yaml!)
  ```bash
  git add backend/
  git add src/welcome/welcome.js
  git add PRIVACY.md
  git commit -m "Deploy backend for email collection"
  ```

## Troubleshooting

### Deployment fails with "billing not enabled"
- Go to Google Cloud Console
- Navigate to Billing
- Enable billing for your project (free tier available)

### Function deployed but getting 500 errors
- Check logs: `gcloud functions logs read submitUserData --limit 50`
- Verify service account has access to sheet
- Verify GOOGLE_SHEET_ID in .env.yaml is correct

### Data not appearing in sheet
- Verify sheet tab name matches SHEET_NAME in .env.yaml (case-sensitive!)
- Check column count (should be 8 columns A-H)
- Verify service account email has Editor permission

### "Permission denied" errors
- Ensure service account email is shared with sheet
- Wait 1-2 minutes after sharing (propagation time)
- Verify sheets.googleapis.com is enabled

## Success Criteria

✅ **Deployment successful when:**
- [ ] Function deployed without errors
- [ ] Test script sends data successfully
- [ ] Google Sheet receives test row
- [ ] Extension onboarding saves to sheet when opt-in checked
- [ ] No errors in browser console

## Support

- **Deployment Issues**: Review `backend/README.md`
- **Function Logs**: `gcloud functions logs read submitUserData`
- **Sheet Permissions**: Check service account access
- **Extension Issues**: Check browser console for errors

## Estimated Time

- **Total Time**: 15-20 minutes
- **Preparation**: 5 minutes
- **Deployment**: 5-10 minutes
- **Integration**: 2 minutes
- **Testing**: 5 minutes

## What's Next?

After successful deployment:
1. Test with real user data
2. Monitor Google Sheet for incoming emails
3. Set up email communication system
4. Create email templates for updates/alerts
5. Consider database migration if user count > 100k
