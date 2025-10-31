# Shop Well Backend - Google Sheets API Integration

This serverless function collects opt-in user emails from the Shop Well Chrome extension and stores them in a Google Sheet.

## Architecture

- **Platform**: Google Cloud Functions (Node.js 18)
- **Storage**: Google Sheets
- **Authentication**: Service Account (automatic in Cloud Functions)
- **Cost**: Free tier (2M requests/month)

## Setup Instructions

### 1. Prerequisites

- Google Cloud account (free tier available)
- Google Cloud SDK installed: `gcloud` command
- A Google Sheet for data collection

### 2. Install Google Cloud SDK

```bash
# macOS
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

### 3. Create Google Cloud Project

```bash
# Authenticate with Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create shop-well-backend --name="Shop Well Backend"

# Set as active project
gcloud config set project shop-well-backend

# Enable required APIs
gcloud services enable sheets.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 4. Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet named "Shop Well User Emails"
3. Add headers to first row:
   - **A1**: Timestamp
   - **B1**: First Name
   - **C1**: Email
   - **D1**: Conditions
   - **E1**: Custom Conditions
   - **F1**: Allergies
   - **G1**: Custom Allergies
   - **H1**: User Agent
4. Copy the Spreadsheet ID from the URL:
   - URL: `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit`
   - Copy the `YOUR_SPREADSHEET_ID` part

### 5. Set Up Service Account

```bash
# Create service account
gcloud iam service-accounts create shop-well-sheets \
  --display-name="Shop Well Google Sheets Access"

# Get the service account email
gcloud iam service-accounts list

# The email will look like:
# shop-well-sheets@shop-well-backend.iam.gserviceaccount.com
```

**Share your Google Sheet with the service account:**
1. Open your Google Sheet
2. Click "Share" button
3. Paste the service account email
4. Give it "Editor" permissions
5. Click "Send"

### 6. Set Environment Variables

Create `.env.yaml` in the `backend/` directory:

```yaml
GOOGLE_SHEET_ID: "YOUR_SPREADSHEET_ID_HERE"
SHEET_NAME: "User Emails"
NODE_ENV: "production"
```

**⚠️ IMPORTANT**: Add `.env.yaml` to `.gitignore` to avoid committing sensitive data!

### 7. Deploy to Google Cloud Functions

```bash
# Navigate to backend directory
cd backend

# Deploy the function
gcloud functions deploy submitUserData \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --env-vars-file .env.yaml \
  --service-account shop-well-sheets@shop-well-backend.iam.gserviceaccount.com

# This will output a URL like:
# https://us-central1-shop-well-backend.cloudfunctions.net/submitUserData
```

### 8. Update Extension Code

Copy the Cloud Function URL from step 7 and update `welcome.js`:

```javascript
// Line 295 in src/welcome/welcome.js
const BACKEND_URL = 'https://us-central1-shop-well-backend.cloudfunctions.net/submitUserData';
```

Then uncomment the actual fetch code (lines 302-318) and remove the placeholder.

### 9. Test the Integration

```bash
# Test the endpoint manually
curl -X POST https://YOUR_FUNCTION_URL \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "email": "test@example.com",
    "conditions": ["POTS"],
    "customConditions": [],
    "allergies": ["peanuts"],
    "customAllergies": [],
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
  }'

# Expected response:
# {"success":true,"message":"Data saved successfully","timestamp":"..."}

# Check your Google Sheet - should see a new row!
```

### 10. Monitor Logs

```bash
# View function logs
gcloud functions logs read submitUserData --limit 50

# Stream logs in real-time
gcloud functions logs read submitUserData --limit 50 --follow
```

## Security Best Practices

1. **Tighten CORS**: Update line 17 in `index.js` to restrict to your extension ID:
   ```javascript
   res.set('Access-Control-Allow-Origin', 'chrome-extension://YOUR_EXTENSION_ID');
   ```

2. **Add Rate Limiting**: Implement rate limiting to prevent abuse (consider using Cloud Armor).

3. **Monitor Usage**: Set up alerts for unusual activity in Google Cloud Console.

4. **Regular Audits**: Periodically review your Google Sheet access permissions.

## Cost Estimates

**Google Cloud Functions Free Tier:**
- 2M invocations/month
- 400,000 GB-seconds of compute time
- 200,000 GHz-seconds of compute time
- 5GB network egress

**Typical Usage:**
- 1,000 new users/month = 1,000 function invocations
- Well within free tier limits
- **Estimated cost: $0.00/month**

## Troubleshooting

### Error: "Permission denied"
- Ensure the service account has Editor access to the Google Sheet
- Verify `sheets.googleapis.com` is enabled in your project

### Error: "Spreadsheet not found"
- Double-check the `GOOGLE_SHEET_ID` in `.env.yaml`
- Ensure the sheet is shared with the service account email

### Error: "Function not responding"
- Check logs: `gcloud functions logs read submitUserData`
- Verify the function is deployed: `gcloud functions list`

### Data not appearing in sheet
- Check the `SHEET_NAME` matches your sheet tab name (case-sensitive!)
- Verify column count matches expected format (8 columns)

## Alternative: Vercel Deployment

If you prefer Vercel over Google Cloud Functions:

1. Create `api/submit-user-data.js` in your project root
2. Use the same code structure but adapt for Vercel's serverless format
3. Add Google Sheets API credentials as environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

See [Vercel Serverless Functions docs](https://vercel.com/docs/functions) for details.

## Support

For issues or questions:
1. Check logs first: `gcloud functions logs read submitUserData`
2. Review Google Cloud Console for API errors
3. Verify all setup steps were completed correctly
