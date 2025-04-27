import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import path from 'path';

// Wczytaj zmienne środowiskowe
console.log('Ładowanie zmiennych środowiskowych z pliku:', path.resolve(process.cwd(), '.env'));
dotenv.config();

// Pobierz klucz API
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('BŁĄD: Brak klucza API OpenAI w zmiennych środowiskowych!');
  process.exit(1);
}

console.log('Klucz API znaleziony:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));

// Inicjalizacja klienta OpenAI
const openai = new OpenAI({
  apiKey: apiKey,
});

async function testOpenAI() {
  try {
    console.log('Wykonuję testowe zapytanie do OpenAI API...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-2024-04-09",
      messages: [
        { role: "system", content: "Jesteś pomocnym asystentem." },
        { role: "user", content: "Powiedz 'Test API działa poprawnie' po polsku." }
      ],
      max_tokens: 50,
    });
    
    console.log('Odpowiedź z API:', completion.choices[0].message.content);
    console.log('Test zakończony sukcesem!');
  } catch (error) {
    console.error('BŁĄD podczas wykonywania zapytania do OpenAI API:');
    console.error(error);
  }
}

// Uruchom test
testOpenAI(); 