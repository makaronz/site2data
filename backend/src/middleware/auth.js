const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../config/logging').setup_logging('auth');

const authMiddleware = async (req, res, next) => {
  try {
    // Sprawdź czy token jest obecny w nagłówku
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Brak tokenu uwierzytelniającego');
    }

    // Zweryfikuj token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Dodaj dane użytkownika do obiektu request
    req.user = decoded;
    req.token = token;

    logger.info(`Użytkownik ${decoded.id} uwierzytelniony pomyślnie`);
    next();
  } catch (error) {
    logger.error(`Błąd uwierzytelniania: ${error.message}`);
    res.status(401).json({
      success: false,
      message: 'Nieautoryzowany dostęp',
      error: error.message
    });
  }
};

// Middleware do sprawdzania uprawnień
const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Nieautoryzowany dostęp'
      });
    }

    if (req.user.role !== requiredRole) {
      logger.warn(`Użytkownik ${req.user.id} próbował uzyskać dostęp do zasobu wymagającego roli ${requiredRole}`);
      return res.status(403).json({
        success: false,
        message: 'Brak wymaganych uprawnień'
      });
    }

    next();
  };
};

// Middleware do ograniczania dostępu do API
const rateLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // limit 100 requestów na windowMs
  message: {
    success: false,
    message: 'Zbyt wiele requestów, spróbuj ponownie później'
  }
});

module.exports = {
  authMiddleware,
  checkRole,
  rateLimiter
}; 