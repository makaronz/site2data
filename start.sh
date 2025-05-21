#!/bin/bash

# Kolory dla lepszej czytelności
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}Uruchamianie aplikacji Site2Data${NC}"
echo -e "${BLUE}===========================================${NC}"

# Wczytaj zmienne środowiskowe z pliku .env.ports
if [ -f .env.ports ]; then
  echo -e "${GREEN}Wczytuję konfigurację z pliku .env.ports${NC}"
  export $(grep -v '^#' .env.ports | xargs)
else
  echo -e "${BLUE}Plik .env.ports nie istnieje, używam domyślnych ustawień${NC}"
fi

# Definiowanie stałych portów dla aplikacji
BACKEND_PORT=${PORT:-3001}
FRONTEND_PORT=${VITE_PORT:-5173}
BACKEND_URL=${API_URL:-http://localhost:$BACKEND_PORT}

echo -e "${GREEN}Ustawienia portów:${NC}"
echo -e "${GREEN}- Backend: $BACKEND_PORT${NC}"
echo -e "${GREEN}- Frontend: $FRONTEND_PORT${NC}"
echo -e "${GREEN}- Backend URL: $BACKEND_URL${NC}"

# Sprawdzenie czy porty są wolne i zakończenie procesów jeśli zajęte
check_and_kill_port() {
    local port=$1
    local name=$2
    
    # Sprawdź czy port jest używany
    if lsof -i:$port > /dev/null; then
        echo -e "${RED}Port $port używany przez $name jest zajęty. Próba zwolnienia...${NC}"
        lsof -ti:$port | xargs kill -9
        sleep 1
        if lsof -i:$port > /dev/null; then
            echo -e "${RED}Nie można zwolnić portu $port. Zakończ proces ręcznie.${NC}"
            exit 1
        else
            echo -e "${GREEN}Port $port został zwolniony.${NC}"
        fi
    else
        echo -e "${GREEN}Port $port jest dostępny dla $name.${NC}"
    fi
}

# Sprawdź czy wymagane porty są dostępne
check_and_kill_port $BACKEND_PORT "backend"
check_and_kill_port $FRONTEND_PORT "frontend"

# Eksport zmiennych środowiskowych do konfiguracji portów
export PORT=$BACKEND_PORT
export VITE_PORT=$FRONTEND_PORT
export API_URL=$BACKEND_URL

echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}Uruchamianie backendu na porcie $BACKEND_PORT...${NC}"

# Uruchomienie backendu w tle
cd backend
npm run start &
BACKEND_PID=$!

# Czekaj chwilę na uruchomienie backendu
sleep 3

echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}Uruchamianie frontendu na porcie $FRONTEND_PORT...${NC}"

# Uruchomienie frontendu
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}Aplikacja została uruchomiona:${NC}"
echo -e "${GREEN}- Backend: $BACKEND_URL${NC}"
echo -e "${GREEN}- Frontend: http://localhost:$FRONTEND_PORT${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}Naciśnij Ctrl+C, aby zatrzymać wszystkie procesy${NC}"

# Obsługa zatrzymania skryptu (Ctrl+C)
trap "echo -e '${RED}Zatrzymywanie aplikacji...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Czekaj na procesy
wait
