# Testy Integracyjne i Jednostkowe dla Aplikacji Site2Data

## 1. Przegląd

W tym katalogu znajdują się testy integracyjne dla REST API oraz testy jednostkowe dla logiki WebSocket. Testy te sprawdzają poprawność działania kluczowych endpointów, walidację autoryzacji oraz obsługę timeoutów.

## 2. Struktura Testów

```
backend/tests/
├── integration/               # Testy integracyjne REST API
│   ├── apiTest.integration.test.ts    # Testy dla /api/test-openai
│   └── pdfRoutes.integration.test.ts  # Testy dla /api/upload-pdf
├── unit/                     # Testy jednostkowe
│   └── websocket.unit.test.ts  # Testy dla logiki WebSocket 
├── samples/                  # Próbki używane w testach
└── jest.setup.js             # Konfiguracja dla Jest
```

## 3. Testowane Komponenty

### 3.1. Endpointy REST API

- **Test OpenAI API** (`/api/test-openai`): Weryfikacja poprawności klucza API OpenAI.
- **Upload PDF API** (`/api/upload-pdf`): Przesyłanie i analiza plików PDF.

### 3.2. Logika WebSocket

- **Script Analysis WebSocket** (`/ws/script-analysis`): Komunikacja w czasie rzeczywistym dla analizy skryptów.

## 4. Jak Uruchomić Testy

```bash
# Uruchomienie wszystkich testów
npm test

# Uruchomienie testów z pokryciem kodu
npm test -- --coverage

# Uruchomienie konkretnego testu
npm test -- websocket.unit.test.ts
```

## 5. Rekomendacje Dotyczące Ulepszeń API

### 5.1. Autoryzacja

Obecnie autoryzacja jest zaimplementowana tylko częściowo w endpoints. Rekomendowane jest:

- Dodanie spójnego mechanizmu autoryzacji (np. JWT) do wszystkich endpointów.
- Dodanie middleware do walidacji tokenu.
- Implementacja odświeżania tokenu.

### 5.2. Obsługa Timeoutów

Długotrwałe operacje (np. przetwarzanie dużych plików PDF) mogą powodować timeouty. Rekomendacje:

- Dodać obsługę timeoutów po stronie serwera.
- Implementacja mechanizmu raportowania postępu (np. przez WebSocket).
- Asynchroniczne przetwarzanie dużych zadań z mechanizmem kolejkowania.

### 5.3. Walidacja Danych

- Dodać ścisłą walidację danych wejściowych (np. używając biblioteki Zod).
- Standardowa obsługa błędów z odpowiednimi kodami HTTP.

### 5.4. Logowanie

- Ujednolicone logowanie dla łatwiejszego debugowania.
- Monitoring wydajności i błędów.

## 6. Mapowanie Frontend-Backend

Dokument `frontend-mapping.md` zawiera analizę miejsc w kodzie frontendowym, gdzie wywoływane są endpointy backendowe. Służy to do:

- Identyfikacji punktów integracji.
- Weryfikacji spójności wywołań.
- Planowania zmian w API.

## 7. Znane Problemy

1. Brak spójnej autoryzacji w niektórych endpointach.
2. Brak obsługi timeoutów dla długotrwałych operacji.
3. Brak mechanizmu raportowania postępu dla długotrwałych operacji.
4. Katalog `controllers` jest pusty - logika biznesowa powinna być przeniesiona z routes do controllers. 