#!/bin/bash

BASE_URL="${1:-http://localhost:3000}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 RemitChain Endpoint Testing"
echo "=============================="
echo "Testing against: $BASE_URL"
echo ""

PASS=0
FAIL=0

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4

    echo -n "Testing $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "$body"
        FAIL=$((FAIL + 1))
    fi
    echo ""
}

echo "1. Health Check"
test_endpoint "Health" "GET" "/api/health"

echo "2. Exchange Rates (Config)"
test_endpoint "Rates Config" "GET" "/api/rates"

echo "3. Live Exchange Rates"
test_endpoint "Rates Live" "GET" "/api/rates/live"

echo "4. Quote Generation (100 USDC)"
test_endpoint "Quote 100 USDC" "POST" "/api/remit/quote" \
    '{"amountUSDC": 100, "toCountry": "India"}'

echo "5. Quote with Live Rates"
test_endpoint "Quote Live" "POST" "/api/remit/quote" \
    '{"amountUSDC": 50, "toCountry": "India", "useLiveRate": true}'

echo "6. Large Quote (500 USDC)"
test_endpoint "Large Quote" "POST" "/api/remit/quote" \
    '{"amountUSDC": 500, "toCountry": "India"}'

echo "7. Error Handling (Invalid Input)"
echo -n "Testing Error Handling... "
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"amountUSDC": -10}' \
    "$BASE_URL/api/remit/quote")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" -ge 400 ] && [ "$http_code" -lt 500 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Error handling works)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Should return 4xx error)"
    FAIL=$((FAIL + 1))
fi
echo ""

echo "=============================="
echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo "=============================="

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed${NC}"
    exit 1
fi
