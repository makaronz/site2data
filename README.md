# Site2Data

[English](#english) | [Polski](#polski)

---

<a name="english"></a>
## 🌐 Website and PDF Analysis Tool with AI

Site2Data is a powerful tool that analyzes websites and PDF documents using artificial intelligence to generate comprehensive summaries. The application crawls websites, extracts text content, downloads PDF files, and processes them to create concise summaries using OpenAI's GPT-4o model.

### ✨ Features

- 🔍 Website crawling with customizable depth
- 📄 Automatic PDF file detection and downloading
- 📊 Text extraction from websites and PDF documents
- 🤖 AI-powered content summarization
- 🖼️ Image extraction from PDF files
- 📱 Responsive web interface
- 📈 Real-time analysis status updates

### 🚀 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/arkadiuszfudali/site2data.git
   cd site2data
   ```

2. Create and activate a virtual environment (recommended):
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up your OpenAI API key:
   - Copy the `.env.example` file to `.env`
   - Add your OpenAI API key to the `.env` file:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```

5. Install pdftotext (required for PDF text extraction):
   - On Ubuntu/Debian: `sudo apt-get install poppler-utils`
   - On macOS: `brew install poppler`
   - On Windows: Download and install from [Xpdf tools](https://www.xpdfreader.com/download.html)

### 🖥️ Usage

1. Start the application:
   ```bash
   python app.py
   ```

2. Open your web browser and navigate to `http://127.0.0.1:5000`

3. Enter a URL, a comma-separated list of URLs, or a path to a local PDF file/directory

4. Click "Analyze" and wait for the results

### 🌍 Deployment

This application can be deployed in several ways:

#### Cloud Platforms
For deploying this application to cloud platforms, please refer to:
- `deployment_guide.md` - Detailed instructions for deploying to Render
- `alternative_deployment_options.md` - Instructions for other platforms like PythonAnywhere, Heroku, Google Cloud Run, AWS, and DigitalOcean

Key deployment steps:
1. Prepare your application (Procfile, requirements.txt)
2. Push to your Git repository
3. Deploy to your chosen cloud platform
4. Configure environment variables (OPENAI_API_KEY)
5. Install system dependencies (pdftotext)

#### Docker Deployment
For containerized deployment, please refer to `docker_deployment_guide.md`.

The application includes:
- `Dockerfile` - For building a Docker image
- `docker-compose.yml` - For easy local deployment with Docker Compose

To run with Docker Compose:
```bash
docker-compose up --build
```

### 📋 Requirements

- Python 3.8 or higher
- OpenAI API key
- pdftotext utility (part of poppler-utils)
- Other dependencies listed in `requirements.txt`

### 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<a name="polski"></a>
## 🌐 Narzędzie do analizy stron internetowych i plików PDF z wykorzystaniem AI

Site2Data to zaawansowane narzędzie, które analizuje strony internetowe i dokumenty PDF przy użyciu sztucznej inteligencji w celu generowania kompleksowych podsumowań. Aplikacja przeszukuje strony internetowe, wyodrębnia treść tekstową, pobiera pliki PDF i przetwarza je, tworząc zwięzłe podsumowania przy użyciu modelu OpenAI GPT-4o.

### ✨ Funkcje

- 🔍 Przeszukiwanie stron internetowych z regulowaną głębokością
- 📄 Automatyczne wykrywanie i pobieranie plików PDF
- 📊 Ekstrakcja tekstu ze stron internetowych i dokumentów PDF
- 🤖 Podsumowanie treści z wykorzystaniem AI
- 🖼️ Wyodrębnianie obrazów z plików PDF
- 📱 Responsywny interfejs webowy
- 📈 Aktualizacje statusu analizy w czasie rzeczywistym

### 🚀 Instalacja

1. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/arkadiuszfudali/site2data.git
   cd site2data
   ```

2. Utwórz i aktywuj wirtualne środowisko (zalecane):
   ```bash
   python -m venv venv
   # W systemie Windows
   venv\Scripts\activate
   # W systemie macOS/Linux
   source venv/bin/activate
   ```

3. Zainstaluj wymagane zależności:
   ```bash
   pip install -r requirements.txt
   ```

4. Skonfiguruj klucz API OpenAI:
   - Skopiuj plik `.env.example` do `.env`
   - Dodaj swój klucz API OpenAI do pliku `.env`:
     ```
     OPENAI_API_KEY=twój_klucz_api_openai
     ```

5. Zainstaluj pdftotext (wymagane do ekstrakcji tekstu z PDF):
   - W Ubuntu/Debian: `sudo apt-get install poppler-utils`
   - W macOS: `brew install poppler`
   - W Windows: Pobierz i zainstaluj z [Xpdf tools](https://www.xpdfreader.com/download.html)

### 🖥️ Użytkowanie

1. Uruchom aplikację:
   ```bash
   python app.py
   ```

2. Otwórz przeglądarkę internetową i przejdź do `http://127.0.0.1:5000`

3. Wprowadź URL, listę URL-i oddzielonych przecinkami lub ścieżkę do lokalnego pliku/katalogu PDF

4. Kliknij "Analizuj" i poczekaj na wyniki

### 📋 Wymagania

- Python 3.8 lub nowszy
- Klucz API OpenAI
- Narzędzie pdftotext (część pakietu poppler-utils)
- Inne zależności wymienione w pliku `requirements.txt`

### 📄 Licencja

Ten projekt jest objęty licencją MIT - szczegóły znajdują się w pliku LICENSE.
