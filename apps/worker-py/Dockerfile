# apps/worker-py/Dockerfile
FROM python:3.9-slim

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie pliku z zależnościami
# Upewnij się, że plik requirements.txt istnieje w apps/worker-py/
COPY requirements.txt requirements.txt

# Instalacja zależności
RUN pip install --no-cache-dir -r requirements.txt

# Kopiowanie reszty kodu aplikacji
COPY . .

# Komenda do uruchomienia workera
# Załóżmy, że główny plik to worker.py
CMD ["python", "src/main.py"]
# Lub jeśli główny plik to main.py: CMD ["python", "main.py"] 