import express from 'express';
import { OpenAI } from 'openai';

const router = express.Router();

// Endpoint do testowania klucza API
router.get('/test-openai', async (req, res) => {
  try {
    // Pobierz token z nagłówka lub użyj domyślnego
    const authHeader = req.headers.authorization;
    let apiKey = process.env.OPENAI_API_KEY || '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    }
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Brak klucza API OpenAI'
      });
    }
    
    console.log('Testowanie klucza API:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));
    
    // Inicjalizacja klienta OpenAI
    const openai = new OpenAI({
      apiKey: apiKey
    });
    
    // Wykonaj proste zapytanie testowe
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-2024-04-09",
      messages: [
        { role: "system", content: "Jesteś pomocnym asystentem." },
        { role: "user", content: "Powiedz 'Klucz API działa poprawnie' po polsku." }
      ],
      max_tokens: 50,
    });
    
    return res.json({
      success: true,
      message: 'Klucz API działa poprawnie',
      response: completion.choices[0].message.content
    });
  } catch (error: any) {
    console.error('Błąd podczas testowania klucza API:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd podczas testowania klucza API',
      error: error.message
    });
  }
});

export default router; 