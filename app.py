import os
import asyncio
from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from main import crawl_website, process_pdfs, generate_summary, extract_text_from_html, convert_pdf_to_text
import requests
from autogen_ext.models.openai import OpenAIChatCompletionClient
from dotenv import load_dotenv
from flask_cors import CORS
from production_docs import process_production_docs
from media_processor import process_media_files
from werkzeug.utils import secure_filename
import logging
from datetime import datetime

# Załaduj zmienne środowiskowe z pliku .env
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Potrzebne do obsługi sesji
CORS(app)

# Klucz API OpenAI z zmiennych środowiskowych
API_KEY = os.getenv("OPENAI_API_KEY")

# Katalog na pobrane treści
OUTPUT_DIR = "downloaded_content"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Globalna zmienna do przechowywania wyników
results = {
    "urls_visited": set(),
    "pdfs_downloaded": [],
    "summaries": []
}

# Configure upload folders
UPLOAD_FOLDER = 'uploaded_files'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Strona główna z formularzem."""
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    """Przetwarza formularz i uruchamia analizę."""
    # Pobierz dane z formularza
    user_input = request.form.get('input', '')
    user_inputs = [u.strip() for u in user_input.split(',')]
    
    # Pobierz klucz API z formularza (jeśli podany)
    form_api_key = request.form.get('api_key', '')
    
    # Pobierz opcję pobierania PDF
    download_pdfs = 'download_pdfs' in request.form
    
    # Pobierz głębokość crawlowania
    try:
        crawl_depth = int(request.form.get('crawl_depth', '1'))
        # Ograniczenie głębokości do zakresu 1-5
        crawl_depth = max(1, min(5, crawl_depth))
    except ValueError:
        crawl_depth = 1
    
    # Zapisz dane wejściowe w sesji
    session['user_input'] = user_input
    session['download_pdfs'] = download_pdfs
    session['crawl_depth'] = crawl_depth
    
    # Uruchom analizę asynchronicznie
    asyncio.run(process_input(user_inputs, form_api_key, download_pdfs, crawl_depth))
    
    # Przekieruj do strony wyników
    return redirect(url_for('results_page'))

@app.route('/results')
def results_page():
    """Wyświetla wyniki analizy."""
    user_input = session.get('user_input', '')
    return render_template('results.html', 
                          user_input=user_input,
                          urls_visited=list(results["urls_visited"]),
                          pdfs_downloaded=results["pdfs_downloaded"],
                          summaries=results["summaries"])

@app.route('/api/status')
def status():
    """Zwraca aktualny status analizy."""
    return jsonify({
        "urls_visited": len(results["urls_visited"]),
        "pdfs_downloaded": len(results["pdfs_downloaded"]),
        "summaries": len(results["summaries"])
    })

@app.route('/api/parse-script', methods=['POST'])
def parse_script():
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'Nie przesłano pliku'
            }), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'Nie wybrano pliku'
            }), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_filename = f"{timestamp}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(filepath)

            # Import ScriptController dynamically to avoid circular imports
            from controllers.script_controller import ScriptController
            script_controller = ScriptController()
            
            result = script_controller.parse_script(filepath)
            
            # Usuń plik po przetworzeniu
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'message': 'Scenariusz został pomyślnie sparsowany',
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Niedozwolony typ pliku'
            }), 400

    except Exception as e:
        logger.error(f"Błąd podczas parsowania scenariusza: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Wystąpił błąd podczas parsowania scenariusza',
            'error': str(e)
        }), 500

@app.route('/api/scripts', methods=['GET'])
def get_scripts():
    try:
        from controllers.script_controller import ScriptController
        script_controller = ScriptController()
        return script_controller.get_scripts()
    except Exception as e:
        logger.error(f"Błąd podczas pobierania scenariuszy: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Wystąpił błąd podczas pobierania scenariuszy',
            'error': str(e)
        }), 500

@app.route('/api/scripts/<script_id>', methods=['GET'])
def get_script(script_id):
    try:
        from controllers.script_controller import ScriptController
        script_controller = ScriptController()
        return script_controller.get_script_by_id(script_id)
    except Exception as e:
        logger.error(f"Błąd podczas pobierania scenariusza: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Wystąpił błąd podczas pobierania scenariusza',
            'error': str(e)
        }), 500

@app.route('/api/scripts/<script_id>', methods=['PUT'])
def update_script(script_id):
    try:
        from controllers.script_controller import ScriptController
        script_controller = ScriptController()
        return script_controller.update_script(script_id, request.json)
    except Exception as e:
        logger.error(f"Błąd podczas aktualizacji scenariusza: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Wystąpił błąd podczas aktualizacji scenariusza',
            'error': str(e)
        }), 500

@app.route('/api/scripts/<script_id>', methods=['DELETE'])
def delete_script(script_id):
    try:
        from controllers.script_controller import ScriptController
        script_controller = ScriptController()
        return script_controller.delete_script(script_id)
    except Exception as e:
        logger.error(f"Błąd podczas usuwania scenariusza: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Wystąpił błąd podczas usuwania scenariusza',
            'error': str(e)
        }), 500

@app.route('/api/scripts/<script_id>/statistics', methods=['GET'])
def get_script_statistics(script_id):
    try:
        from controllers.script_controller import ScriptController
        script_controller = ScriptController()
        return script_controller.get_script_statistics(script_id)
    except Exception as e:
        logger.error(f"Błąd podczas pobierania statystyk: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Wystąpił błąd podczas pobierania statystyk',
            'error': str(e)
        }), 500

async def process_input(user_inputs, form_api_key=None, download_pdfs=True, crawl_depth=1):
    """Przetwarza dane wejściowe i uruchamia analizę."""
    # Wyczyść poprzednie wyniki
    results["urls_visited"] = set()
    results["pdfs_downloaded"] = []
    results["summaries"] = []
    
    # Użyj klucza API z formularza, jeśli został podany, w przeciwnym razie użyj klucza z .env
    api_key = form_api_key if form_api_key else API_KEY
    
    if not api_key:
        return render_template('error.html', error="Brak klucza API OpenAI. Wprowadź klucz w formularzu lub skonfiguruj plik .env.")
    
    # Inicjalizuj klienta modelu
    model_client = OpenAIChatCompletionClient(model="gpt-4o", api_key=api_key)
    
    pdf_paths = []
    
    # Wyczyść pliki markdown przed rozpoczęciem nowej analizy
    all_pages_filepath = os.path.join(OUTPUT_DIR, "all_pages.md")
    all_summaries_filepath = os.path.join(OUTPUT_DIR, "all_summaries.md")
    
    # Usuń istniejące pliki markdown, jeśli istnieją
    if os.path.exists(all_pages_filepath):
        os.remove(all_pages_filepath)
    if os.path.exists(all_summaries_filepath):
        os.remove(all_summaries_filepath)
    
    for item in user_inputs:
        if item.startswith('http'):
            # To URL, crawluj stronę
            downloaded_pdfs, visited_urls = await crawl_website(item, OUTPUT_DIR, model_client, max_depth=crawl_depth, download_pdfs=download_pdfs)
            if download_pdfs:
                pdf_paths.extend(downloaded_pdfs)
                results["pdfs_downloaded"].extend(downloaded_pdfs)
            results["urls_visited"].update(visited_urls)
            
            # Dodaj podsumowania stron do wyników
            if os.path.exists(all_summaries_filepath):
                with open(all_summaries_filepath, 'r', encoding='utf-8') as f:
                    summaries_content = f.read()
                
                # Dodaj podsumowanie do wyników
                results["summaries"].append({
                    "source": "Wszystkie strony",
                    "type": "webpage",
                    "content": summaries_content
                })
                
        elif os.path.isdir(item):
            # To katalog, przetwórz wszystkie PDF-y w nim
            for filename in os.listdir(item):
                if filename.lower().endswith('.pdf'):
                    pdf_path = os.path.join(item, filename)
                    pdf_paths.append(pdf_path)
                    results["pdfs_downloaded"].append(pdf_path)
                    
        elif os.path.isfile(item) and item.lower().endswith('.pdf'):
            # To pojedynczy plik PDF
            pdf_paths.append(item)
            results["pdfs_downloaded"].append(item)
            
    # Przetwórz pliki PDF
    if pdf_paths:
        await process_pdfs_for_web(pdf_paths, model_client)
        
    await model_client.close()

async def process_pdfs_for_web(pdf_paths, model_client):
    """Przetwarza pliki PDF i dodaje podsumowania do wyników."""
    # Przekazujemy funkcję process_pdfs z main.py
    await process_pdfs(pdf_paths, model_client, OUTPUT_DIR)
    
    # Dodajemy podsumowania do wyników
    for pdf_path in pdf_paths:
        summary_pdf_path = pdf_path.replace('.pdf', '_summary.pdf')
        summary_txt_path = pdf_path.replace('.pdf', '_summary.txt')
        
        # Sprawdź, czy istnieje podsumowanie PDF
        if os.path.exists(summary_pdf_path):
            # Dodaj podsumowanie do wyników
            results["summaries"].append({
                "source": pdf_path,
                "type": "pdf",
                "content": f"Podsumowanie dostępne jako PDF: {os.path.basename(summary_pdf_path)}"
            })
        # Jeśli nie ma PDF, sprawdź czy jest podsumowanie tekstowe
        elif os.path.exists(summary_txt_path):
            try:
                with open(summary_txt_path, 'r', encoding='utf-8') as f:
                    summary_content = f.read()
                
                # Dodaj podsumowanie do wyników
                results["summaries"].append({
                    "source": pdf_path,
                    "type": "pdf",
                    "content": summary_content
                })
            except Exception as e:
                print(f"Błąd odczytu podsumowania {summary_txt_path}: {e}")
        else:
            print(f"Nie znaleziono podsumowania dla {pdf_path}")

if __name__ == '__main__':
    app.run(debug=True)
