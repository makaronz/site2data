"""
Memory management utilities for script analysis.
"""
import gc
import psutil
import logging
from typing import Generator, Any, Callable, TypeVar, cast
from functools import wraps
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# Typ generyczny dla funkcji dekorowanych przez monitor_memory
T = TypeVar('T')

class MemoryManager:
    """
    Klasa zarządzająca pamięcią dla operacji intensywnie korzystających z pamięci.
    
    Zapewnia narzędzia do monitorowania zużycia pamięci, wymuszania garbage collection
    i dzielenia danych na mniejsze fragmenty w celu efektywnego zarządzania pamięcią.
    """
    
    def __init__(self, memory_threshold_mb: int = 1000):
        """
        Inicjalizuje menedżera pamięci.
        
        Args:
            memory_threshold_mb: Próg zużycia pamięci w MB, po przekroczeniu którego
                                 zostanie wymuszone garbage collection.
        """
        self.memory_threshold = memory_threshold_mb * 1024 * 1024  # Convert to bytes
        self.process = psutil.Process()
        
    def get_memory_usage(self) -> int:
        """
        Pobiera aktualne zużycie pamięci w bajtach.
        
        Returns:
            Aktualne zużycie pamięci w bajtach.
        """
        return self.process.memory_info().rss
        
    def check_memory(self) -> bool:
        """
        Sprawdza, czy zużycie pamięci jest poniżej progu.
        
        Returns:
            True, jeśli zużycie pamięci jest poniżej progu, False w przeciwnym razie.
        """
        return self.get_memory_usage() < self.memory_threshold
        
    def force_garbage_collection(self) -> None:
        """
        Wymusza garbage collection.
        """
        gc.collect()
        
    def chunk_text(self, text: str, chunk_size: int = 5000) -> Generator[str, None, None]:
        """
        Dzieli tekst na mniejsze fragmenty.
        
        Args:
            text: Tekst do podzielenia.
            chunk_size: Rozmiar fragmentu w znakach.
            
        Yields:
            Fragmenty tekstu o określonym rozmiarze.
        """
        for i in range(0, len(text), chunk_size):
            yield text[i:i + chunk_size]
            
    def monitor_memory(self, threshold_mb: int = 1000) -> Callable[[Callable[..., T]], Callable[..., T]]:
        """
        Dekorator do monitorowania zużycia pamięci.
        
        Args:
            threshold_mb: Próg zużycia pamięci w MB, po przekroczeniu którego
                         zostanie wyświetlone ostrzeżenie i wymuszone garbage collection.
                         
        Returns:
            Dekorator do monitorowania zużycia pamięci.
        """
        def decorator(func: Callable[..., T]) -> Callable[..., T]:
            @wraps(func)
            def wrapper(*args: Any, **kwargs: Any) -> T:
                initial_memory = self.get_memory_usage()
                
                try:
                    result = func(*args, **kwargs)
                    
                    final_memory = self.get_memory_usage()
                    memory_diff = final_memory - initial_memory
                    
                    logger.info(f"Memory usage for {func.__name__}:")
                    logger.info(f"Initial: {initial_memory / 1024 / 1024:.2f} MB")
                    logger.info(f"Final: {final_memory / 1024 / 1024:.2f} MB")
                    logger.info(f"Difference: {memory_diff / 1024 / 1024:.2f} MB")
                    
                    if memory_diff > threshold_mb * 1024 * 1024:
                        logger.warning(f"High memory usage in {func.__name__}")
                        self.force_garbage_collection()
                        
                    return result
                    
                except Exception as e:
                    logger.error(f"Error in {func.__name__}: {str(e)}")
                    raise
                    
            return wrapper
        return decorator
    
    @contextmanager
    def memory_context(self, operation_name: str) -> Generator[None, None, None]:
        """
        Kontekst do monitorowania zużycia pamięci.
        
        Args:
            operation_name: Nazwa operacji, która będzie monitorowana.
            
        Yields:
            None
        """
        initial_memory = self.get_memory_usage()
        logger.info(f"Starting {operation_name} with memory: {initial_memory / 1024 / 1024:.2f} MB")
        
        try:
            yield
        finally:
            final_memory = self.get_memory_usage()
            memory_diff = final_memory - initial_memory
            
            logger.info(f"Memory usage for {operation_name}:")
            logger.info(f"Initial: {initial_memory / 1024 / 1024:.2f} MB")
            logger.info(f"Final: {final_memory / 1024 / 1024:.2f} MB")
            logger.info(f"Difference: {memory_diff / 1024 / 1024:.2f} MB")
            
            if memory_diff > self.memory_threshold:
                logger.warning(f"High memory usage in {operation_name}")
                self.force_garbage_collection()
        
class BatchProcessor:
    """
    Klasa do przetwarzania danych w partiach w celu zarządzania zużyciem pamięci.
    """
    
    def __init__(self, batch_size: int = 100, memory_threshold_mb: int = 1000):
        """
        Inicjalizuje procesor partii.
        
        Args:
            batch_size: Rozmiar partii.
            memory_threshold_mb: Próg zużycia pamięci w MB, po przekroczeniu którego
                                 zostanie wymuszone garbage collection.
        """
        self.batch_size = batch_size
        self.memory_manager = MemoryManager(memory_threshold_mb)
        
    def process_in_batches(self, items: list, processor_func: Callable[[list], list]) -> list:
        """
        Przetwarza elementy w partiach w celu zarządzania pamięcią.
        
        Args:
            items: Lista elementów do przetworzenia.
            processor_func: Funkcja przetwarzająca partię elementów.
            
        Returns:
            Lista wyników przetwarzania.
        """
        results = []
        
        for i in range(0, len(items), self.batch_size):
            batch = items[i:i + self.batch_size]
            
            # Process batch
            batch_results = processor_func(batch)
            results.extend(batch_results)
            
            # Check memory after each batch
            if not self.memory_manager.check_memory():
                logger.warning("High memory usage detected, forcing garbage collection")
                self.memory_manager.force_garbage_collection()
                
        return results
    
    @contextmanager
    def batch_context(self, operation_name: str) -> Generator[None, None, None]:
        """
        Kontekst do przetwarzania partii.
        
        Args:
            operation_name: Nazwa operacji, która będzie monitorowana.
            
        Yields:
            None
        """
        with self.memory_manager.memory_context(operation_name):
            yield