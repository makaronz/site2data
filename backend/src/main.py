from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Optional
import sqlite3
import json
import PyPDF2
import io
import os
from contextlib import contextmanager
from config.logging import setup_logging

# Konfiguracja loggera
logger = setup_logging()

app = FastAPI(title="Site2Data API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Svelte dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@contextmanager
def get_db():
    """Context manager dla połączeń z bazą danych."""
    conn = sqlite3.connect('scripts.db')
    try:
        conn.row_factory = sqlite3.Row
        yield conn
    finally:
        conn.close()

def init_db():
    """Inicjalizacja bazy danych."""
    try:
        with get_db() as conn:
            c = conn.cursor()
            c.execute('''
                CREATE TABLE IF NOT EXISTS scripts
                (id INTEGER PRIMARY KEY AUTOINCREMENT,
                 filename TEXT NOT NULL,
                 content TEXT NOT NULL,
                 analyzed BOOLEAN NOT NULL DEFAULT 0,
                 analysis TEXT,
                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
            ''')
            conn.commit()
            logger.info("Baza danych zainicjalizowana pomyślnie")
    except Exception as e:
        logger.error(f"Błąd podczas inicjalizacji bazy danych: {str(e)}")
        raise

# Inicjalizacja bazy przy starcie
init_db()

async def extract_pdf_text(file: UploadFile) -> str:
    """
    Ekstrahuje tekst z pliku PDF.
    
    Args:
        file: Plik PDF do przetworzenia
        
    Returns:
        Wyekstrahowany tekst
        
    Raises:
        HTTPException: Gdy wystąpi błąd podczas przetwarzania PDF
    """
    try:
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
            
        return text
    except Exception as e:
        logger.error(f"Błąd podczas ekstrakcji tekstu z PDF: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Nie udało się przetworzyć pliku PDF"
        )

@app.post("/upload")
async def upload_script(file: UploadFile = File(...)):
    """
    Endpoint do przesyłania plików PDF ze scenariuszami.
    
    Args:
        file: Plik PDF do przesłania
        
    Returns:
        Dict z informacjami o przesłanym pliku
        
    Raises:
        HTTPException: Gdy plik nie jest PDFem lub wystąpi błąd
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Dozwolone są tylko pliki PDF"
        )
    
    try:
        text = await extract_pdf_text(file)
        
        with get_db() as conn:
            c = conn.cursor()
            c.execute(
                'INSERT INTO scripts (filename, content, analyzed) VALUES (?, ?, ?)',
                (file.filename, text, False)
            )
            script_id = c.lastrowid
            conn.commit()
            
        logger.info(f"Scenariusz {file.filename} przesłany pomyślnie (ID: {script_id})")
        
        return {
            "id": script_id,
            "message": "Scenariusz przesłany pomyślnie",
            "filename": file.filename
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Błąd podczas przesyłania scenariusza: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Wystąpił błąd podczas przetwarzania pliku"
        )

@app.post("/analyze/{script_id}")
async def analyze_script(script_id: int):
    """
    Endpoint do analizy scenariusza.
    
    Args:
        script_id: ID scenariusza do przeanalizowania
        
    Returns:
        Dict z wynikami analizy
        
    Raises:
        HTTPException: Gdy scenariusz nie istnieje lub wystąpi błąd
    """
    try:
        with get_db() as conn:
            c = conn.cursor()
            c.execute('SELECT * FROM scripts WHERE id = ?', (script_id,))
            script = c.fetchone()
            
            if not script:
                raise HTTPException(
                    status_code=404,
                    detail="Scenariusz nie został znaleziony"
                )
            
            # TODO: Implementacja rzeczywistej logiki analizy
            analysis = {
                "lokacje": {
                    "example_location": {
                        "sceny": ["1", "2"],
                        "charakterystyka": "Example location description",
                        "czas_zdjęciowy": {
                            "szacowany_czas": "2 dni",
                            "uzasadnienie": "Example estimation"
                        },
                        "niezbędność": {
                            "poziom": "WYSOKA",
                            "uzasadnienie": "Key location for the story"
                        },
                        "logistyka": {
                            "dostępność": "No restrictions",
                            "wymagania_specjalne": ["lighting"]
                        }
                    }
                }
            }
            
            c.execute(
                'UPDATE scripts SET analysis = ?, analyzed = ? WHERE id = ?',
                (json.dumps(analysis), True, script_id)
            )
            conn.commit()
            
            logger.info(f"Scenariusz {script_id} przeanalizowany pomyślnie")
            return analysis
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Błąd podczas analizy scenariusza {script_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Wystąpił błąd podczas analizy scenariusza"
        )

@app.get("/scripts")
async def get_scripts():
    """
    Pobiera listę wszystkich scenariuszy.
    
    Returns:
        Lista scenariuszy
        
    Raises:
        HTTPException: Gdy wystąpi błąd podczas pobierania
    """
    try:
        with get_db() as conn:
            c = conn.cursor()
            c.execute('SELECT id, filename, analyzed, created_at FROM scripts')
            scripts = [dict(row) for row in c.fetchall()]
            return scripts
    except Exception as e:
        logger.error(f"Błąd podczas pobierania listy scenariuszy: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Nie udało się pobrać listy scenariuszy"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 