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
from passlib.context import CryptContext
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security
from datetime import datetime, timedelta
import openai
from dotenv import load_dotenv
import weaviate
from weaviate.classes.init import Auth

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

# JWT config
SECRET_KEY = os.environ.get("JWT_SECRET", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Load env for OpenAI and Weaviate
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
WEAVIATE_URL = os.getenv("WEAVIATE_URL")
WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")

# Initialize Weaviate client
weaviate_client = weaviate.connect_to_weaviate_cloud(
    cluster_url=WEAVIATE_URL,
    auth_credentials=Auth.api_key(WEAVIATE_API_KEY),
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
            # USERS
            c.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            # SCRIPTS
            c.execute('''
                CREATE TABLE IF NOT EXISTS scripts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    filename TEXT NOT NULL,
                    content TEXT NOT NULL,
                    analyzed BOOLEAN NOT NULL DEFAULT 0,
                    analysis TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
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

# --- UTILS ---
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Helper: generate embedding for text
async def generate_embedding(text: str) -> list:
    openai.api_key = OPENAI_API_KEY
    response = openai.Embedding.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response['data'][0]['embedding']

# --- ENDPOINTY ---
@app.post("/register")
async def register(email: str, password: str):
    hashed = get_password_hash(password)
    try:
        with get_db() as conn:
            c = conn.cursor()
            c.execute('INSERT INTO users (email, password_hash) VALUES (?, ?)', (email, hashed))
            conn.commit()
            return {"message": "User registered successfully"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")

@app.post("/login")
async def login(email: str, password: str):
    with get_db() as conn:
        c = conn.cursor()
        c.execute('SELECT id, password_hash FROM users WHERE email = ?', (email,))
        user = c.fetchone()
        if not user or not verify_password(password, user[1]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_access_token({"sub": str(user[0])})
        return {"access_token": token, "token_type": "bearer"}

@app.post("/upload")
async def upload_script(file: UploadFile = File(...), user_id: int = Depends(get_current_user)):
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
        # Generate embedding
        embedding = await generate_embedding(text)
        with get_db() as conn:
            c = conn.cursor()
            c.execute(
                'INSERT INTO scripts (user_id, filename, content, analyzed) VALUES (?, ?, ?, ?)',
                (user_id, file.filename, text, False)
            )
            script_id = c.lastrowid
            conn.commit()
        # Save to Weaviate
        weaviate_client.batch.add_data_object({
            "user_id": user_id,
            "script_id": script_id,
            "title": file.filename,
            "text": text,
            "embedding": embedding
        }, "Script")
        weaviate_client.batch.flush()
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
async def get_scripts(user_id: int = Depends(get_current_user)):
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
            c.execute('SELECT id, filename, analyzed, created_at FROM scripts WHERE user_id = ?', (user_id,))
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