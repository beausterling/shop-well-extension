#!/bin/bash

# Helper script to update welcome.js with the deployed function URL

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

print_section "Update Extension with Function URL"

# Check if function URL exists
if [ -f ".function-url.txt" ]; then
    FUNCTION_URL=$(cat .function-url.txt)
    print_success "Found function URL: $FUNCTION_URL"
else
    print_warning "Function URL not found in .function-url.txt"
    read -p "Enter your Cloud Function URL: " FUNCTION_URL
fi

# Path to welcome.js
WELCOME_JS="../src/welcome/welcome.js"

if [ ! -f "$WELCOME_JS" ]; then
    print_error "Could not find $WELCOME_JS"
    exit 1
fi

print_info "Updating $WELCOME_JS..."

# Create backup
cp "$WELCOME_JS" "${WELCOME_JS}.backup"
print_success "Created backup: ${WELCOME_JS}.backup"

# Update BACKEND_URL
if grep -q "const BACKEND_URL = 'YOUR_BACKEND_ENDPOINT_URL_HERE';" "$WELCOME_JS"; then
    sed -i.tmp "s|const BACKEND_URL = 'YOUR_BACKEND_ENDPOINT_URL_HERE';|const BACKEND_URL = '$FUNCTION_URL';|g" "$WELCOME_JS"
    rm "${WELCOME_JS}.tmp" 2>/dev/null || true
    print_success "Updated BACKEND_URL"
else
    print_warning "BACKEND_URL already appears to be updated"
fi

# Check if fetch code needs to be uncommented
if grep -q "/\*" "$WELCOME_JS" && grep -q "const response = await fetch(BACKEND_URL" "$WELCOME_JS"; then
    print_info "Fetch code still commented - you'll need to uncomment it manually"
    print_info "Edit $WELCOME_JS and:"
    echo "  1. Remove /* on line ~302"
    echo "  2. Remove */ on line ~318"
    echo "  3. Delete lines 320-326 (placeholder code)"
else
    print_success "Fetch code appears to be uncommented"
fi

echo ""
print_section "Next Steps"
echo ""
print_info "1. Review the changes in $WELCOME_JS"
echo ""
print_info "2. Manually uncomment the fetch code if needed (lines 302-318)"
echo ""
print_info "3. Delete the placeholder simulation code (lines 320-326)"
echo ""
print_info "4. Rebuild the extension:"
echo "   cd .."
echo "   npm run build"
echo ""
print_info "5. Test with: ./test-endpoint.sh"
echo ""

# Show the updated line
print_section "Updated Configuration"
grep "const BACKEND_URL" "$WELCOME_JS" || echo "Could not find BACKEND_URL line"

print_success "Update complete!"
echo ""
print_info "Backup saved at: ${WELCOME_JS}.backup"
