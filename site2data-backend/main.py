from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import json
from typing import Dict
import PyPDF2
import io
import os

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Svelte dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicjalizacja bazy danych SQLite
def init_db():
    conn = sqlite3.connect('scripts.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS scripts
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         filename TEXT NOT NULL,
         content TEXT NOT NULL,
         analyzed BOOLEAN NOT NULL DEFAULT 0,
         analysis TEXT)
    ''')
    conn.commit()
    conn.close()

# Inicjalizacja bazy przy starcie
init_db()

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

@app.post("/upload")
async def upload_script(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Read PDF content
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        
        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        # Save to SQLite
        conn = sqlite3.connect('scripts.db')
        c = conn.cursor()
        c.execute('INSERT INTO scripts (filename, content, analyzed) VALUES (?, ?, ?)',
                 (file.filename, text, False))
        script_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return {
            "id": script_id,
            "message": "Script uploaded successfully",
            "total_pages": len(pdf_reader.pages)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/{script_id}")
async def analyze_script(script_id: int):
    try:
        conn = sqlite3.connect('scripts.db')
        conn.row_factory = dict_factory
        c = conn.cursor()
        
        # Check if script exists
        c.execute('SELECT * FROM scripts WHERE id = ?', (script_id,))
        script = c.fetchone()
        
        if not script:
            conn.close()
            raise HTTPException(status_code=404, detail="Script not found")
        
        # Here you would implement the actual analysis logic
        # For now, we'll return a mock analysis
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
        
        # Update the script with analysis results
        c.execute('UPDATE scripts SET analysis = ?, analyzed = ? WHERE id = ?',
                 (json.dumps(analysis), True, script_id))
        conn.commit()
        conn.close()
        
        return analysis
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 