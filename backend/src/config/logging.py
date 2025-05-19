import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging(app_name: str = "ai-cinehub") -> logging.Logger:
    """
    Configures and returns a logger for the application.
    
    Creates a logger with file rotation for both general and error logs, storing them in a "logs" directory. In development environments, also outputs logs to the console.
    
    Args:
        app_name: The name of the application used for naming log files.
    
    Returns:
        A configured logger instance for the application.
    """
    # Utwórz katalog na logi jeśli nie istnieje
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    
    # Konfiguracja formatowania logów
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Logger główny
    logger = logging.getLogger(app_name)
    logger.setLevel(logging.INFO)
    
    # Handler dla pliku logów
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, f"{app_name}.log"),
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Handler dla błędów
    error_handler = RotatingFileHandler(
        os.path.join(log_dir, f"{app_name}_error.log"),
        maxBytes=10485760,
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    logger.addHandler(error_handler)
    
    # Handler dla konsoli w trybie development
    if os.getenv("ENVIRONMENT") == "development":
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    
    return logger 