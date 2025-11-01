# 🚀 Backend Quick Start Guide

Get your Shop Well backend deployed in 15 minutes!

## TL;DR - One Command Deployment

```bash
cd backend
./deploy.sh
```

That's it! The script will guide you through everything.

---

## What You'll Need

1. **Google Cloud account** (free tier available)
   - Sign up at: https://cloud.google.com
   - No credit card required for free tier

2. **Google Sheet** with headers:
   ```
   Timestamp | First Name | Email | Conditions | Custom Conditions | Allergies | Custom Allergies | User Agent
   ```

3. **10-15 minutes** of your time

---

## Step-by-Step Process

### 1. Install Google Cloud SDK (One-time setup)

**macOS:**
```bash
brew install google-cloud-sdk
```

**Linux/WSL:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL  # Restart shell
```

**Verify installation:**
```bash
gcloud --version
```

### 2. Create Your Google Sheet

1. Go to https://sheets.google.com
2. Create new spreadsheet: **"Shop Well User Emails"**
3. Add these headers in row 1:
   - A1: `Timestamp`
   - B1: `First Name`
   - C1: `Email`
   - D1: `Conditions`
   - E1: `Custom Conditions`
   - F1: `Allergies`
   - G1: `Custom Allergies`
   - H1: `User Agent`
4. **Copy the Spreadsheet ID** from URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_THE_SPREADSHEET_ID/edit
   ```

### 3. Run the Deployment Script

```bash
cd backend
./deploy.sh
```

The script will:
- ✅ Authenticate you with Google Cloud
- ✅ Create/configure your project
- ✅ Enable required APIs (Sheets, Functions, Build)
- ✅ Create service account
- ✅ Deploy the Cloud Function
- ✅ Give you the Function URL

**Important:** When prompted, you'll need to:
- Share your Google Sheet with the service account email
- Provide your Spreadsheet ID

### 4. Update Extension Code

**Automatic (Recommended):**
```bash
./update-extension.sh
```

**Manual:**
1. Open `src/welcome/welcome.js`
2. Line 295: Replace `'YOUR_BACKEND_ENDPOINT_URL_HERE'` with your Function URL
3. Lines 302-318: Remove the `/*` and `*/` comment markers
4. Lines 320-326: Delete the placeholder code

### 5. Rebuild Extension

```bash
cd ..
npm run build
```

### 6. Test It!

```bash
cd backend
./test-endpoint.sh
```

Then check your Google Sheet - you should see a new row with test data!

---

## Verification Checklist

After deployment, verify:

- [ ] `deploy.sh` completed without errors
- [ ] Function URL saved in `.function-url.txt`
- [ ] Service account email shared with Google Sheet (Editor permission)
- [ ] `test-endpoint.sh` returns HTTP 200
- [ ] Test data appears in Google Sheet
- [ ] Extension rebuild completed: `npm run build`

---

## Common Issues & Fixes

### ❌ "gcloud: command not found"
**Fix:** Install Google Cloud SDK (see step 1)

### ❌ "Billing not enabled"
**Fix:**
1. Go to Google Cloud Console
2. Enable billing for your project
3. Free tier covers 2M requests/month (plenty!)

### ❌ "Permission denied" on sheets
**Fix:**
1. Copy service account email from deployment output
2. Share Google Sheet with that email
3. Set permission to "Editor"
4. Wait 1-2 minutes for propagation

### ❌ Test returns 500 error
**Fix:**
```bash
# Check function logs
gcloud functions logs read submitUserData --limit 50
```

Common causes:
- Wrong Spreadsheet ID in `.env.yaml`
- Sheet tab name doesn't match (case-sensitive!)
- Service account not shared with sheet

### ❌ Data not appearing in sheet
**Fix:**
- Verify SHEET_NAME in `.env.yaml` matches your tab name exactly
- Check you have 8 columns (A-H)
- Ensure service account has Editor permission

---

## What Gets Deployed?

```
Google Cloud Project: shop-well-backend (or your custom name)
├── Cloud Function: submitUserData
│   ├── Runtime: Node.js 18
│   ├── Trigger: HTTP
│   ├── Region: us-central1
│   └── Service Account: shop-well-sheets@PROJECT.iam.gserviceaccount.com
│
└── APIs Enabled:
    ├── Google Sheets API
    ├── Cloud Functions API
    └── Cloud Build API
```

**Data Flow:**
```
Extension → Cloud Function → Google Sheet
(opt-in)    (validates)      (stores)
```

---

## Cost Breakdown

**Free Tier (More than enough!):**
- 2M function invocations/month
- 400,000 GB-seconds compute
- 5GB network egress

**Your Usage:**
- 1,000 users/month = 1,000 invocations
- 10,000 users/month = 10,000 invocations
- 100,000 users/month = 100,000 invocations

**Monthly Cost: $0.00** (until you exceed 2M users/month!)

---

## Security Features

✅ **Privacy-First:** Local storage by default
✅ **Opt-In Only:** Backend submission requires explicit consent
✅ **HTTPS:** All communication encrypted
✅ **Service Account Auth:** No keys in code
✅ **Email Validation:** Server-side checks
✅ **Graceful Failures:** Backend errors don't block users

---

## Next Steps After Deployment

1. **Test with Real Data**
   - Complete extension onboarding
   - Check opt-in box
   - Verify data appears in sheet

2. **Monitor Your Sheet**
   - Watch for incoming user emails
   - Track opt-in rates

3. **Set Up Email System** (Optional)
   - SendGrid, Mailchimp, etc.
   - Create email templates
   - Send welcome emails to new users

4. **Tighten Security** (Recommended)
   - Update CORS to specific extension ID
   - Set up billing alerts
   - Enable Cloud Monitoring

5. **Scale** (When ready)
   - Database migration if > 100k users
   - Rate limiting implementation
   - Email verification flow

---

## Support

**Documentation:**
- Full guide: `README.md`
- Detailed checklist: `SETUP_CHECKLIST.md`
- Implementation details: `../IMPLEMENTATION_SUMMARY.md`

**Troubleshooting:**
```bash
# View function logs
gcloud functions logs read submitUserData --limit 50

# Check deployment status
gcloud functions describe submitUserData --region us-central1

# Test endpoint
./test-endpoint.sh
```

**Still stuck?** Check the troubleshooting section in `SETUP_CHECKLIST.md`

---

## Success!

Once you see this in your Google Sheet:
```
Timestamp              | First Name | Email             | Conditions      | ...
2025-01-15T10:30:00Z  | Test       | test@example.com  | POTS, ME/CFS   | ...
```

🎉 **You're live!** Your backend is collecting opt-in user emails!

---

**Estimated Time:** 15 minutes total
- Setup: 5 min
- Deployment: 5 min
- Testing: 5 min

Let's get started! Run `./deploy.sh` now 🚀
