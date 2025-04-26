export const parserConfig = {
  pdf: {
    poppler: {
      layout: 'raw',
      encoding: 'UTF-8',
      maintainLayout: true,
      cropBox: true,
      dpi: 300,
      grayscale: true
    },
    validation: {
      maxSize: 100 * 1024 * 1024, // 100MB
      allowedTypes: ['%PDF-1.', '%PDF-2.'],
      minPages: 1,
      maxPages: 1000
    },
    cache: {
      enabled: true,
      ttl: 24 * 60 * 60 * 1000, // 24 godziny
      directory: './cache'
    }
  },
  processing: {
    chunkSize: 1000,
    parallelProcessing: true,
    maxWorkers: 4,
    timeout: 300000 // 5 minut
  },
  output: {
    directory: 'parsed',
    formats: ['json', 'txt'],
    createBackup: true
  }
};

export const errorMessages = {
  PDF_INVALID: 'Nieprawidłowy format pliku PDF',
  PDF_TOO_LARGE: 'Plik PDF jest zbyt duży',
  PDF_EMPTY: 'Plik PDF jest pusty',
  PDF_CORRUPTED: 'Plik PDF jest uszkodzony',
  PROCESSING_TIMEOUT: 'Przekroczono czas przetwarzania',
  OCR_FAILED: 'Nie udało się rozpoznać tekstu',
  SAVE_FAILED: 'Nie udało się zapisać wyników',
  UNKNOWN: 'Wystąpił nieznany błąd'
}; 