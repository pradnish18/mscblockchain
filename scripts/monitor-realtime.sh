#!/bin/bash

BASE_URL="${1:-http://localhost:3000}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

while true; do
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     RemitChain Real-Time Monitor              ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Monitoring: $BASE_URL"
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    echo -e "${YELLOW}📊 Live Exchange Rate${NC}"
    rate_response=$(curl -s "$BASE_URL/api/rates/live")
    if [ $? -eq 0 ]; then
        rate=$(echo "$rate_response" | jq -r '.usdToInr // "N/A"' 2>/dev/null)
        spread=$(echo "$rate_response" | jq -r '.withSpread // "N/A"' 2>/dev/null)
        echo -e "  Base Rate: ${GREEN}₹$rate${NC}"
        echo -e "  With Spread: ${GREEN}₹$spread${NC}"
    else
        echo -e "  ${RED}Failed to fetch rate${NC}"
    fi
    echo ""

    echo -e "${YELLOW}🏥 System Health${NC}"
    health_response=$(curl -s "$BASE_URL/api/health")
    if [ $? -eq 0 ]; then
        status=$(echo "$health_response" | jq -r '.status // "unknown"' 2>/dev/null)
        db_status=$(echo "$health_response" | jq -r '.checks.database.status // "unknown"' 2>/dev/null)
        memory_used=$(echo "$health_response" | jq -r '.system.memory.used // 0' 2>/dev/null)
        memory_total=$(echo "$health_response" | jq -r '.system.memory.total // 0' 2>/dev/null)
        uptime=$(echo "$health_response" | jq -r '.system.uptime // 0' 2>/dev/null)

        if [ "$status" = "healthy" ]; then
            echo -e "  Status: ${GREEN}●${NC} Healthy"
        else
            echo -e "  Status: ${RED}●${NC} $status"
        fi

        echo -e "  Database: $db_status"
        echo -e "  Memory: ${memory_used}MB / ${memory_total}MB"
        echo -e "  Uptime: ${uptime}s"
    else
        echo -e "  ${RED}Failed to fetch health${NC}"
    fi
    echo ""

    echo -e "${YELLOW}🔍 Endpoint Status${NC}"
    endpoints=("/api/health" "/api/rates" "/api/rates/live")
    for endpoint in "${endpoints[@]}"; do
        status_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
        if [ "$status_code" = "200" ]; then
            echo -e "  ${GREEN}✓${NC} $endpoint"
        else
            echo -e "  ${RED}✗${NC} $endpoint (HTTP $status_code)"
        fi
    done
    echo ""

    echo -e "${BLUE}Press Ctrl+C to stop monitoring${NC}"
    echo "Refreshing in 5 seconds..."

    sleep 5
done
