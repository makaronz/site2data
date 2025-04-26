export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['application/pdf', 'text/plain'];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFile = (file: File): FileValidationResult => {
  if (!file) {
    return {
      isValid: false,
      error: 'Brak pliku',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `Plik jest zbyt duży. Maksymalny rozmiar to ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Nieprawidłowy format pliku. Dozwolone formaty to PDF i TXT',
    };
  }

  return {
    isValid: true,
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 