import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging(app_name: str = "cinehub_ai"):
    """
    Konfiguruje system logowania dla aplikacji.
    
    Args:
        app_name (str): Nazwa aplikacji używana w logach
    """
    # Tworzenie katalogu na logi jeśli nie istnieje
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # Konfiguracja formatowania logów
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Handler dla logów aplikacji
    app_handler = RotatingFileHandler(
        os.path.join(log_dir, f"{app_name}.log"),
        maxBytes=10000000,  # 10MB
        backupCount=5
    )
    app_handler.setFormatter(formatter)
    app_handler.setLevel(logging.INFO)

    # Handler dla logów błędów
    error_handler = RotatingFileHandler(
        os.path.join(log_dir, f"{app_name}_error.log"),
        maxBytes=10000000,  # 10MB
        backupCount=5
    )
    error_handler.setFormatter(formatter)
    error_handler.setLevel(logging.ERROR)

    # Konfiguracja głównego loggera
    logger = logging.getLogger(app_name)
    logger.setLevel(logging.INFO)
    logger.addHandler(app_handler)
    logger.addHandler(error_handler)

    # Handler dla konsoli (development)
    if os.getenv("FLASK_ENV") == "development":
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        console_handler.setLevel(logging.DEBUG)
        logger.addHandler(console_handler)

    return logger 