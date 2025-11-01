#!/bin/bash

# Shop Well Backend Test Script
# Tests the deployed Cloud Function endpoint

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_section() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n${BLUE}$1${NC}\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }

print_section "Testing Shop Well Backend Endpoint"

# Check if function URL exists
if [ -f ".function-url.txt" ]; then
    FUNCTION_URL=$(cat .function-url.txt)
    print_success "Found function URL: $FUNCTION_URL"
else
    print_warning "Function URL not found in .function-url.txt"
    read -p "Enter your Cloud Function URL: " FUNCTION_URL
fi

echo ""
print_info "This will send test data to your Google Sheet"
echo ""

# Get test data
read -p "Enter test first name [default: Test User]: " TEST_NAME
TEST_NAME=${TEST_NAME:-"Test User"}

read -p "Enter test email [default: test@example.com]: " TEST_EMAIL
TEST_EMAIL=${TEST_EMAIL:-"test@example.com"}

# Create test payload
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

PAYLOAD=$(cat <<EOF
{
  "firstName": "$TEST_NAME",
  "email": "$TEST_EMAIL",
  "conditions": ["POTS", "ME/CFS"],
  "customConditions": ["Fibromyalgia"],
  "allergies": ["peanuts", "milk"],
  "customAllergies": ["coconut"],
  "timestamp": "$TIMESTAMP"
}
EOF
)

print_section "Test Payload"
echo "$PAYLOAD" | python3 -m json.tool 2>/dev/null || echo "$PAYLOAD"

echo ""
read -p "Send this test request? [y/N]: " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Test cancelled"
    exit 0
fi

print_section "Sending Request"

# Send request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo ""
if [ "$HTTP_CODE" -eq 200 ]; then
    print_success "Request successful! (HTTP $HTTP_CODE)"
    echo ""
    print_info "Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    print_success "Check your Google Sheet for the new row!"
    echo ""
    print_info "Expected data in sheet:"
    echo "  Timestamp: $TIMESTAMP"
    echo "  First Name: $TEST_NAME"
    echo "  Email: $TEST_EMAIL"
    echo "  Conditions: POTS, ME/CFS"
    echo "  Custom Conditions: Fibromyalgia"
    echo "  Allergies: peanuts, milk"
    echo "  Custom Allergies: coconut"
else
    print_error "Request failed! (HTTP $HTTP_CODE)"
    echo ""
    print_info "Response:"
    echo "$BODY"
    echo ""
    print_info "Common issues:"
    echo "  - 400: Invalid request data"
    echo "  - 403: Function not accessible"
    echo "  - 500: Server error (check function logs)"
    echo ""
    print_info "Check logs with:"
    echo "  gcloud functions logs read submitUserData --limit 50"
    exit 1
fi

print_section "Test Complete"
