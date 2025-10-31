#!/bin/bash

# Shop Well Backend Deployment Script
# This script guides you through deploying the Google Cloud Function

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_section() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n${BLUE}$1${NC}\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }

# Function to prompt user for confirmation
confirm() {
    read -p "$(echo -e ${YELLOW}$1 [y/N]: ${NC})" -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Function to prompt for input with default
prompt_input() {
    local prompt="$1"
    local default="$2"
    local result

    if [ -n "$default" ]; then
        read -p "$(echo -e ${BLUE}$prompt [default: $default]: ${NC})" result
        echo "${result:-$default}"
    else
        read -p "$(echo -e ${BLUE}$prompt: ${NC})" result
        echo "$result"
    fi
}

print_section "Shop Well Backend Deployment Script"

print_info "This script will guide you through deploying the Google Cloud Function for email collection."
echo ""

# Step 1: Check prerequisites
print_section "Step 1: Checking Prerequisites"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud SDK (gcloud) is not installed"
    echo ""
    print_info "Install it with:"
    echo "  macOS: brew install google-cloud-sdk"
    echo "  Or visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
print_success "Google Cloud SDK is installed"

# Check gcloud version
GCLOUD_VERSION=$(gcloud --version | head -n 1)
print_info "Version: $GCLOUD_VERSION"

# Check if authenticated
AUTH_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
if [ -z "$AUTH_ACCOUNT" ]; then
    print_warning "Not authenticated with Google Cloud"
    if confirm "Would you like to authenticate now?"; then
        gcloud auth login
        AUTH_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    else
        print_error "Authentication required to continue"
        exit 1
    fi
fi
print_success "Authenticated as: $AUTH_ACCOUNT"

echo ""
if ! confirm "Prerequisites check complete. Continue with deployment?"; then
    print_info "Deployment cancelled"
    exit 0
fi

# Step 2: Project setup
print_section "Step 2: Google Cloud Project Setup"

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -n "$CURRENT_PROJECT" ]; then
    print_info "Current project: $CURRENT_PROJECT"
    if confirm "Use this project?"; then
        PROJECT_ID="$CURRENT_PROJECT"
    else
        PROJECT_ID=$(prompt_input "Enter project ID")
    fi
else
    print_info "No active project set"
    PROJECT_ID=$(prompt_input "Enter project ID (will be created if doesn't exist)" "shop-well-backend")
fi

# Check if project exists
if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
    print_success "Project '$PROJECT_ID' exists"
else
    print_warning "Project '$PROJECT_ID' does not exist"
    if confirm "Create this project?"; then
        gcloud projects create "$PROJECT_ID" --name="Shop Well Backend"
        print_success "Project created"
    else
        print_error "Project required to continue"
        exit 1
    fi
fi

# Set active project
gcloud config set project "$PROJECT_ID"
print_success "Active project set to: $PROJECT_ID"

# Step 3: Enable required APIs
print_section "Step 3: Enabling Required APIs"

print_info "Enabling Google Sheets API..."
gcloud services enable sheets.googleapis.com --quiet
print_success "Google Sheets API enabled"

print_info "Enabling Cloud Functions API..."
gcloud services enable cloudfunctions.googleapis.com --quiet
print_success "Cloud Functions API enabled"

print_info "Enabling Cloud Build API..."
gcloud services enable cloudbuild.googleapis.com --quiet
print_success "Cloud Build API enabled"

# Step 4: Service account setup
print_section "Step 4: Service Account Setup"

SERVICE_ACCOUNT_NAME="shop-well-sheets"
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

if gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" &>/dev/null; then
    print_success "Service account already exists: $SERVICE_ACCOUNT_EMAIL"
else
    print_info "Creating service account..."
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --display-name="Shop Well Google Sheets Access"
    print_success "Service account created: $SERVICE_ACCOUNT_EMAIL"
fi

echo ""
print_warning "IMPORTANT: You must share your Google Sheet with this service account!"
echo ""
print_info "Service Account Email: $SERVICE_ACCOUNT_EMAIL"
echo ""
print_info "Steps to share:"
echo "  1. Open your Google Sheet"
echo "  2. Click 'Share' button (top right)"
echo "  3. Paste the service account email above"
echo "  4. Set permission to 'Editor'"
echo "  5. Click 'Send'"
echo ""
if ! confirm "Have you shared the Google Sheet with the service account?"; then
    print_warning "Please share the sheet before continuing"
    print_info "Service Account Email (copy this): $SERVICE_ACCOUNT_EMAIL"
    echo ""
    read -p "Press Enter when done..."
fi

# Step 5: Environment configuration
print_section "Step 5: Environment Configuration"

if [ ! -f ".env.yaml" ]; then
    if [ -f ".env.yaml.example" ]; then
        print_info "Creating .env.yaml from template..."
        cp .env.yaml.example .env.yaml
    else
        print_info "Creating .env.yaml..."
        cat > .env.yaml <<EOF
GOOGLE_SHEET_ID: ""
SHEET_NAME: "User Emails"
NODE_ENV: "production"
EOF
    fi
    print_success ".env.yaml created"
fi

print_info "Configuring environment variables..."
echo ""

# Get spreadsheet ID
print_info "Find your Spreadsheet ID in the Google Sheets URL:"
print_info "https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit"
SPREADSHEET_ID=$(prompt_input "Enter Google Spreadsheet ID")

# Get sheet name
SHEET_NAME=$(prompt_input "Enter sheet tab name" "User Emails")

# Update .env.yaml
cat > .env.yaml <<EOF
GOOGLE_SHEET_ID: "$SPREADSHEET_ID"
SHEET_NAME: "$SHEET_NAME"
NODE_ENV: "production"
EOF

print_success "Environment configuration saved to .env.yaml"

# Step 6: Deploy function
print_section "Step 6: Deploying Cloud Function"

print_info "Region: us-central1 (recommended for lowest latency)"
REGION=$(prompt_input "Enter region" "us-central1")

print_warning "This step may take 2-3 minutes..."
echo ""

if gcloud functions deploy submitUserData \
    --gen2 \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --region "$REGION" \
    --env-vars-file .env.yaml \
    --service-account "$SERVICE_ACCOUNT_EMAIL" \
    --entry-point submitUserData \
    --quiet; then

    print_success "Function deployed successfully!"

    # Get function URL
    FUNCTION_URL=$(gcloud functions describe submitUserData --region "$REGION" --gen2 --format="value(serviceConfig.uri)")

    echo ""
    print_section "Deployment Complete! 🎉"
    echo ""
    print_success "Your Cloud Function is live at:"
    echo ""
    echo "  $FUNCTION_URL"
    echo ""
    print_info "Next steps:"
    echo "  1. Update src/welcome/welcome.js line 295:"
    echo "     const BACKEND_URL = '$FUNCTION_URL';"
    echo ""
    echo "  2. Uncomment lines 302-318 in src/welcome/welcome.js"
    echo ""
    echo "  3. Remove placeholder code (lines 320-326)"
    echo ""
    echo "  4. Rebuild extension: npm run build"
    echo ""
    echo "  5. Test with: ./test-endpoint.sh"
    echo ""

    # Save URL to file for easy access
    echo "$FUNCTION_URL" > .function-url.txt
    print_success "Function URL saved to .function-url.txt"

else
    print_error "Deployment failed"
    echo ""
    print_info "Common issues:"
    echo "  - Billing not enabled on project"
    echo "  - APIs not fully enabled (wait a minute and retry)"
    echo "  - Service account permissions issue"
    echo ""
    print_info "Check logs with: gcloud functions logs read submitUserData --region $REGION"
    exit 1
fi

print_section "Deployment Summary"
echo "Project ID: $PROJECT_ID"
echo "Function Name: submitUserData"
echo "Region: $REGION"
echo "Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "Function URL: $FUNCTION_URL"
echo ""
print_success "All done! 🚀"
