import os
import asyncio
from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from main import crawl_website, process_pdfs, generate_summary, extract_text_from_html, convert_pdf_to_text
import requests
from autogen_ext.models.openai import OpenAIChatCompletionClient
from dotenv import load_dotenv
from flask_cors import CORS
from production_docs import process_production_docs, ProductionDocsManager
from media_processor import process_media_files, MediaProcessor
from werkzeug.utils import secure_filename
import logging
from datetime import datetime
from config.logging import setup_logging
from script_analysis.basic_analyzer import BasicAnalyzer
from script_analysis.sentiment_analyzer import SentimentAnalyzer
from script_analysis.structure_analyzer import StructureAnalyzer
from utils.memory_manager import MemoryManager, BatchProcessor
from utils.queue_manager import QueueManager
from utils.cache_manager import CacheManager
import time

# Załaduj zmienne środowiskowe z pliku .env
load_dotenv()

# Configure logging
logger = setup_logging()

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

@app.before_request
def log_request_info():
    """Logowanie informacji o żądaniu przed jego przetworzeniem."""
    logger.info(f"Request: {request.method} {request.url}")
    logger.debug(f"Headers: {request.headers}")
    logger.debug(f"Body: {request.get_data()}")

@app.after_request
def log_response_info(response):
    """Logowanie informacji o odpowiedzi."""
    logger.info(f"Response status: {response.status}")
    logger.debug(f"Response headers: {response.headers}")
    return response

@app.errorhandler(Exception)
def handle_error(error):
    """Globalny handler błędów."""
    logger.error(f"Error: {str(error)}", exc_info=True)
    return jsonify({
        "error": str(error),
        "type": error.__class__.__name__
    }), 500

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
    asyncio.run(process_input(user_inputs, form_api_api_key, download_pdfs, crawl_depth))
    
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

@app.route("/api/health", methods=["GET"])
def health_check():
    """Endpoint sprawdzający stan aplikacji."""
    return jsonify({"status": "healthy"})

@app.route("/api/analyze-script", methods=["POST"])
def analyze_script():
    """Endpoint do analizy scenariusza."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Analiza scenariusza
        logger.info(f"Starting script analysis for file: {file.filename}")
        # Tu dodać właściwą implementację analizy
        
        return jsonify({"message": "Analysis completed"})
    
    except Exception as e:
        logger.error(f"Error during script analysis: {str(e)}", exc_info=True)
        raise

@app.route("/api/process-media", methods=["POST"])
def process_media():
    """Endpoint do przetwarzania mediów."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Przetwarzanie mediów
        logger.info(f"Starting media processing for file: {file.filename}")
        result = media_processor.process_file(file)
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error during media processing: {str(e)}", exc_info=True)
        raise

@app.route("/api/analyze-script/full", methods=["POST"])
@memory_manager.monitor_memory(threshold_mb=500)
def analyze_script_full():
    """Full script analysis endpoint combining all analyzers."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
            
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400
            
        if file and allowed_file(file.filename):
            # Read file content
            script_text = file.read().decode('utf-8')
            
            # Check cache
            cached_result = cache_manager.get(script_text)
            if cached_result:
                return jsonify(cached_result), 200
                
            # Add analysis tasks to queue
            basic_task_id = queue_manager.add_task(script_text, 'basic')
            
            # Wait for basic analysis to complete
            while True:
                basic_status = queue_manager.get_task_status(basic_task_id)
                if basic_status['status'] in ['completed', 'failed']:
                    break
                time.sleep(1)
                
            if basic_status['status'] == 'failed':
                return jsonify({
                    'success': False,
                    'error': basic_status['error']
                }), 500
                
            # Add sentiment and structure analysis tasks
            sentiment_task_id = queue_manager.add_task(script_text, 'sentiment')
            structure_task_id = queue_manager.add_task(script_text, 'structure')
            
            # Wait for all analyses to complete
            all_results = {
                'basic': basic_status['result']
            }
            
            for task_id in [sentiment_task_id, structure_task_id]:
                while True:
                    status = queue_manager.get_task_status(task_id)
                    if status['status'] == 'completed':
                        all_results[status['result']['type']] = status['result']
                        break
                    elif status['status'] == 'failed':
                        logger.error(f"Analysis failed: {status['error']}")
                        break
                    time.sleep(1)
                    
            # Cache results
            cache_manager.set(script_text, all_results)
            
            return jsonify({
                'success': True,
                'data': all_results
            }), 200
            
    except Exception as e:
        logger.error(f"Error during script analysis: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error during script analysis',
            'error': str(e)
        }), 500

@app.route("/api/analyze-script/basic", methods=["POST"])
def analyze_script_basic():
    """Basic script analysis endpoint."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
            
        file = request.files["file"]
        script_text = file.read().decode('utf-8')
        
        analyzer = BasicAnalyzer()
        result = analyzer.parse_script(script_text)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error during basic analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route("/api/analyze-script/sentiment", methods=["POST"])
def analyze_script_sentiment():
    """Sentiment analysis endpoint."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
            
        file = request.files["file"]
        script_text = file.read().decode('utf-8')
        
        # First do basic analysis to get dialogues
        basic_analyzer = BasicAnalyzer()
        basic_result = basic_analyzer.parse_script(script_text)
        
        # Then analyze sentiment
        sentiment_analyzer = SentimentAnalyzer()
        sentiment_result = sentiment_analyzer.analyze_character_emotions(
            basic_result['dialogues']
        )
        
        return jsonify({
            'success': True,
            'data': sentiment_result
        }), 200
        
    except Exception as e:
        logger.error(f"Error during sentiment analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route("/api/analyze-script/structure", methods=["POST"])
def analyze_script_structure():
    """Structure analysis endpoint."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
            
        file = request.files["file"]
        script_text = file.read().decode('utf-8')
        
        # First do basic analysis
        basic_analyzer = BasicAnalyzer()
        basic_result = basic_analyzer.parse_script(script_text)
        
        # Then analyze structure
        structure_analyzer = StructureAnalyzer()
        structure_result = structure_analyzer.analyze_structure(
            basic_result['scenes'],
            basic_result['dialogues']
        )
        
        return jsonify({
            'success': True,
            'data': structure_result
        }), 200
        
    except Exception as e:
        logger.error(f"Error during structure analysis: {str(e)}")
        return jsonify({
            'success': False,
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
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") == "development"
    
    logger.info(f"Starting application on port {port} (debug={debug})")
    app.run(host="0.0.0.0", port=port, debug=debug)
