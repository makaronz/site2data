#!/bin/bash

# Uruchom backend (Express) na porcie 5001
cd backend
if [ ! -d node_modules ]; then
  echo "Instaluję zależności backendu..."
  npm install --legacy-peer-deps
fi
npm run dev &
BACKEND_PID=$!
cd ..

# Uruchom frontend (Vite) na porcie 3001
cd frontend
if [ ! -d node_modules ]; then
  echo "Instaluję zależności frontendu..."
  npm install --legacy-peer-deps
fi
npm run dev &
FRONTEND_PID=$!
cd ..

# Trap do zamykania obu procesów po zakończeniu skryptu
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo "\nSerwery uruchomione:"
echo "- Backend:   http://localhost:5001/"
echo "- Frontend:  http://localhost:3001/"
echo "\nAby zakończyć oba serwery, naciśnij Ctrl+C."

# Czekaj na zakończenie obu procesów
wait $BACKEND_PID $FRONTEND_PID 