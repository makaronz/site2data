#!/bin/bash

# Kolory dla lepszej czytelności
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}Site2Data - Status aplikacji${NC}"
echo -e "${BLUE}===========================================${NC}"

# Sprawdź procesy
echo -e "${YELLOW}Sprawdzanie procesów...${NC}"
BACKEND_PID=$(pgrep -f "upload-server.ts" 2>/dev/null)
FRONTEND_PID=$(pgrep -f "vite" 2>/dev/null | head -1)

if [ ! -z "$BACKEND_PID" ]; then
    echo -e "${GREEN}✅ Backend działa (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend nie działa${NC}"
fi

if [ ! -z "$FRONTEND_PID" ]; then
    echo -e "${GREEN}✅ Frontend działa (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend nie działa${NC}"
fi

# Sprawdź porty
echo -e "${YELLOW}Sprawdzanie portów...${NC}"
if lsof -i:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Port 3001 (backend) - zajęty${NC}"
else
    echo -e "${RED}❌ Port 3001 (backend) - wolny${NC}"
fi

if lsof -i:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Port 5173 (frontend) - zajęty${NC}"
else
    echo -e "${RED}❌ Port 5173 (frontend) - wolny${NC}"
fi

# Test połączenia z API
echo -e "${YELLOW}Testowanie API...${NC}"
API_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3001/api/health -o /dev/null 2>/dev/null)
if [ "$API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ API backend odpowiada poprawnie${NC}"
else
    echo -e "${RED}❌ API backend nie odpowiada (kod: $API_RESPONSE)${NC}"
fi

# Test połączenia z frontendem
echo -e "${YELLOW}Testowanie frontendu...${NC}"
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:5173 -o /dev/null 2>/dev/null)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend odpowiada poprawnie${NC}"
else
    echo -e "${RED}❌ Frontend nie odpowiada (kod: $FRONTEND_RESPONSE)${NC}"
fi

echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}URLs aplikacji:${NC}"
echo -e "${GREEN}- Backend API: http://localhost:3001${NC}"
echo -e "${GREEN}- Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}- Upload endpoint: http://localhost:3001/api/script/analyze${NC}"
echo -e "${BLUE}===========================================${NC}" 