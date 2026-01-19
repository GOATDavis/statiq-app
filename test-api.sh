#!/bin/bash

# StatIQ API Connection Test Script
# Tests connectivity to the FastAPI backend

API_BASE="http://192.168.1.197:8000"

echo "========================================="
echo "StatIQ API Connection Test"
echo "========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Ping server
echo "Test 1: Checking server connectivity..."
if ping -c 1 -W 2 192.168.1.197 &> /dev/null; then
    echo -e "${GREEN}✓${NC} Server is reachable"
else
    echo -e "${RED}✗${NC} Server is not reachable"
    exit 1
fi
echo ""

# Test 2: Check port 8000
echo "Test 2: Checking if port 8000 is open..."
if nc -z -w 2 192.168.1.197 8000 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Port 8000 is open"
else
    echo -e "${RED}✗${NC} Port 8000 is not accessible"
    echo "   Backend may not be running. Try:"
    echo "   ssh user@192.168.1.197 'sudo systemctl start statiq-backend'"
    exit 1
fi
echo ""

# Test 3: Test dashboard endpoint
echo "Test 3: Testing dashboard API endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/v1/dashboard")

if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Dashboard endpoint is responding (HTTP 200)"
    echo ""
    echo "Sample response:"
    curl -s "$API_BASE/api/v1/dashboard" | python3 -m json.tool 2>/dev/null | head -30
elif [ "$RESPONSE" = "404" ]; then
    echo -e "${RED}✗${NC} Dashboard endpoint not found (HTTP 404)"
    echo "   Check that your backend has the correct route: /api/v1/dashboard"
elif [ "$RESPONSE" = "000" ]; then
    echo -e "${RED}✗${NC} No response from server"
    echo "   Server may be down or unreachable"
else
    echo -e "${YELLOW}⚠${NC} Unexpected response (HTTP $RESPONSE)"
fi
echo ""

# Test 4: Check if JSON is valid
echo "Test 4: Validating JSON response..."
JSON_RESPONSE=$(curl -s "$API_BASE/api/v1/dashboard")
if echo "$JSON_RESPONSE" | python3 -m json.tool &>/dev/null; then
    echo -e "${GREEN}✓${NC} Valid JSON response"
else
    echo -e "${RED}✗${NC} Invalid JSON response"
    echo "Response:"
    echo "$JSON_RESPONSE"
fi
echo ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""
echo "API Base URL: $API_BASE"
echo "Dashboard Endpoint: $API_BASE/api/v1/dashboard"
echo ""

if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Your API is ready to use."
    echo "In /src/lib/coach-api.ts, set:"
    echo "  export const USE_MOCK_DATA = false;"
    echo ""
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Verify backend is running:"
    echo "   ssh user@192.168.1.197 'sudo systemctl status statiq-backend'"
    echo ""
    echo "2. Check backend logs:"
    echo "   ssh user@192.168.1.197 'sudo journalctl -u statiq-backend -n 50'"
    echo ""
    echo "3. Start backend if needed:"
    echo "   ssh user@192.168.1.197 'sudo systemctl start statiq-backend'"
    echo ""
fi
