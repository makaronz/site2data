import dotenv from 'dotenv';
import path from 'path';

// Wczytaj zmienne środowiskowe
dotenv.config();

console.log('Testowanie wczytywania zmiennych środowiskowych:');

// Sprawdź ścieżkę do pliku .env
const envPath = path.resolve(process.cwd(), '.env');
console.log('Ścieżka do pliku .env:', envPath);

// Sprawdź, czy zmienne zostały wczytane
console.log('PORT:', process.env.PORT);

// Sprawdź klucz API OpenAI
const apiKey = process.env.OPENAI_API_KEY;
if (apiKey) {
  console.log('OPENAI_API_KEY:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));
} else {
  console.error('BŁĄD: Brak klucza API OpenAI!');
}

// Wypisz wszystkie zmienne środowiskowe
console.log('\nWszystkie zmienne środowiskowe:');
Object.keys(process.env).forEach(key => {
  if (key === 'OPENAI_API_KEY') {
    const value = process.env[key] || '';
    console.log(`${key}: ${value.substring(0, 10)}...${value.substring(value.length - 5)}`);
  } else {
    console.log(`${key}: ${process.env[key]}`);
  }
}); 