import { createTRPCReact } from '@trpc/react-query';

// Definiujemy tymczasowe typy dla AppRouter, które później zastąpimy faktycznymi typami z backendu
interface AppRouter {
  requestPresignedUrl: {
    mutate: (input: { filename: string }) => Promise<{ 
      success: boolean; 
      url?: string; 
      objectKey?: string;
      message?: string;
    }>;
  };
  notifyUploadComplete: {
    mutate: (input: { objectKey: string }) => Promise<{
      success: boolean;
      jobId?: string;
      message?: string;
    }>;
  };
}

// Zwróć uwagę: VITE_API_URL jest zazwyczaj ustawiane w pliku .env
// Dla lokalnego developmentu, jeśli API działa na porcie 3000:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/trpc';

export const trpc = createTRPCReact<AppRouter>();

// Eksportujemy również API_URL, gdyby był potrzebny gdzie indziej
export { API_URL }; 