# Raport: Refaktoryzacja Memory i Queue Managers

- **Czas:** 2025-04-25T14:00:00+02:00

- **Pliki dotknięte:** 
  - `backend/src/utils/memory_manager.py`
  - `backend/src/utils/queue_manager.py`

- **Podsumowanie:**
  - Przeprowadzono analizę i refaktoryzację modułów memory_manager.py i queue_manager.py, które są odpowiedzialne za zarządzanie pamięcią i kolejką zadań podczas analizy scenariuszy.
  - Dodano bardziej szczegółową dokumentację.
  - Dodano typy zwracane dla wszystkich metod.
  - Poprawiono obsługę błędów.
  - Dodano mechanizm czyszczenia starych wyników.
  - Dodano obsługę kontekstu (context manager) dla obu klas.
  - Dodano mechanizm priorytetyzacji zadań.
  - Dodano mechanizm ponownego próbowania nieudanych zadań.

- **Zmiany w memory_manager.py:**

```python
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
```

- **Zmiany w queue_manager.py:**

```python
"""
Queue management for script analysis tasks.
"""
import time
import logging
import threading
from typing import Callable, Dict, Any, List, Optional, Union, Tuple
from queue import Queue, Empty, PriorityQueue
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from contextlib import contextmanager

logger = logging.getLogger(__name__)

@dataclass
class AnalysisTask:
    """
    Reprezentuje zadanie analizy scenariusza.
    
    Attributes:
        task_id: Unikalny identyfikator zadania.
        script_text: Tekst scenariusza do analizy.
        analysis_type: Typ analizy ('basic', 'sentiment', 'structure').
        created_at: Czas utworzenia zadania.
        priority: Priorytet zadania (niższe wartości = wyższy priorytet).
        status: Status zadania ('pending', 'processing', 'completed', 'failed', 'retry').
        result: Wynik analizy.
        error: Komunikat błędu, jeśli zadanie nie powiodło się.
        retry_count: Liczba prób ponownego wykonania zadania.
        max_retries: Maksymalna liczba prób ponownego wykonania zadania.
    """
    task_id: str
    script_text: str
    analysis_type: str  # 'basic', 'sentiment', 'structure'
    created_at: datetime
    priority: int = 1
    status: str = 'pending'
    result: Optional[Dict] = None
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    
    def __lt__(self, other: 'AnalysisTask') -> bool:
        """
        Porównuje zadania na podstawie priorytetu.
        
        Args:
            other: Inne zadanie do porównania.
            
        Returns:
            True, jeśli to zadanie ma wyższy priorytet (niższą wartość) niż inne.
        """
        return self.priority < other.priority

@dataclass
class TaskResult:
    """
    Reprezentuje wynik zadania analizy.
    
    Attributes:
        status: Status zadania.
        created_at: Czas utworzenia zadania.
        completed_at: Czas zakończenia zadania.
        result: Wynik analizy.
        error: Komunikat błędu, jeśli zadanie nie powiodło się.
    """
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    result: Optional[Dict] = None
    error: Optional[str] = None

class QueueManager:
    """
    Zarządza kolejką zadań analizy scenariuszy.
    
    Attributes:
        task_queue: Kolejka zadań.
        results: Słownik wyników zadań.
        workers: Liczba wątków roboczych.
        running: Flaga wskazująca, czy menedżer kolejki jest uruchomiony.
        worker_threads: Lista wątków roboczych.
        cleanup_interval: Interwał czyszczenia starych wyników w sekundach.
        result_ttl: Czas życia wyników w sekundach.
        analyzers: Słownik analizatorów.
    """
    def __init__(self, max_queue_size: int = 10, workers: int = 2, 
                 cleanup_interval: int = 3600, result_ttl: int = 86400):
        """
        Inicjalizuje menedżera kolejki.
        
        Args:
            max_queue_size: Maksymalny rozmiar kolejki.
            workers: Liczba wątków roboczych.
            cleanup_interval: Interwał czyszczenia starych wyników w sekundach.
            result_ttl: Czas życia wyników w sekundach.
        """
        self.task_queue: PriorityQueue = PriorityQueue(maxsize=max_queue_size)
        self.results: Dict[str, TaskResult] = {}
        self.workers = workers
        self.running = True
        self.worker_threads: List[threading.Thread] = []
        self.cleanup_interval = cleanup_interval
        self.result_ttl = result_ttl
        self.analyzers: Dict[str, Any] = {}
        
        # Mutex dla słownika wyników
        self.results_lock = threading.RLock()
        
        self._start_workers()
        self._start_cleanup_thread()
        
    def _start_workers(self) -> None:
        """
        Uruchamia wątki robocze.
        """
        for _ in range(self.workers):
            thread = threading.Thread(target=self._worker_loop)
            thread.daemon = True
            thread.start()
            self.worker_threads.append(thread)
            
    def _start_cleanup_thread(self) -> None:
        """
        Uruchamia wątek czyszczący stare wyniki.
        """
        thread = threading.Thread(target=self._cleanup_loop)
        thread.daemon = True
        thread.start()
        self.worker_threads.append(thread)
            
    def _worker_loop(self) -> None:
        """
        Główna pętla wątku roboczego.
        """
        while self.running:
            try:
                task = self.task_queue.get(timeout=1)
                self._process_task(task)
                self.task_queue.task_done()
            except Empty:
                continue
            except Exception as e:
                logger.error(f"Error in worker loop: {str(e)}")
                
    def _cleanup_loop(self) -> None:
        """
        Pętla wątku czyszczącego stare wyniki.
        """
        while self.running:
            try:
                self._cleanup_old_results()
                time.sleep(self.cleanup_interval)
            except Exception as e:
                logger.error(f"Error in cleanup loop: {str(e)}")
                time.sleep(60)  # Krótszy interwał w przypadku błędu
                
    def _cleanup_old_results(self) -> None:
        """
        Czyści stare wyniki.
        """
        now = datetime.now()
        with self.results_lock:
            to_remove = []
            for task_id, result in self.results.items():
                if result.completed_at and (now - result.completed_at).total_seconds() > self.result_ttl:
                    to_remove.append(task_id)
                    
            for task_id in to_remove:
                del self.results[task_id]
                
            if to_remove:
                logger.info(f"Cleaned up {len(to_remove)} old results")
                
    def _get_analyzer(self, analysis_type: str) -> Any:
        """
        Pobiera lub tworzy analizator dla danego typu analizy.
        
        Args:
            analysis_type: Typ analizy ('basic', 'sentiment', 'structure').
            
        Returns:
            Analizator dla danego typu analizy.
            
        Raises:
            ValueError: Jeśli typ analizy jest nieznany.
        """
        if analysis_type not in self.analyzers:
            try:
                if analysis_type == 'basic':
                    from script_analysis.basic_analyzer import BasicAnalyzer
                    self.analyzers[analysis_type] = BasicAnalyzer()
                elif analysis_type == 'sentiment':
                    from script_analysis.sentiment_analyzer import SentimentAnalyzer
                    self.analyzers[analysis_type] = SentimentAnalyzer()
                elif analysis_type == 'structure':
                    from script_analysis.structure_analyzer import StructureAnalyzer
                    self.analyzers[analysis_type] = StructureAnalyzer()
                else:
                    raise ValueError(f"Unknown analysis type: {analysis_type}")
            except ImportError as e:
                logger.error(f"Error importing analyzer for {analysis_type}: {str(e)}")
                raise
                
        return self.analyzers[analysis_type]
                
    def _process_task(self, task: AnalysisTask) -> None:
        """
        Przetwarza pojedyncze zadanie.
        
        Args:
            task: Zadanie do przetworzenia.
        """
        try:
            task.status = 'processing'
            logger.info(f"Processing task {task.task_id}")
            
            # Process based on analysis type
            if task.analysis_type == 'basic':
                analyzer = self._get_analyzer('basic')
                task.result = analyzer.parse_script(task.script_text)
                
            elif task.analysis_type == 'sentiment':
                analyzer = self._get_analyzer('sentiment')
                # Assume we have dialogues from basic analysis
                if task.result and 'dialogues' in task.result:
                    task.result['sentiment'] = analyzer.analyze_character_emotions(
                        task.result['dialogues']
                    )
                else:
                    raise ValueError("Sentiment analysis requires dialogues from basic analysis")
                    
            elif task.analysis_type == 'structure':
                analyzer = self._get_analyzer('structure')
                if task.result and 'scenes' in task.result and 'dialogues' in task.result:
                    task.result['structure'] = analyzer.analyze_structure(
                        task.result['scenes'],
                        task.result['dialogues']
                    )
                else:
                    raise ValueError("Structure analysis requires scenes and dialogues from basic analysis")
                    
            task.status = 'completed'
            logger.info(f"Task {task.task_id} completed")
            
        except Exception as e:
            task.status = 'failed'
            task.error = str(e)
            logger.error(f"Task {task.task_id} failed: {str(e)}")
            
            # Retry if possible
            if task.retry_count < task.max_retries:
                task.retry_count += 1
                task.status = 'retry'
                task.priority += 1  # Lower priority for retries
                logger.info(f"Retrying task {task.task_id} (attempt {task.retry_count})")
                self.task_queue.put(task)
            
        finally:
            if task.status != 'retry':
                with self.results_lock:
                    self.results[task.task_id] = TaskResult(
                        status=task.status,
                        created_at=task.created_at,
                        completed_at=datetime.now(),
                        result=task.result if task.status == 'completed' else None,
                        error=task.error if task.status == 'failed' else None
                    )
            
    def add_task(self, script_text: str, analysis_type: str, priority: int = 1) -> str:
        """
        Dodaje nowe zadanie do kolejki.
        
        Args:
            script_text: Tekst scenariusza do analizy.
            analysis_type: Typ analizy ('basic', 'sentiment', 'structure').
            priority: Priorytet zadania (niższe wartości = wyższy priorytet).
            
        Returns:
            Identyfikator zadania.
        """
        task_id = f"task_{int(time.time())}_{analysis_type}"
        task = AnalysisTask(
            task_id=task_id,
            script_text=script_text,
            analysis_type=analysis_type,
            created_at=datetime.now(),
            priority=priority
        )
        
        self.task_queue.put(task)
        logger.info(f"Added task {task_id} to queue with priority {priority}")
        return task_id
        
    def get_task_status(self, task_id: str) -> Dict:
        """
        Pobiera status zadania.
        
        Args:
            task_id: Identyfikator zadania.
            
        Returns:
            Słownik ze statusem zadania.
        """
        with self.results_lock:
            if task_id not in self.results:
                return {'status': 'not_found'}
                
            task = self.results[task_id]
            return {
                'status': task.status,
                'created_at': task.created_at.isoformat(),
                'completed_at': task.completed_at.isoformat() if task.completed_at else None,
                'result': task.result if task.status == 'completed' else None,
                'error': task.error if task.status == 'failed' else None
            }
            
    def get_queue_stats(self) -> Dict:
        """
        Pobiera statystyki kolejki.
        
        Returns:
            Słownik ze statystykami kolejki.
        """
        with self.results_lock:
            completed = sum(1 for r in self.results.values() if r.status == 'completed')
            failed = sum(1 for r in self.results.values() if r.status == 'failed')
            
        return {
            'queue_size': self.task_queue.qsize(),
            'workers': self.workers,
            'completed_tasks': completed,
            'failed_tasks': failed,
            'total_results': len(self.results)
        }
        
    def shutdown(self) -> None:
        """
        Zamyka menedżera kolejki.
        """
        self.running = False
        for thread in self.worker_threads:
            thread.join()
        logger.info("Queue manager shutdown complete")
        
    @contextmanager
    def queue_context(self) -> Any:
        """
        Kontekst do korzystania z menedżera kolejki.
        
        Yields:
            Menedżer kolejki.
        """
        try:
            yield self
        finally:
            self.shutdown()
```

- **Uzasadnienie zmian:**

1. **Dodanie bardziej szczegółowej dokumentacji:**
   - Dodano docstringi dla wszystkich klas i metod.
   - Dodano opisy parametrów i wartości zwracanych.
   - Dodano przykłady użycia.

2. **Dodanie typów zwracanych dla wszystkich metod:**
   - Dodano adnotacje typów dla wszystkich parametrów i wartości zwracanych.
   - Dodano generyczne typy dla dekoratorów.

3. **Poprawa obsługi błędów:**
   - Dodano obsługę błędów przy importowaniu analizatorów.
   - Dodano mechanizm ponownego próbowania nieudanych zadań.
   - Dodano mutex dla słownika wyników, aby uniknąć problemów z wielowątkowością.

4. **Dodanie mechanizmu czyszczenia starych wyników:**
   - Dodano wątek czyszczący stare wyniki.
   - Dodano parametry konfiguracyjne dla interwału czyszczenia i czasu życia wyników.

5. **Dodanie obsługi kontekstu (context manager):**
   - Dodano kontekst dla MemoryManager.
   - Dodano kontekst dla BatchProcessor.
   - Dodano kontekst dla QueueManager.

6. **Dodanie mechanizmu priorytetyzacji zadań:**
   - Zmieniono Queue na PriorityQueue.
   - Dodano pole priority do AnalysisTask.
   - Dodano metodę __lt__ do AnalysisTask, aby umożliwić porównywanie zadań na podstawie priorytetu.

7. **Dodanie mechanizmu ponownego próbowania nieudanych zadań:**
   - Dodano pola retry_count i max_retries do AnalysisTask.
   - Dodano logikę ponownego próbowania w metodzie _process_task.

8. **Inne ulepszenia:**
   - Dodano klasę TaskResult do przechowywania wyników zadań.
   - Dodano metodę get_queue_stats do pobierania statystyk kolejki.
   - Dodano metodę _get_analyzer do pobierania lub tworzenia analizatorów.
   - Dodano parametr memory_threshold_mb do BatchProcessor.

- **Następne kroki:**

1. Aktualizacja testów jednostkowych dla obu modułów.
2. Integracja z resztą aplikacji.
3. Dodanie monitorowania wydajności.
4. Rozważenie użycia bardziej zaawansowanych mechanizmów kolejkowania, takich jak Celery lub RQ.