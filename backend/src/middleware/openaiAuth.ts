import { Request, Response, NextFunction } from 'express';

export const openaiAuth = (req: Request, res: Response, next: NextFunction) => {
  // Pobierz token z nagłówka Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // Jeśli nie ma nagłówka, użyj domyślnego klucza z .env
    req.headers.authorization = `Bearer ${process.env.OPENAI_API_KEY}`;
  }
  
  // Kontynuuj przetwarzanie żądania
  next();
}; 