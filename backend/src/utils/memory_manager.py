"""
Memory management utilities for script analysis.
"""
import gc
import psutil
import logging
from typing import Generator, Any
from functools import wraps

logger = logging.getLogger(__name__)

class MemoryManager:
    def __init__(self, memory_threshold_mb: int = 1000):
        self.memory_threshold = memory_threshold_mb * 1024 * 1024  # Convert to bytes
        self.process = psutil.Process()
        
    def get_memory_usage(self) -> int:
        """
        Get current memory usage in bytes
        """
        return self.process.memory_info().rss
        
    def check_memory(self) -> bool:
        """
        Check if memory usage is below threshold
        """
        return self.get_memory_usage() < self.memory_threshold
        
    def force_garbage_collection(self):
        """
        Force garbage collection
        """
        gc.collect()
        
    def chunk_text(self, text: str, chunk_size: int = 5000) -> Generator[str, None, None]:
        """
        Split text into manageable chunks
        """
        for i in range(0, len(text), chunk_size):
            yield text[i:i + chunk_size]
            
    def monitor_memory(self, threshold_mb: int = 1000):
        """
        Decorator to monitor memory usage
        """
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
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
        
class BatchProcessor:
    def __init__(self, batch_size: int = 100):
        self.batch_size = batch_size
        self.memory_manager = MemoryManager()
        
    def process_in_batches(self, items: list, processor_func) -> list:
        """
        Process items in batches to manage memory
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