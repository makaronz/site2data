# Raport: Audyt Struktury Katalogów

- **Czas:** 2025-04-23T10:31:01+02:00

- **Pliki dotknięte:** [lista zostanie uzupełniona]

- **Podsumowanie:**

  - Przeprowadzono analizę struktury katalogów projektu.
  - Zidentyfikowano potencjalnie zbędne pliki i katalogi.
  - Zaproponowano ulepszenia struktury.

- **Zalecenia:**

  - **Usunięcie katalogów:**
    - `archive/`: Zawiera stare wersje plików i metadane.  Należy sprawdzić zawartość pod kątem potencjalnie użytecznych plików przed usunięciem.
    - `coverage/`: Zawiera dane pokrycia kodu.  Można usunąć, chyba że są one potrzebne do dalszej analizy.
    - `downloaded_content/`:  Zawiera pobrane pliki.  Należy usunąć pobrane pliki, które nie są już potrzebne.
    - `parsed_analyses/`:  Zawiera wyniki analizy.  Należy usunąć, chyba że są one potrzebne do dalszej analizy.
    - `uploads/`:  Zawiera załadowane pliki.  Należy usunąć, chyba że są one potrzebne do dalszej analizy.

  - **Zmiana nazw katalogów:**
    - `site2data-backend/` i `site2data-frontend/`:  Nazwy sugerują podział na dwa repozytoria.  Należy sprawdzić, czy nadal są potrzebne.  Jeśli nie, należy je zintegrować z `backend/` i `frontend/`.

  - **Przeniesienie plików:**
    - Pliki w `backend/backend/`, `backend/lib/`, `backend/scripts/` powinny zostać przeniesione do `backend/src/`, `backend/tests/`, `backend/utils/` odpowiednio.
    - Pliki w `frontend/src/` powinny zostać przeniesione do `frontend/src/`.
    - Pliki w `mobile/src/` powinny zostać przeniesione do `mobile/src/`.

  - **Uproszczenie struktury:**
    - Zagnieżdżone struktury katalogów w `backend/` i `frontend/` powinny zostać spłaszczone.

  - **Dodanie katalogów:**
    - Należy dodać katalog `docs/` dla dokumentacji projektu.
    - Należy dodać katalog `config/` dla plików konfiguracyjnych.
    - Należy dodać katalog `data/` dla danych projektu.