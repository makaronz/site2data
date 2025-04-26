import winston from 'winston';
import path from 'path';

// Konfiguracja formatowania logów
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Ścieżki do plików logów
const logDir = path.join(process.cwd(), 'logs');
const errorLogPath = path.join(logDir, 'error.log');
const combinedLogPath = path.join(logDir, 'combined.log');

// Konfiguracja loggera
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'script-analysis' },
  transports: [
    // Logi błędów do pliku
    new winston.transports.File({
      filename: errorLogPath,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Wszystkie logi do pliku
    new winston.transports.File({
      filename: combinedLogPath,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Dodaj transport konsoli w środowisku deweloperskim
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Obsługa nieobsłużonych wyjątków
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Obsługa nieobsłużonych odrzuceń promise
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason,
  });
});

export default logger; 