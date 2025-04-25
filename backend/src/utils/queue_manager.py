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