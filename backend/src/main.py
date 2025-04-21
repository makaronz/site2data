import asyncio
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient
import requests
from bs4 import BeautifulSoup
import os
import subprocess
import textwrap
from dotenv import load_dotenv
import json
import sys
from media_processor import MediaProcessor
from production_docs import ProductionDocsManager
from typing import Dict, Any

# Załaduj zmienne środowiskowe z pliku .env
load_dotenv()

def extract_text_from_html(html_content):
    """Ekstrahuje tekst ze strony HTML usuwając tagi."""
    soup = BeautifulSoup(html_content, 'html.parser')
    # Usuń skrypty, style i inne niepotrzebne elementy
    for script in soup(["script", "style", "meta", "noscript", "header", "footer"]):
        script.extract()
    # Pobierz tekst
    text = soup.get_text(separator=' ', strip=True)
    # Usuń nadmiarowe białe znaki
    text = ' '.join(text.split())
    return text

async def generate_summary(text, model_client, source_info=""):
    """Generuje podsumowanie tekstu używając dostarczonego promptu."""
    assistant = AssistantAgent("content_analyzer", model_client=model_client)
    prompt = """
    Jesteś specjalistycznym asystentem AI, którego zadaniem jest tworzenie zwięzłych, ale kompleksowych podsumowań treści stron internetowych i dokumentów PDF. Twoje podsumowania będą używane jako baza wiedzy dla innego zaawansowanego modelu językowego.

    **Krok 1: Określenie dziedziny**
    Przeanalizuj poniższy tekst i **samodzielnie** określ, jakiej dziedziny on dotyczy. Nazwij tę dziedzinę w jednym lub kilku słowach.

    **Krok 2: Przyjęcie roli eksperta**
    Po określeniu dziedziny, przyjmij rolę eksperta w tej dziedzinie. Twoje podsumowanie powinno być napisane z perspektywy eksperta, uwzględniając specyfikę terminologii, kluczowe zagadnienia i standardy branżowe.

    **Krok 3: Analiza i podsumowanie**
    Twoim celem jest stworzenie podsumowania, które:
    1. **Zawiera wszystkie kluczowe informacje:** Uwzględnij wszystkie istotne fakty, dane, argumenty, wnioski i rekomendacje.
    2. **Jest zwięzłe i treściwe:** Podsumowanie powinno być jak najkrótsze, ale bez utraty istotnych informacji.
    3. **Jest napisane profesjonalnym, formalnym językiem:** Używaj pełnych zdań, unikaj żargonu i skrótów myślowych. Pisz w sposób obiektywny i bezstronny.
    4. **Jest zrozumiałe dla innego modelu AI:** Pamiętaj, że Twoje podsumowanie będzie czytane przez inny model językowy, a nie przez człowieka. Używaj jasnych i precyzyjnych sformułowań.
    5. **Jest oparte *wyłącznie* na dostarczonym tekście:** Nie wprowadzaj żadnych informacji, które nie znajdują się w oryginalnym tekście.
    6. **Zachowuje strukturę logiczną:** Podsumowanie powinno być spójne i logicznie uporządkowane.
    7. **Koncentruje się na głównym temacie:** Podkreśl najważniejsze punkty i pomiń nieistotne szczegóły.

    Poniżej znajduje się tekst do analizy:
    [TEKST]
    """
    
    # Zastąp [TEKST] rzeczywistym tekstem
    prompt = prompt.replace("[TEKST]", text)
    
    print(f"Generowanie podsumowania dla {source_info}...")
    response = await assistant.run(task=prompt)
    return response.content[0].text

async def crawl_website(url, output_dir, model_client=None, max_depth=1, current_depth=0, visited_urls=None, download_pdfs=True):
    """Recursively crawls a website, downloads PDFs, extracts links, and analyzes page content."""
    if visited_urls is None:
        visited_urls = set()

    if current_depth > max_depth or url in visited_urls:
        return [], visited_urls

    print(f"Crawling: {url} (depth {current_depth})")
    visited_urls.add(url)
    downloaded_files = []

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error crawling {url}: {e}")
        return [], visited_urls

    soup = BeautifulSoup(response.text, 'html.parser')

    # Ekstrakcja i analiza treści strony
    if model_client:
        # Ekstrakcja tekstu ze strony
        page_text = extract_text_from_html(response.text)
        
        # Zapisz oryginalny tekst do wspólnego pliku markdown
        os.makedirs(output_dir, exist_ok=True)
        all_pages_filepath = os.path.join(output_dir, "all_pages.md")
        with open(all_pages_filepath, 'a', encoding='utf-8') as f:
            f.write(f"# URL: {url}\n\n{page_text}\n\n---\n\n")
        print(f"Dodano treść strony {url} do {all_pages_filepath}")
        
        # Generuj podsumowanie
        if page_text and len(page_text) > 100:  # Tylko jeśli jest wystarczająco dużo tekstu
            try:
                summary = await generate_summary(page_text, model_client, f"strony {url}")
                
                # Zapisz podsumowanie do wspólnego pliku markdown
                all_summaries_filepath = os.path.join(output_dir, "all_summaries.md")
                with open(all_summaries_filepath, 'a', encoding='utf-8') as f:
                    f.write(f"# URL: {url}\n\n## PODSUMOWANIE:\n\n{summary}\n\n---\n\n")
                
                print(f"Wygenerowano podsumowanie dla strony {url}")
            except Exception as e:
                print(f"Błąd generowania podsumowania dla {url}: {e}")

    # Download PDFs if enabled
    downloaded_files = []
    if download_pdfs:
        pdf_links = [a.get('href') for a in soup.find_all('a', href=True) if a.get('href') and a.get('href').lower().endswith('.pdf')]

        print(f"Znalezione linki PDF na {url}: {pdf_links}")

        for link in pdf_links:
            if not link.startswith('http'):
                link = requests.compat.urljoin(url, link) # Bezwzględny URL
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                pdf_response = requests.get(link, headers=headers)
                pdf_response.raise_for_status()

                filename = os.path.basename(link)
                filepath = os.path.join(output_dir, filename)

                os.makedirs(output_dir, exist_ok=True)
                with open(filepath, 'wb') as f:
                    f.write(pdf_response.content)
                downloaded_files.append(filepath)
                print(f"Downloaded PDF: {filename}")

            except requests.exceptions.RequestException as e:
                print(f"Error downloading {link}: {e}")
    else:
        print(f"Pomijanie pobierania plików PDF dla {url} (opcja wyłączona)")

    # Recursively crawl links, up to max_depth
    if current_depth < max_depth:
        links = [a['href'] for a in soup.find_all('a', href=True)]
        for link in links:
            if not link.startswith('http'):
                link = requests.compat.urljoin(url, link)
            # Check if the link is in the same domain
            if requests.compat.urlparse(link).netloc == requests.compat.urlparse(url).netloc:
                new_files, new_visited_urls = await crawl_website(link, output_dir, model_client, max_depth, current_depth + 1, visited_urls, download_pdfs)
                downloaded_files.extend(new_files)
                visited_urls.update(new_visited_urls)

    return downloaded_files, visited_urls

def convert_pdf_to_text(pdf_path, text_path):
    """Converts a PDF file to text using pdftotext."""
    try:
        subprocess.run(['pdftotext', pdf_path, text_path], check=True)
        print(f"Converted {pdf_path} to {text_path}")
    except subprocess.CalledProcessError:
        print(f"Error converting {pdf_path} to text. pdftotext may not be installed or configured correctly.")
        return False
    return True

async def process_pdfs(pdf_paths, model_client, output_dir="downloaded_content"):
    """Processes a list of PDF files, extracting text and analyzing it."""
    for pdf_path in pdf_paths:
        text_path = pdf_path.replace('.pdf', '.txt')
        if convert_pdf_to_text(pdf_path, text_path):
            try:
                with open(text_path, 'r', encoding='utf-8') as f:
                    text_content = f.read()
                
                # Używamy funkcji generate_summary do tworzenia podsumowania
                summary = await generate_summary(text_content, model_client, f"pliku PDF {pdf_path}")
                
                # Zapisz podsumowanie jako PDF
                from fpdf import FPDF
                import re
                
                # Wyodrębnij obrazy z pliku PDF
                try:
                    from PyPDF2 import PdfReader
                    from PIL import Image
                    import io
                    import fitz  # PyMuPDF
                    
                    # Ścieżka do katalogu na obrazy
                    images_dir = os.path.join(output_dir, "images")
                    os.makedirs(images_dir, exist_ok=True)
                    
                    # Wyodrębnij obrazy z PDF
                    pdf_images = []
                    pdf_document = fitz.open(pdf_path)
                    
                    for page_num in range(len(pdf_document)):
                        page = pdf_document[page_num]
                        image_list = page.get_images(full=True)
                        
                        for img_index, img in enumerate(image_list):
                            xref = img[0]
                            base_image = pdf_document.extract_image(xref)
                            image_bytes = base_image["image"]
                            
                            # Zapisz obraz
                            image_filename = f"{os.path.basename(pdf_path)}_page{page_num+1}_img{img_index+1}.png"
                            image_path = os.path.join(images_dir, image_filename)
                            
                            with open(image_path, "wb") as img_file:
                                img_file.write(image_bytes)
                            
                            pdf_images.append(image_path)
                    
                    # Utwórz PDF z podsumowaniem i obrazami
                    pdf = FPDF()
                    pdf.add_page()
                    pdf.set_font("Arial", size=12)
                    
                    # Dodaj tytuł
                    pdf.set_font("Arial", 'B', 16)
                    pdf.cell(200, 10, txt=f"Podsumowanie pliku: {os.path.basename(pdf_path)}", ln=True, align='C')
                    pdf.ln(10)
                    
                    # Dodaj podsumowanie
                    pdf.set_font("Arial", size=12)
                    
                    # Podziel tekst na akapity i dodaj do PDF
                    paragraphs = summary.split('\n\n')
                    for paragraph in paragraphs:
                        # Podziel długie akapity na mniejsze fragmenty
                        lines = textwrap.wrap(paragraph, width=80)
                        for line in lines:
                            pdf.multi_cell(0, 10, txt=line)
                        pdf.ln(5)
                    
                    # Dodaj obrazy
                    if pdf_images:
                        pdf.add_page()
                        pdf.set_font("Arial", 'B', 14)
                        pdf.cell(200, 10, txt="Obrazy z dokumentu:", ln=True)
                        pdf.ln(5)
                        
                        for img_path in pdf_images:
                            try:
                                # Sprawdź rozmiar obrazu
                                img = Image.open(img_path)
                                width, height = img.size
                                
                                # Skaluj obraz, jeśli jest za duży
                                max_width = 180
                                max_height = 180
                                
                                if width > max_width or height > max_height:
                                    ratio = min(max_width/width, max_height/height)
                                    new_width = width * ratio
                                    new_height = height * ratio
                                else:
                                    new_width = width
                                    new_height = height
                                
                                # Dodaj obraz do PDF
                                pdf.image(img_path, x=10, y=pdf.get_y(), w=new_width)
                                pdf.ln(new_height + 10)  # Dodaj odstęp po obrazie
                            except Exception as e:
                                print(f"Błąd dodawania obrazu {img_path}: {e}")
                    
                    # Zapisz PDF
                    summary_pdf_path = pdf_path.replace('.pdf', '_summary.pdf')
                    pdf.output(summary_pdf_path)
                    print(f"Zapisano podsumowanie z obrazami do {summary_pdf_path}")
                    
                except ImportError as e:
                    print(f"Nie można utworzyć PDF z obrazami: {e}. Zapisywanie jako zwykły plik tekstowy.")
                    # Zapisz podsumowanie jako zwykły plik tekstowy
                    summary_path = pdf_path.replace('.pdf', '_summary.txt')
                    with open(summary_path, 'w', encoding='utf-8') as f:
                        f.write(f"PODSUMOWANIE PLIKU: {pdf_path}\n\n{summary}")
                except Exception as e:
                    print(f"Błąd podczas tworzenia PDF: {e}. Zapisywanie jako zwykły plik tekstowy.")
                    # Zapisz podsumowanie jako zwykły plik tekstowy
                    summary_path = pdf_path.replace('.pdf', '_summary.txt')
                    with open(summary_path, 'w', encoding='utf-8') as f:
                        f.write(f"PODSUMOWANIE PLIKU: {pdf_path}\n\n{summary}")
                
                print(f"Wygenerowano podsumowanie dla {pdf_path}")
                
            except Exception as e:
                print(f"Błąd przetwarzania lub analizy {text_path}: {e}")
        else:
            print(f"Pomijanie analizy {pdf_path} z powodu błędu konwersji.")

async def process_media_file(file_path: str, model_client, output_dir: str = "downloaded_content"):
    """Process media file (video or image) and generate analysis."""
    try:
        media_processor = MediaProcessor(output_dir)
        docs_manager = ProductionDocsManager()
        
        # Check file type
        if file_path.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
            # Process video
            report = media_processor.process_video(file_path)
            
            # Generate summary using AI
            summary = await generate_summary(
                json.dumps(report, indent=2),
                model_client,
                f"pliku wideo {file_path}"
            )
            
            # Save summary
            summary_path = os.path.join(output_dir, "media_summary.md")
            with open(summary_path, 'w', encoding='utf-8') as f:
                f.write(f"# Analiza pliku wideo: {os.path.basename(file_path)}\n\n")
                f.write(f"## Podsumowanie AI:\n\n{summary}\n\n")
                f.write(f"## Szczegółowa analiza:\n\n{json.dumps(report, indent=2)}")
            
            # Add to production documentation
            doc_result = docs_manager.add_document(
                content=summary,
                doc_type="video_analysis",
                metadata={
                    "file_path": file_path,
                    "tags": report.get("summary_tags", []),
                    "scene_changes": report.get("scene_changes", []),
                    "metadata": report.get("metadata", {})
                }
            )
            
            if doc_result.get("success"):
                docs_manager.link_media_to_docs(file_path, [doc_result["doc_id"]])
            
            return report, summary
            
        elif file_path.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
            # Process single image
            analysis = media_processor.analyze_frame(file_path)
            tags = media_processor.generate_tags(file_path)
            mood = media_processor.analyze_scene_mood(file_path)
            objects = media_processor.detect_objects(file_path)
            
            # Generate summary using AI
            summary = await generate_summary(
                json.dumps({
                    **analysis,
                    "tags": tags,
                    "mood": mood,
                    "objects": objects
                }, indent=2),
                model_client,
                f"pliku obrazu {file_path}"
            )
            
            # Save summary
            summary_path = os.path.join(output_dir, "image_summary.md")
            with open(summary_path, 'w', encoding='utf-8') as f:
                f.write(f"# Analiza obrazu: {os.path.basename(file_path)}\n\n")
                f.write(f"## Podsumowanie AI:\n\n{summary}\n\n")
                f.write(f"## Szczegółowa analiza:\n\n{json.dumps(analysis, indent=2)}")
            
            # Add to production documentation
            doc_result = docs_manager.add_document(
                content=summary,
                doc_type="image_analysis",
                metadata={
                    "file_path": file_path,
                    "tags": tags,
                    "mood": mood,
                    "objects": objects
                }
            )
            
            if doc_result.get("success"):
                docs_manager.link_media_to_docs(file_path, [doc_result["doc_id"]])
            
            return analysis, summary
            
    except Exception as e:
        print(f"Error processing media file {file_path}: {e}")
        return {}, ""

async def query_production_docs(query: str) -> Dict[str, Any]:
    """Query the production documentation system."""
    try:
        docs_manager = ProductionDocsManager()
        return docs_manager.query_docs(query)
    except Exception as e:
        print(f"Error querying production docs: {e}")
        return {"error": str(e)}

async def main() -> None:
    # Użyj klucza API OpenAI z zmiennych środowiskowych
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("Błąd: Brak klucza API OpenAI. Sprawdź plik .env.")
        return
        
    model_client = OpenAIChatCompletionClient(model="gpt-4o", api_key=api_key)

    # Get URLs or local paths from the user
    user_input = input("Enter a URL, a comma-separated list of URLs, or a path to a local PDF file/directory: ")
    user_inputs = [u.strip() for u in user_input.split(',')]
    
    # Pytanie o pobieranie PDF
    download_pdfs_input = input("Czy pobierać i analizować pliki PDF? (tak/nie): ").lower()
    download_pdfs = download_pdfs_input in ['tak', 't', 'yes', 'y', '']  # Domyślnie tak, jeśli pusty input
    
    # Pytanie o głębokość crawlowania
    crawl_depth_input = input("Podaj głębokość crawlowania (1-5, domyślnie 1): ")
    try:
        crawl_depth = int(crawl_depth_input) if crawl_depth_input.strip() else 1
        # Ograniczenie głębokości do zakresu 1-5
        crawl_depth = max(1, min(5, crawl_depth))
    except ValueError:
        crawl_depth = 1
    print(f"Ustawiona głębokość crawlowania: {crawl_depth}")

    pdf_paths = []
    all_visited_urls = set()
    
    # Utworzenie katalogu na pobrane treści
    output_dir = "downloaded_content"
    os.makedirs(output_dir, exist_ok=True)

    for item in user_inputs:
        if item.startswith('http'):
            # It's a URL, crawl the website
            print(f"Crawling website: {item}...")
            downloaded_pdfs, visited_urls = await crawl_website(item, output_dir, model_client, max_depth=crawl_depth, download_pdfs=download_pdfs)
            if download_pdfs:
                pdf_paths.extend(downloaded_pdfs)
            all_visited_urls.update(visited_urls)
        elif os.path.isdir(item):
            # It's a directory, process all PDFs in it
            print(f"Processing PDFs in directory {item}...")
            for filename in os.listdir(item):
                if filename.lower().endswith('.pdf'):
                    pdf_paths.append(os.path.join(item, filename))
        elif os.path.isfile(item) and item.lower().endswith('.pdf'):
            # It's a single PDF file
            print(f"Processing PDF file {item}...")
            pdf_paths.append(item)
        else:
            print(f"Invalid input: {item}.  Skipping.")

    if pdf_paths:
        await process_pdfs(pdf_paths, model_client)
    else:
        print("No valid PDF files or URLs provided.")

    print("\nVisited URLs:")
    for url in all_visited_urls:
        print(url)
        
    await model_client.close()

    # Add media processing example
    if len(sys.argv) > 1 and sys.argv[1] == "--process-media":
        if len(sys.argv) < 3:
            print("Please provide a media file path")
            return
        
        media_file = sys.argv[2]
        if not os.path.exists(media_file):
            print(f"File not found: {media_file}")
            return
        
        report, summary = await process_media_file(media_file, model_client)
        print(f"Media analysis completed. Summary saved to downloaded_content/media_summary.md")

    # Add production docs query example
    if len(sys.argv) > 1 and sys.argv[1] == "--query-docs":
        if len(sys.argv) < 3:
            print("Please provide a query")
            return
        
        query = " ".join(sys.argv[2:])
        result = await query_production_docs(query)
        print(f"Query result: {json.dumps(result, indent=2)}")

if __name__ == "__main__":
    asyncio.run(main())
