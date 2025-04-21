"""
Queue management for script analysis tasks.
"""
import time
import logging
import threading
from typing import Callable, Dict, Any
from queue import Queue, Empty
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class AnalysisTask:
    task_id: str
    script_text: str
    analysis_type: str  # 'basic', 'sentiment', 'structure'
    created_at: datetime
    status: str = 'pending'
    result: Dict = None
    error: str = None

class QueueManager:
    def __init__(self, max_queue_size: int = 10, workers: int = 2):
        self.task_queue = Queue(maxsize=max_queue_size)
        self.results = {}
        self.workers = workers
        self.running = True
        self.worker_threads = []
        self._start_workers()
        
    def _start_workers(self):
        """
        Start worker threads
        """
        for _ in range(self.workers):
            thread = threading.Thread(target=self._worker_loop)
            thread.daemon = True
            thread.start()
            self.worker_threads.append(thread)
            
    def _worker_loop(self):
        """
        Main worker loop
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
                
    def _process_task(self, task: AnalysisTask):
        """
        Process a single task
        """
        try:
            task.status = 'processing'
            logger.info(f"Processing task {task.task_id}")
            
            # Process based on analysis type
            if task.analysis_type == 'basic':
                from script_analysis.basic_analyzer import BasicAnalyzer
                analyzer = BasicAnalyzer()
                task.result = analyzer.parse_script(task.script_text)
                
            elif task.analysis_type == 'sentiment':
                from script_analysis.sentiment_analyzer import SentimentAnalyzer
                analyzer = SentimentAnalyzer()
                # Assume we have dialogues from basic analysis
                if 'dialogues' in task.result:
                    task.result['sentiment'] = analyzer.analyze_character_emotions(
                        task.result['dialogues']
                    )
                    
            elif task.analysis_type == 'structure':
                from script_analysis.structure_analyzer import StructureAnalyzer
                analyzer = StructureAnalyzer()
                if 'scenes' in task.result and 'dialogues' in task.result:
                    task.result['structure'] = analyzer.analyze_structure(
                        task.result['scenes'],
                        task.result['dialogues']
                    )
                    
            task.status = 'completed'
            logger.info(f"Task {task.task_id} completed")
            
        except Exception as e:
            task.status = 'failed'
            task.error = str(e)
            logger.error(f"Task {task.task_id} failed: {str(e)}")
            
        finally:
            self.results[task.task_id] = task
            
    def add_task(self, script_text: str, analysis_type: str) -> str:
        """
        Add new task to queue
        """
        task_id = f"task_{int(time.time())}_{analysis_type}"
        task = AnalysisTask(
            task_id=task_id,
            script_text=script_text,
            analysis_type=analysis_type,
            created_at=datetime.now()
        )
        
        self.task_queue.put(task)
        logger.info(f"Added task {task_id} to queue")
        return task_id
        
    def get_task_status(self, task_id: str) -> Dict:
        """
        Get status of a task
        """
        if task_id not in self.results:
            return {'status': 'not_found'}
            
        task = self.results[task_id]
        return {
            'status': task.status,
            'created_at': task.created_at.isoformat(),
            'result': task.result if task.status == 'completed' else None,
            'error': task.error if task.status == 'failed' else None
        }
        
    def shutdown(self):
        """
        Shutdown queue manager
        """
        self.running = False
        for thread in self.worker_threads:
            thread.join()
        logger.info("Queue manager shutdown complete") 