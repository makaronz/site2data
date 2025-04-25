# Specyfikacja Funkcjonalna: CineHub AI

**Wersja:** 1.0
**Data:** 2025-04-15

## 1. Wprowadzenie

### 1.1. Cel dokumentu
Niniejszy dokument określa szczegółowe wymagania funkcjonalne i niefunkcjonalne dla aplikacji webowej "CineHub AI". Celem specyfikacji jest zapewnienie jasnego i kompletnego opisu oczekiwanej funkcjonalności systemu, służąc jako podstawa dla procesu projektowania, rozwoju i testowania aplikacji.

### 1.2. Zakres aplikacji CineHub AI
CineHub AI to zintegrowana platforma chmurowa zaprojektowana w celu usprawnienia współpracy, zwiększenia kreatywności i optymalizacji przepływu pracy zespołów produkcyjnych w branży filmowej. Aplikacja obejmuje zarządzanie zasobami projektowymi, zaawansowane funkcje analizy i generowania treści oparte na AI/LLM (ze szczególnym uwzględnieniem modeli Hugging Face i orkiestracji LangChain), narzędzia kolaboracyjne oraz zarządzanie dostępem, wspierając wszystkie etapy produkcji filmowej – od rozwoju pomysłu po post-produkcję.

### 1.3. Definicje i akronimy
*   **AI:** Sztuczna Inteligencja (Artificial Intelligence)
*   **LLM:** Duży Model Językowy (Large Language Model)
*   **HF:** Hugging Face
*   **LC:** LangChain
*   **RAG:** Retrieval-Augmented Generation
*   **ASR:** Automatyczne Rozpoznawanie Mowy (Automatic Speech Recognition)
*   **NER:** Rozpoznawanie Encji Nazwanych (Named Entity Recognition)
*   **CV:** Widzenie Komputerowe (Computer Vision)
*   **UI:** Interfejs Użytkownika (User Interface)
*   **API:** Interfejs Programowania Aplikacji (Application Programming Interface)
*   **SSO:** Jednokrotne Logowanie (Single Sign-On)
*   **MFA:** Uwierzytelnianie Wieloskładnikowe (Multi-Factor Authentication)
*   **CRUD:** Create, Read, Update, Delete
*   **DAM:** Digital Asset Management
*   **VPC:** Virtual Private Cloud
*   **GPU:** Graphics Processing Unit

### 1.4. Odbiorcy dokumentu
Dokument przeznaczony jest dla:
*   Zespołu deweloperskiego (programiści frontend, backend, AI/ML)
*   Projektantów UX/UI
*   Testerów oprogramowania
*   Project Managerów
*   Interesariuszy projektu (np. producenci, przedstawiciele studia)

## 2. Opis Ogólny

### 2.1. Wizja produktu
CineHub AI ma stać się centralnym systemem nerwowym dla produkcji filmowych, inteligentnym hubem, który integruje wszystkie materiały, ułatwia komunikację i wykorzystuje moc AI do automatyzacji żmudnych zadań, odkrywania nowych połączeń w materiale i inspirowania procesu twórczego.

### 2.2. Główne cele biznesowe i użytkowe
*   **Zwiększenie efektywności:** Skrócenie czasu potrzebnego na wyszukiwanie informacji, analizę materiałów i zarządzanie zadaniami.
*   **Poprawa współpracy:** Ułatwienie komunikacji i wymiany informacji zwrotnej między członkami zespołu, niezależnie od ich lokalizacji.
*   **Wzmocnienie kreatywności:** Dostarczenie narzędzi AI wspierających generowanie pomysłów, analizę spójności i eksplorację materiału.
*   **Centralizacja zasobów:** Stworzenie jednego, bezpiecznego miejsca dla wszystkich materiałów projektowych.
*   **Optymalizacja przepływu pracy:** Usprawnienie procesów na różnych etapach produkcji.
*   **Redukcja błędów:** Minimalizacja ryzyka utraty danych i błędów wynikających z niespójności informacji.

### 2.3. Kluczowe funkcjonalności (przegląd)
*   Zintegrowane repozytorium projektowe z kontrolą wersji i blokowaniem plików.
*   Zaawansowany moduł AI/LLM (transkrypcja, analiza, tagowanie, podsumowania, Q&A, wsparcie kreatywne, wizualizacja relacji).
*   Narzędzia kolaboracyjne (współdzielenie, komentowanie, zadania, śledzenie postępów).
*   Bezpieczne zarządzanie użytkownikami, rolami i uprawnieniami.
*   Możliwości eksportu danych.

### 2.4. Docelowi użytkownicy i ich role
Aplikacja jest przeznaczona dla profesjonalistów z branży filmowej. Główne role (z możliwością konfiguracji):
*   Administrator Projektu
*   Producent
*   Reżyser
*   Scenarzysta
*   Operator
*   Montażysta
*   Dźwiękowiec
*   Scenograf
*   Kostiumograf
*   Koordynator Postprodukcji
*   Aktor
*   Gość (dostęp ograniczony)

### 2.5. Potencjalne Ryzyka i Wyzwania (Podsumowanie)
*   **Złożoność Techniczna:** Integracja wielu systemów (repozytorium, AI, kolaboracja) i modeli AI.
*   **Koszty Infrastruktury/API:** Znaczące koszty związane z zasobami GPU (lokalnie lub w chmurze) lub intensywnym wykorzystaniem API modeli AI.
*   **Wydajność AI:** Zapewnienie akceptowalnych czasów odpowiedzi dla zadań AI, zwłaszcza interaktywnych.
*   **Jakość Modeli AI:** Konieczność doboru, potencjalnego fine-tuningu i ewaluacji modeli (szczególnie dla języka polskiego i specyficznej domeny filmowej).
*   **Bezpieczeństwo i Prywatność Danych:** Ochrona potencjalnie wrażliwych materiałów produkcyjnych.
*   **Adopcja przez Użytkowników:** Konieczność stworzenia intuicyjnego interfejsu i przekonania zespołów do zmiany dotychczasowych nawyków pracy.
*   **Zarządzanie Dużymi Plikami:** Efektywne przechowywanie, transfer i przetwarzanie dużych plików multimedialnych.

## 3. Wymagania Funkcjonalne

### 3.1. Zarządzanie Projektami i Repozytorium

#### 3.1.1. Tworzenie i Zarządzanie Projektami
    3.1.1.1. Użytkownik z odpowiednimi uprawnieniami (np. Administrator Systemu, Producent) musi mieć możliwość utworzenia nowego projektu.
    3.1.1.2. Podczas tworzenia projektu wymagane jest podanie unikalnej Nazwy Projektu.
    3.1.1.3. Podczas tworzenia projektu opcjonalne jest podanie Opisu, Daty Rozpoczęcia i Daty Zakończenia.
    3.1.1.4. Nowo utworzony projekt ma status "Aktywny".
    3.1.1.5. System musi udostępniać widok listy (dashboard) wszystkich projektów, do których zalogowany użytkownik ma dostęp.
    3.1.1.6. Dashboard projektów musi umożliwiać wyszukiwanie projektów po nazwie.
    3.1.1.7. Dashboard projektów musi umożliwiać sortowanie projektów (np. po nazwie, dacie utworzenia).
    3.1.1.8. Użytkownik z uprawnieniami do zarządzania projektem (np. Administrator Projektu) musi mieć dostęp do ustawień projektu.
    3.1.1.9. Ustawienia projektu muszą pozwalać na edycję Nazwy, Opisu, Dat Rozpoczęcia/Zakończenia.
    3.1.1.10. Ustawienia projektu muszą pozwalać na zarządzanie członkami zespołu i ich rolami (zgodnie z 3.4.4).
    3.1.1.11. Użytkownik z odpowiednimi uprawnieniami musi mieć możliwość zarchiwizowania projektu.
    3.1.1.12. Zarchiwizowany projekt staje się tylko do odczytu dla wszystkich członków zespołu.
    3.1.1.13. Zarchiwizowany projekt może zostać przywrócony do statusu "Aktywny" przez uprawnionego użytkownika.
    3.1.1.14. Użytkownik z odpowiednimi uprawnieniami (np. Administrator Systemu) musi mieć możliwość trwałego usunięcia projektu.
    3.1.1.15. Usunięcie projektu musi wymagać dodatkowego potwierdzenia od użytkownika.

#### 3.1.2. Struktura Folderów i Organizacja Zasobów
    3.1.2.1. W ramach każdego projektu użytkownicy z odpowiednimi uprawnieniami muszą mieć możliwość tworzenia folderów.
    3.1.2.2. System musi wspierać tworzenie hierarchicznej struktury folderów (foldery wewnątrz folderów).
    3.1.2.3. Użytkownicy z odpowiednimi uprawnieniami muszą mieć możliwość zmiany nazwy folderów.
    3.1.2.4. Użytkownicy z odpowiednimi uprawnieniami muszą mieć możliwość przenoszenia folderów (wraz z zawartością) do innych lokalizacji w ramach tego samego projektu.
    3.1.2.5. Użytkownicy z odpowiednimi uprawnieniami muszą mieć możliwość usuwania folderów (wraz z zawartością).
    3.1.2.6. System powinien oferować opcję wyboru predefiniowanego szablonu struktury folderów przy tworzeniu nowego projektu (np. "Film Fabularny", "Dokument").
    3.1.2.7. Administrator Systemu musi mieć możliwość definiowania i zarządzania szablonami struktur folderów.
    3.1.2.8. Interfejs użytkownika musi zapewniać przejrzysty widok repozytorium projektu, umożliwiający nawigację po folderach i plikach.
    3.1.2.9. Widok repozytorium musi oferować co najmniej dwa tryby wyświetlania: widok listy i widok siatki (z miniaturami dla obsługiwanych typów plików).
    3.1.2.10. Użytkownik musi mieć możliwość sortowania zawartości folderu według Nazwy, Daty Modyfikacji, Typu, Rozmiaru (kolejność rosnąca/malejąca).
    3.1.2.11. Użytkownik musi mieć możliwość filtrowania zawartości folderu co najmniej po Typie Pliku i przypisanych Tagach.

#### 3.1.3. Obsługiwane Typy Plików
    3.1.3.1. System musi pozwalać na przesyłanie i przechowywanie plików tekstowych: .txt, .md, .rtf, .doc, .docx, .pdf.
    3.1.3.2. System musi pozwalać na przesyłanie i przechowywanie plików scenariuszowych: .fdx, .fountain, .celtx (jeśli parsowalne), .pdf.
    3.1.3.3. System musi pozwalać na przesyłanie i przechowywanie plików obrazów: .jpg, .jpeg, .png, .gif, .bmp, .tiff, .psd, .ai.
    3.1.3.4. System musi pozwalać na przesyłanie i przechowywanie plików audio: .mp3, .wav, .aac, .ogg, .flac.
    3.1.3.5. System musi pozwalać na przesyłanie i przechowywanie plików wideo: .mp4, .mov, .avi, .wmv, .mkv.
    3.1.3.6. System musi pozwalać na przesyłanie i przechowywanie arkuszy kalkulacyjnych: .xls, .xlsx, .csv.
    3.1.3.7. System musi pozwalać na przesyłanie i przechowywanie prezentacji: .ppt, .pptx.
    3.1.3.8. System musi pozwalać na przesyłanie i przechowywanie innych typów plików (traktowanych jako binarne bez podglądu).
    3.1.3.9. System musi identyfikować typ pliku na podstawie rozszerzenia i/lub typu MIME.

#### 3.1.4. Przesyłanie i Zarządzanie Plikami
    3.1.4.1. Interfejs użytkownika musi umożliwiać przesyłanie plików metodą "przeciągnij i upuść" (drag & drop) na obszar folderu.
    3.1.4.2. Interfejs użytkownika musi umożliwiać przesyłanie plików poprzez standardowe okno dialogowe wyboru plików.
    3.1.4.3. System musi pozwalać na przesyłanie wielu plików jednocześnie.
    3.1.4.4. Podczas przesyłania plików musi być widoczny wskaźnik postępu dla każdego pliku i/lub dla całego procesu.
    3.1.4.5. Muszą istnieć konfigurowalne limity maksymalnego rozmiaru pojedynczego przesyłanego pliku.
    3.1.4.6. Muszą istnieć konfigurowalne limity całkowitej przestrzeni dyskowej dostępnej dla projektu lub użytkownika.
    3.1.4.7. Użytkownicy z odpowiednimi uprawnieniami muszą mieć możliwość zmiany nazwy plików.
    3.1.4.8. Użytkownicy z odpowiednimi uprawnieniami muszą mieć możliwość przenoszenia plików między folderami w ramach tego samego projektu.
    3.1.4.9. Użytkownicy z odpowiednimi uprawnieniami muszą mieć możliwość kopiowania plików w ramach tego samego projektu.
    3.1.4.10. Użytkownicy z odpowiednimi uprawnieniami muszą mieć możliwość usuwania plików.
    3.1.4.11. Usunięte pliki powinny trafiać do "Kosza" projektowego.
    3.1.4.12. Użytkownicy z odpowiednimi uprawnieniami muszą mieć możliwość przywracania plików z Kosza.
    3.1.4.13. Musi istnieć mechanizm automatycznego lub ręcznego opróżniania Kosza (np. po 30 dniach).
    3.1.4.14. System musi automatycznie zapisywać podstawowe metadane dla każdego pliku: Nazwa, Rozmiar, Typ, Data Utworzenia, Data Ostatniej Modyfikacji, Użytkownik Przesyłający/Modyfikujący.
    3.1.4.15. Użytkownicy muszą mieć możliwość dodawania niestandardowych metadanych (np. w formie par klucz-wartość) lub tagów do plików (zgodnie z 3.2.3).

#### 3.1.5. Kontrola Wersji
    3.1.5.1. **Wersjonowanie Plików Tekstowych:**
        3.1.5.1.1. System musi automatycznie tworzyć nową wersję pliku tekstowego przy każdej operacji zapisu zmian (jeśli edycja odbywa się w aplikacji) lub przy przesłaniu pliku o tej samej nazwie w tej samej lokalizacji.
        3.1.5.1.2. Użytkownik musi mieć dostęp do historii wersji pliku tekstowego.
        3.1.5.1.3. Historia wersji musi wyświetlać co najmniej: numer wersji, datę/godzinę utworzenia, autora zmiany, opcjonalny komentarz.
        3.1.5.1.4. System musi umożliwiać wizualne porównanie różnic (diff) między dwiema wybranymi wersjami pliku tekstowego.
        3.1.5.1.5. Użytkownik z odpowiednimi uprawnieniami musi mieć możliwość przywrócenia wybranej poprzedniej wersji pliku tekstowego jako wersji aktualnej.
    3.1.5.2. **Wersjonowanie Plików Nietekstowych (Binarnych):**
        3.1.5.2.1. System musi tworzyć nową wersję pliku binarnego, gdy użytkownik prześle plik o tej samej nazwie w tej samej lokalizacji, zastępując istniejący.
        3.1.5.2.2. System musi przechowywać pełną kopię każdej poprzedniej wersji pliku binarnego.
        3.1.5.2.3. Użytkownik musi mieć dostęp do historii wersji pliku binarnego.
        3.1.5.2.4. Historia wersji musi wyświetlać co najmniej: numer wersji, datę/godzinę przesłania, autora, rozmiar pliku, opcjonalny komentarz.
        3.1.5.2.5. Użytkownik musi mieć możliwość pobrania dowolnej historycznej wersji pliku binarnego.
        3.1.5.2.6. Użytkownik z odpowiednimi uprawnieniami musi mieć możliwość przywrócenia wybranej poprzedniej wersji pliku binarnego jako wersji aktualnej.
        3.1.5.2.7. Funkcja wersjonowania plików nietekstowych musi być konfigurowalna (włącz/wyłącz na poziomie projektu/globalnie).
        3.1.5.2.8. Musi istnieć możliwość konfiguracji limitów liczby przechowywanych wersji lub czasu ich przechowywania dla plików nietekstowych.

#### 3.1.6. Podgląd Plików w Aplikacji
    3.1.6.1. System musi udostępniać wbudowaną przeglądarkę dla plików .txt i .md.
    3.1.6.2. System musi udostępniać wbudowaną przeglądarkę dla plików .pdf (np. z wykorzystaniem PDF.js).
    3.1.6.3. System musi udostępniać wbudowaną przeglądarkę dla popularnych formatów obrazów (.jpg, .png, .gif).
    3.1.6.4. System musi udostępniać wbudowany odtwarzacz dla popularnych formatów audio (.mp3, .wav, .aac, .ogg).
    3.1.6.5. System musi udostępniać wbudowany odtwarzacz dla popularnych formatów wideo (.mp4, .mov, .webm).
    3.1.6.6. System może wymagać transkodowania plików wideo/audio po stronie serwera do formatów obsługiwanych przez przeglądarki webowe w celu zapewnienia podglądu.
    3.1.6.7. System powinien próbować renderować podgląd dla formatów scenariuszowych (.fountain, .fdx - jeśli parsowalne) z zachowaniem specyficznego formatowania.
    3.1.6.8. Dla nieobsługiwanych typów plików system musi wyświetlać ikonę typu pliku oraz podstawowe metadane (nazwa, rozmiar, data modyfikacji) i oferować opcję pobrania.

#### 3.1.7. Blokowanie Plików (Check-in/Check-out)
    3.1.7.1. Użytkownik z uprawnieniami do edycji musi mieć możliwość "wypisania" (check-out) pliku.
    3.1.7.2. Wypisanie pliku musi blokować możliwość przesłania nowej wersji tego pliku przez innych użytkowników.
    3.1.7.3. Zablokowany plik musi być wyraźnie oznaczony w interfejsie (np. ikoną kłódki).
    3.1.7.4. Interfejs musi wyświetlać informację, kto i kiedy zablokował dany plik.
    3.1.7.5. Użytkownik, który zablokował plik, musi mieć możliwość jego "wpisania" (check-in).
    3.1.7.6. Proces check-in musi obejmować przesłanie nowej wersji pliku (co tworzy nową wersję zgodnie z 3.1.5) i automatyczne odblokowanie pliku.
    3.1.7.7. Podczas check-in użytkownik musi mieć możliwość dodania komentarza do wersji.
    3.1.7.8. Użytkownik, który zablokował plik, musi mieć możliwość anulowania wypisania (undo check-out) bez przesyłania nowej wersji, co odblokowuje plik.
    3.1.7.9. Administrator Projektu musi mieć możliwość wymuszonego odblokowania pliku zablokowanego przez innego użytkownika.
    3.1.7.10. Akcja wymuszonego odblokowania musi być rejestrowana w logach systemowych/projektowych.

### 3.2. Moduł AI/LLM

#### 3.2.1. Automatyczna Transkrypcja Audio/Wideo
    3.2.1.1. System musi umożliwiać inicjowanie procesu transkrypcji dla przesłanych plików audio i wideo.
    3.2.1.2. Transkrypcja musi wykorzystywać modele ASR z Hugging Face (np. Whisper).
    3.2.1.3. Proces transkrypcji musi działać asynchronicznie w tle.
    3.2.1.4. Użytkownik musi być powiadamiany o zakończeniu transkrypcji.
    3.2.1.5. Wynik transkrypcji (plik tekstowy) musi być zapisywany i powiązany z oryginalnym plikiem audio/wideo.
    3.2.1.6. Transkrypcja powinna zawierać znaczniki czasowe (timestamps) dla poszczególnych segmentów mowy.
    3.2.1.7. Opcjonalnie: System powinien próbować identyfikować różnych mówców (diarization) w transkrypcji, wykorzystując odpowiednie modele (np. z pyannote.audio przez HF).

#### 3.2.2. Analiza Transkrypcji
    3.2.2.1. System musi umożliwiać generowanie automatycznych podsumowań dla wygenerowanych transkrypcji.
    3.2.2.2. Podsumowania muszą być generowane przy użyciu modeli Summarization z HF, zarządzanych przez LC.
    3.2.2.3. System musi umożliwiać ekstrakcję kluczowych punktów, decyzji lub zadań z transkrypcji przy użyciu modeli NER lub LLM z HF/LC.
    3.2.2.4. Wyniki ekstrakcji zadań powinny umożliwiać łatwe utworzenie nowych zadań w module Zarządzania Zadaniami (3.3.3).
    3.2.2.5. System musi umożliwiać analizę sentymentu/emocji dla całej transkrypcji lub jej fragmentów, wykorzystując modele z HF/LC.
    3.2.2.6. Wyniki analizy (podsumowanie, punkty kluczowe, sentyment) muszą być powiązane z transkrypcją i oryginalnym plikiem.

#### 3.2.3. Inteligentne Tagowanie i Kategoryzacja Zasobów
    3.2.3.1. System musi umożliwiać automatyczne sugerowanie tagów dla zasobów tekstowych (scenariusze, notatki, transkrypcje) na podstawie ich treści.
    3.2.3.2. Automatyczne tagowanie tekstu musi wykorzystywać modele NER z HF/LC do identyfikacji encji (Postać, Lokacja, Rekwizyt itp.).
    3.2.3.3. Automatyczne tagowanie tekstu musi wykorzystywać modele Zero-Shot Classification z HF/LC do przypisywania predefiniowanych kategorii (np. typ sceny, wątek).
    3.2.3.4. System musi umożliwiać automatyczne sugerowanie tagów dla zasobów wizualnych (obrazy, klatki wideo).
    3.2.3.5. Automatyczne tagowanie wizualne musi wykorzystywać modele Object Detection z HF/LC.
    3.2.3.6. Automatyczne tagowanie wizualne musi wykorzystywać modele Image/Video Captioning z HF/LC do generowania opisów, które mogą być podstawą do dalszego tagowania.
    3.2.3.7. Automatyczne tagowanie wizualne musi wykorzystywać modele Image/Video Classification z HF/LC do przypisywania kategorii (np. plener/wnętrze).
    3.2.3.8. Użytkownik musi mieć możliwość przeglądania sugerowanych tagów AI.
    3.2.3.9. Użytkownik musi mieć możliwość akceptacji, odrzucenia lub edycji tagów sugerowanych przez AI.
    3.2.3.10. Użytkownik musi mieć możliwość ręcznego dodawania własnych tagów do dowolnego zasobu.
    3.2.3.11. System musi pozwalać na definiowanie własnych kategorii tagów na poziomie projektu.

#### 3.2.4. Generowanie Podsumowań (Dokumenty, Dyskusje)
    3.2.4.1. System musi umożliwiać użytkownikowi zainicjowanie generowania podsumowania dla wybranych dokumentów tekstowych, transkrypcji lub długich wątków komentarzy.
    3.2.4.2. Podsumowania muszą być generowane przy użyciu modeli Summarization z HF, zarządzanych przez LC (`load_summarize_chain`).
    3.2.4.3. System musi automatycznie wybierać odpowiednią strategię podsumowania (np. `stuff`, `map_reduce`, `refine`) w zależności od długości tekstu wejściowego.
    3.2.4.4. Użytkownik powinien mieć możliwość określenia preferowanej długości podsumowania (np. krótkie, średnie, szczegółowe).
    3.2.4.5. Wygenerowane podsumowanie musi być możliwe do skopiowania lub zapisania jako nowy zasób (np. notatka).

#### 3.2.5. Wyszukiwanie Semantyczne i Kontekstowe
    3.2.5.1. System musi udostępniać globalny pasek wyszukiwania obejmujący wszystkie zasoby projektu, do których użytkownik ma dostęp.
    3.2.5.2. Wyszukiwanie musi obsługiwać zapytania w języku naturalnym.
    3.2.5.3. System musi wykorzystywać modele osadzeń (Embeddings) z HF/LC do reprezentacji wektorowej fragmentów tekstu (z plików, transkrypcji, komentarzy, metadanych).
    3.2.5.4. Osadzenia muszą być przechowywane w dedykowanej bazie wektorowej (zgodnie z 6.3).
    3.2.5.5. Przy zapytaniu użytkownika, system musi konwertować zapytanie na wektor i wyszukiwać najbardziej podobne semantycznie fragmenty w bazie wektorowej (Retrieval).
    3.2.5.6. System musi wykorzystywać LLM z HF/LC (zarządzany np. przez `RetrievalQA` chain) do syntezy odpowiedzi na podstawie pobranych fragmentów i oryginalnego zapytania (RAG).
    3.2.5.7. Wyniki wyszukiwania muszą zawierać nie tylko bezpośrednie trafienia słów kluczowych, ale również wyniki istotne kontekstowo.
    3.2.5.8. Wyniki wyszukiwania muszą zawierać odnośniki do oryginalnych zasobów (plików, komentarzy, zadań), z których pochodzi informacja.
    3.2.5.9. System musi zapewniać odpowiednią wydajność wyszukiwania semantycznego (zgodnie z 4.1).

#### 3.2.6. Wsparcie Kreatywne
    3.2.6.1. **Generowanie Pomysłów:**
        3.2.6.1.1. Musi istnieć interfejs (np. czat, formularz) umożliwiający użytkownikowi żądanie wygenerowania pomysłów (np. na scenę, dialog, postać).
        3.2.6.1.2. Użytkownik musi mieć możliwość podania kontekstu i parametrów dla generowania (np. ton, styl, długość).
        3.2.6.1.3. Generowanie musi wykorzystywać LLM z HF/LC z odpowiednio skonstruowanymi promptami.
        3.2.6.1.4. System musi pozwalać na iteracyjne generowanie i modyfikację pomysłów.
    3.2.6.2. **Analiza Spójności Scenariusza:**
        3.2.6.2.1. Musi istnieć funkcja pozwalająca na uruchomienie analizy spójności dla scenariusza lub jego fragmentów.
        3.2.6.2.2. Analiza musi wykorzystywać agenta LC lub dedykowane łańcuchy z LLM (HF) do identyfikacji potencjalnych niespójności logicznych, fabularnych i ciągłości.
        3.2.6.2.3. Wyniki analizy muszą być prezentowane jako lista potencjalnych problemów z odnośnikami do tekstu.
    3.2.6.3. **Sugestie Rozwoju Postaci/Fabuly:**
        3.2.6.3.1. Użytkownik musi mieć możliwość wybrania postaci/wątku i poproszenia o sugestie dotyczące dalszego rozwoju.
        3.2.6.3.2. Sugestie muszą być generowane przez LLM (HF/LC) na podstawie analizy dotychczasowego materiału.
    3.2.6.4. **Burza Mózgów z AI:**
        3.2.6.4.1. Musi istnieć interfejs czatu umożliwiający interaktywną burzę mózgów z AI.
        3.2.6.4.2. AI (LLM z HF zarządzany przez agenta konwersacyjnego LC z pamięcią) musi być zdolne do zadawania pytań, podważania założeń i generowania pomysłów w odpowiedzi na dane wejściowe użytkownika.
        3.2.6.4.3. Agent AI powinien mieć dostęp do kontekstu projektu (przez RAG).

#### 3.2.7. Wizualizacja Relacji Między Postaciami
    3.2.7.1. System musi generować dane potrzebne do wizualizacji relacji na podstawie analizy interakcji postaci w scenariuszach i innych materiałach (wykorzystując wyniki analizy relacji z LLM/NLP).
    3.2.7.2. Dane relacji muszą zawierać co najmniej: parę postaci, typ relacji (np. konflikt, sojusz), siłę relacji, dominujący sentyment/emocję, listę scen/kontekstów.
    3.2.7.3. Musi istnieć dedykowany widok w interfejsie użytkownika prezentujący interaktywny graf (diagram sieciowy) relacji.
    3.2.7.4. Graf musi wykorzystywać biblioteki JS (np. D3.js, Vis.js, Cytoscape.js).
    3.2.7.5. Węzły grafu (postacie) i krawędzie (relacje) muszą wizualnie reprezentować swoje atrybuty (np. rozmiar węzła, kolor/grubość/styl krawędzi).
    3.2.7.6. Graf musi być interaktywny: zoom, przesuwanie, klikanie na elementy.
    3.2.7.7. Kliknięcie na węzeł (postać) musi podświetlać jej relacje lub wyświetlać dodatkowe informacje o postaci.
    3.2.7.8. Kliknięcie na krawędź (relację) musi wyświetlać dodatkowe informacje, np. kluczowe sceny/dialogi ilustrujące tę relację.
    3.2.7.9. Użytkownik musi mieć możliwość filtrowania grafu (np. po typie relacji).

### 3.3. Narzędzia Kolaboracyjne

#### 3.3.1. Współdzielenie Zasobów
    3.3.1.1. Użytkownik musi mieć możliwość udostępniania plików i folderów innym członkom zespołu projektowego.
    3.3.1.2. Podczas udostępniania użytkownik musi mieć możliwość wyboru poziomu dostępu (np. odczyt, edycja, komentowanie).
    3.3.1.3. System musi umożliwiać generowanie bezpiecznych linków do udostępniania zasobów na zewnątrz (z opcjami hasła/daty wygaśnięcia).
    3.3.1.4. Użytkownik musi mieć widok zasobów udostępnionych przez siebie i dla siebie.
    3.3.1.5. System musi wysyłać powiadomienia o udostępnieniu zasobu (zgodnie z 3.3.5).

#### 3.3.2. Komentowanie i Adnotacje w Czasie Rzeczywistym
    3.3.2.1. Użytkownicy muszą mieć możliwość dodawania komentarzy do plików, folderów i zadań.
    3.3.2.2. Komentarze muszą tworzyć wątki (możliwość odpowiedzi).
    3.3.2.3. System musi umożliwiać dodawanie adnotacji do zaznaczonych fragmentów tekstu.
    3.3.2.4. System musi umożliwiać dodawanie adnotacji wizualnych (rysowanie, tekst, znaczniki) na obrazach.
    3.3.2.5. System musi umożliwiać dodawanie adnotacji wizualnych/czasowych na plikach wideo.
    3.3.2.6. Komentarze muszą być powiązane z konkretnymi adnotacjami (jeśli dotyczy).
    3.3.2.7. Użytkownicy muszą mieć możliwość wzmiankowania (@mention) innych użytkowników w komentarzach.
    3.3.2.8. Wzmiankowany użytkownik musi otrzymać powiadomienie.
    3.3.2.9. Musi istnieć możliwość oznaczania statusu komentarzy/adnotacji (np. do zrobienia, rozwiązany).
    3.3.2.10. Musi istnieć możliwość filtrowania i wyszukiwania komentarzy.
    3.3.2.11. Zmiany (nowe komentarze, odpowiedzi) powinny być widoczne dla innych użytkowników w czasie zbliżonym do rzeczywistego (near real-time).
    3.3.2.12. Opcjonalnie: AI może podsumowywać długie wątki komentarzy.
    3.3.2.13. Opcjonalnie: AI może sugerować osoby do wzmianki.

#### 3.3.3. Zarządzanie Zadaniami
    3.3.3.1. Użytkownicy muszą mieć możliwość tworzenia zadań w ramach projektu.
    3.3.3.2. Każde zadanie musi mieć co najmniej Tytuł, opcjonalnie Opis, Termin Wykonania, Priorytet, Status.
    3.3.3.3. Musi istnieć możliwość przypisania zadania do jednego lub wielu członków zespołu.
    3.3.3.4. Musi istnieć możliwość powiązania zadania z jednym lub wieloma zasobami (plikami/folderami) z repozytorium.
    3.3.3.5. Musi istnieć możliwość definiowania statusów zadań (konfigurowalne na poziomie projektu lub globalnie).
    3.3.3.6. Musi istnieć możliwość tworzenia podzadań dla zadania głównego.
    3.3.3.7. Musi istnieć możliwość dodawania komentarzy do zadań.
    3.3.3.8. Interfejs musi udostępniać różne widoki zadań: co najmniej widok listy i widok tablicy Kanban.
    3.3.3.9. Opcjonalnie: Widok kalendarza pokazujący zadania z terminami.
    3.3.3.10. Musi istnieć możliwość filtrowania i sortowania zadań według różnych kryteriów.
    3.3.3.11. System musi wysyłać powiadomienia związane z zadaniami (przypisanie, zmiana statusu, termin - zgodnie z 3.3.5).
    3.3.3.12. **Integracja z Zewnętrznymi Kalendarzami:**
        3.3.3.12.1. Użytkownik musi mieć możliwość autoryzacji dostępu do swojego konta Google Calendar / Outlook Calendar / Apple Calendar (iCal).
        3.3.3.12.2. Musi istnieć opcja (konfigurowalna przez użytkownika) synchronizacji zadań z terminem z CineHub AI do wybranego zewnętrznego kalendarza.
        3.3.3.12.3. Synchronizacja jednokierunkowa (CineHub -> Kalendarz Zewnętrzny) jest wymagana.
        3.3.3.12.4. Opcjonalnie: Rozważenie implementacji synchronizacji dwukierunkowej (zmiany w kalendarzu zewnętrznym -> CineHub), z uwzględnieniem potencjalnych konfliktów.
        3.3.3.12.5. Zadania w kalendarzu zewnętrznym muszą zawierać link powrotny do zadania w CineHub AI.
    3.3.3.13. Opcjonalnie: AI może sugerować zadania na podstawie transkrypcji.
    3.3.3.14. Opcjonalnie: AI może sugerować osoby do przypisania zadania.

#### 3.3.4. Śledzenie Postępów
    3.3.4.1. Musi istnieć Dashboard Projektowy wyświetlający kluczowe wskaźniki (np. liczba zadań wg statusu, nadchodzące terminy, ostatnia aktywność).
    3.3.4.2. System musi umożliwiać generowanie raportów aktywności (np. zmiany w plikach, ukończone zadania w danym okresie).
    3.3.4.3. Muszą istnieć wizualizacje postępu prac (np. wykres spalania zadań).
    3.3.4.4. Musi istnieć możliwość definiowania kamieni milowych projektu i oznaczania ich statusu.

#### 3.3.5. System Powiadomień
    3.3.5.1. System musi dostarczać powiadomienia wewnątrz aplikacji o istotnych zdarzeniach.
    3.3.5.2. Musi istnieć dedykowana sekcja/panel do przeglądania powiadomień.
    3.3.5.3. Powiadomienia muszą być oznaczane jako przeczytane/nieprzeczytane.
    3.3.5.4. Użytkownik musi mieć możliwość skonfigurowania, jakie typy powiadomień chce otrzymywać i w jaki sposób (w aplikacji, e-mail).
    3.3.5.5. System musi generować powiadomienia co najmniej dla: przypisania zadania, zmiany statusu zadania, zbliżającego się terminu zadania, nowego komentarza w obserwowanym wątku, wzmianki @mention, udostępnienia zasobu.

### 3.4. Zarządzanie Użytkownikami i Dostępem

#### 3.4.1. Rejestracja i Logowanie
    3.4.1.1. Musi istnieć możliwość rejestracji nowych użytkowników za pomocą formularza (imię, nazwisko, e-mail, hasło).
    3.4.1.2. Rejestracja musi wymagać weryfikacji adresu e-mail.
    3.4.1.3. Musi istnieć możliwość logowania za pomocą e-maila i hasła.
    3.4.1.4. Musi istnieć mechanizm odzyskiwania (resetowania) zapomnianego hasła.
    3.4.1.5. Hasła muszą być przechowywane w bezpieczny sposób (hash + sól).
    3.4.1.6. System powinien wymuszać politykę złożoności haseł.
    3.4.1.7. Opcjonalnie: Rozważenie implementacji logowania przez SSO (Google, Microsoft, Apple).
    3.4.1.8. Opcjonalnie: Rozważenie implementacji MFA/2FA.

#### 3.4.2. Definiowanie Ról Użytkowników
    3.4.2.1. System musi zawierać zestaw predefiniowanych ról (np. Administrator Projektu, Reżyser, Scenarzysta, Montażysta, Gość).
    3.4.2.2. Każda rola musi mieć przypisany domyślny zestaw uprawnień.
    3.4.2.3. Opcjonalnie: Administrator Projektu powinien mieć możliwość tworzenia ról niestandardowych w ramach projektu.

#### 3.4.3. System Uprawnień
    3.4.3.1. System uprawnień musi działać na poziomie projektu oraz folderów/zasobów.
    3.4.3.2. Muszą istnieć granularne uprawnienia dla różnych akcji (np. view, edit, delete, share, comment, manage_permissions).
    3.4.3.3. Uprawnienia muszą być przypisane do ról.
    3.4.3.4. Uprawnienia do zasobów muszą być dziedziczone z folderów nadrzędnych.
    3.4.3.5. Musi istnieć możliwość nadpisania dziedziczonych uprawnień na poziomie konkretnego folderu/pliku.
    3.4.3.6. Opcjonalnie: Możliwość przypisywania indywidualnych uprawnień użytkownikowi do zasobu, niezależnie od jego roli.

#### 3.4.4. Zarządzanie Zespołem Projektowym
    3.4.4.1. Administrator Projektu musi mieć możliwość zapraszania użytkowników do projektu przez e-mail.
    3.4.4.2. Administrator Projektu musi mieć możliwość przypisywania ról zaproszonym/istniejącym członkom zespołu w ramach projektu.
    3.4.4.3. Administrator Projektu musi mieć możliwość zmiany roli członka zespołu.
    3.4.4.4. Administrator Projektu musi mieć możliwość usunięcia członka zespołu z projektu.
    3.4.4.5. Musi istnieć widok listy członków projektu z ich przypisanymi rolami.

### 3.5. Eksport Danych

    3.5.1. Użytkownik musi mieć możliwość pobrania (eksportu) pojedynczych plików w ich oryginalnym formacie.
    3.5.2. Użytkownik musi mieć możliwość pobrania (eksportu) zawartości całego folderu (np. jako archiwum .zip).
    3.5.3. Użytkownik z odpowiednimi uprawnieniami musi mieć możliwość wyeksportowania całego projektu (wszystkich plików i folderów, np. jako archiwum .zip).
    3.5.4. System musi umożliwiać eksport wygenerowanych przez AI wyników w użytecznych formatach, np.:
        3.5.4.1. Transkrypcje jako pliki .txt lub .srt.
        3.5.4.2. Podsumowania jako pliki .txt lub .md.
        3.5.4.3. Listy tagów/encji (np. rekwizyty, lokacje) jako pliki .csv lub .json.
        3.5.4.4. Raporty analizy spójności jako pliki .txt lub .md.
    3.5.5. Musi istnieć możliwość eksportu listy zadań (np. do formatu .csv).

## 4. Wymagania Niefunkcjonalne

### 4.1. Wydajność
    4.1.1. Czasy odpowiedzi interfejsu użytkownika dla większości operacji nie powinny przekraczać 1-2 sekund.
    4.1.2. System musi efektywnie obsługiwać transfer dużych plików multimedialnych.
    4.1.3. **Wydajność AI:**
        4.1.3.1. Zadania interaktywne AI (krótkie podsumowania, proste Q&A, krótkie sugestie kreatywne) powinny zwracać wyniki w czasie poniżej 5-10 sekund.
        4.1.3.2. Zadania asynchroniczne AI (długie transkrypcje, analiza dużych plików wideo/scenariuszy) muszą działać w tle.
        4.1.3.3. Dla zadań asynchronicznych wymagane jest natychmiastowe potwierdzenie rozpoczęcia, informacja o statusie, wskaźnik postępu (jeśli możliwy) i powiadomienie o zakończeniu.
        4.1.3.4. Należy zdefiniować i dążyć do osiągnięcia akceptowalnych czasów ukończenia dla typowych zadań asynchronicznych (np. transkrypcja 1h audio < 15 min).
    4.1.4. Wyszukiwanie semantyczne powinno zwracać wyniki w ciągu kilku sekund.
    4.1.5. Aktualizacje kolaboracyjne (komentarze) powinny być widoczne w czasie zbliżonym do rzeczywistego.

### 4.2. Skalowalność
    4.2.1. Architektura musi wspierać skalowalność horyzontalną backendu i modułu AI.
    4.2.2. Bazy danych (główna i wektorowa) muszą być skalowalne.
    4.2.3. Magazyn plików musi być oparty na skalowalnym rozwiązaniu (np. storage obiektowy).
    4.2.4. Moduł AI musi umożliwiać niezależne skalowanie zasobów obliczeniowych (CPU/GPU).

### 4.3. Bezpieczeństwo
    4.3.1. Wymagane bezpieczne uwierzytelnianie (hashowanie haseł, polityka złożoności, opcjonalnie MFA/SSO).
    4.3.2. Wymagana rygorystyczna autoryzacja oparta na rolach i uprawnieniach.
    4.3.3. Wymagane szyfrowanie danych w transporcie (HTTPS).
    4.3.4. Wymagane szyfrowanie danych w spoczynku (dla baz danych i magazynu plików).
    4.3.5. Wymagana ochrona przed powszechnymi atakami webowymi (XSS, CSRF, SQL Injection itp.).
    4.3.6. Wymagane bezpieczne zarządzanie sekretami (klucze API, hasła).
    4.3.7. Wymagane logowanie zdarzeń bezpieczeństwa.
    4.3.8. Należy uwzględnić wymagania RODO/GDPR.

### 4.4. Użyteczność
    4.4.1. Interfejs użytkownika musi być spójny, intuicyjny i łatwy do nauczenia dla osób z branży filmowej.
    4.4.2. Nawigacja musi być prosta i logiczna.
    4.4.3. Kluczowe przepływy pracy powinny być zoptymalizowane pod kątem minimalizacji liczby kroków.
    4.4.4. Komunikaty systemowe muszą być jasne i pomocne.
    4.4.5. Należy dążyć do spełnienia podstawowych standardów dostępności (WCAG).
    4.4.6. Musi być dostępna pomoc kontekstowa lub dokumentacja użytkownika.

### 4.5. Niezawodność
    4.5.1. System musi dążyć do wysokiej dostępności (np. 99.9% uptime).
    4.5.2. Architektura powinna być odporna na awarie pojedynczych komponentów.
    4.5.3. Muszą być wdrożone mechanizmy zapewniające integralność danych.
    4.5.4. Musi istnieć procedura regularnego tworzenia kopii zapasowych (baza danych, magazyn plików) i ich odzyskiwania.

### 4.6. Kompatybilność
    4.6.1. Aplikacja webowa musi poprawnie działać w najnowszych wersjach głównych przeglądarek (Chrome, Firefox, Safari, Edge).
    4.6.2. Aplikacja musi być niezależna od systemu operacyjnego użytkownika końcowego.

### 4.7. Utrzymywalność
    4.7.1. Kod źródłowy musi być czytelny, dobrze zorganizowany i zgodny z dobrymi praktykami.
    4.7.2. Architektura musi być modularna.
    4.7.3. Kod musi być łatwy do testowania (wysokie pokrycie testami jednostkowymi i integracyjnymi).
    4.7.4. Musi istnieć aktualna dokumentacja techniczna.
    4.7.5. Zależności projektu muszą być zarządzane za pomocą odpowiednich narzędzi.

## 5. Model Danych (Wysokopoziomowy)
*   **Główne Encje:** `Project`, `User`, `Member`, `Role`, `Permission`, `Asset` (Plik/Folder), `Version`, `Tag`, `Comment`, `Task`, `AIAnalysisResult`, `Notification`.
*   **Kluczowe Relacje:**
    *   Projekt zawiera Członków, Zasoby, Zadania, Tagi, Role.
    *   Użytkownik może być Członkiem wielu Projektów, tworzyć Zasoby, Zadania, Komentarze.
    *   Członek łączy Użytkownika i Projekt, ma przypisaną Rolę.
    *   Rola definiuje Uprawnienia.
    *   Zasób (Folder) zawiera inne Zasoby.
    *   Zasób (Plik) ma Wersje, Tagi, Komentarze, Wyniki Analizy AI, może być powiązany z Zadaniami.
    *   Komentarz może być odpowiedzią na inny Komentarz.
    *   Zadanie ma przypisanych Użytkowników, może mieć Podzadania i być powiązane z Zasobami.
*   *(Szczegółowy model relacyjny/dokumentowy zostanie opracowany w fazie projektowania technicznego)*.

## 6. Architektura Systemu (Wysokopoziomowa)
*   **Paradygmat:** Modularny monolit (preferowany na start) lub podejście oparte na serwisach, z wyraźnym oddzieleniem modułu AI.
*   **Główne Komponenty:** Frontend (Web App), Backend (API & Logic), Moduł AI (Processing Engine), Baza Danych Główna, Baza Danych Wektorowa, Magazyn Plików, Kolejka Zadań.
*   **Stos Technologiczny (Propozycja):**
    *   Frontend: React/Vue/Svelte + biblioteki wizualizacyjne (D3.js/Vis.js/Cytoscape.js).
    *   Backend: Python + FastAPI/Django.
    *   AI: Python + LangChain + Hugging Face Transformers + OpenCV + Whisper itp.
    *   Baza Główna: PostgreSQL (+ pgvector?) / MongoDB.
    *   Baza Wektorowa: Weaviate/Pinecone/Chroma/Milvus.
    *   Magazyn Plików: AWS S3 / Google Cloud Storage / Azure Blob Storage.
    *   Kolejka Zadań: Celery + Redis/RabbitMQ.
*   **Integracja AI:** LangChain jako orkiestrator; strategia hybrydowa hostowania modeli HF (mniejsze lokalnie, większe/multimodalne na Inference Endpoints - potencjalnie prywatnych).
*   **Infrastruktura:** Konteneryzacja (Docker), wdrożenie w chmurze publicznej (AWS/GCP/Azure) lub on-premise, monitoring, logowanie.

## 7. Załączniki
*(Sekcja do uzupełnienia w przyszłości, np. o makiety UI, diagramy przepływu)*.