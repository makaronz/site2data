#!/bin/bash

# Kolory dla lepszej czytelności
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}Site2Data - Czyszczenie portów${NC}"
echo -e "${BLUE}===========================================${NC}"

# Funkcja do czyszczenia portów
cleanup_port() {
    local port=$1
    local name=$2
    
    echo -e "${BLUE}Sprawdzanie portu $port dla $name...${NC}"
    
    # Sprawdź czy port jest używany
    if lsof -i:$port > /dev/null 2>&1; then
        echo -e "${RED}Port $port jest zajęty. Czyszczenie...${NC}"
        
        # Zabij procesy używające port
        kill -9 $(lsof -ti:$port) 2>/dev/null || true
        
        # Sprawdź ponownie
        sleep 1
        if lsof -i:$port > /dev/null 2>&1; then
            echo -e "${RED}Nie można wyczyścić portu $port. Spróbuj ręcznie.${NC}"
            return 1
        else
            echo -e "${GREEN}Port $port został wyczyszczony.${NC}"
        fi
    else
        echo -e "${GREEN}Port $port jest wolny.${NC}"
    fi
    return 0
}

# Zabij procesy po nazwie
echo -e "${BLUE}Zabijanie procesów po nazwach...${NC}"
pkill -f "node.*upload-server" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Wyczyść porty
cleanup_port 3001 "backend"
cleanup_port 5173 "frontend"

echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}Porty zostały wyczyszczone. Możesz teraz uruchomić aplikację.${NC}"
echo -e "${GREEN}Użyj: npm run start${NC}"
echo -e "${BLUE}===========================================${NC}" 