import unittest
import sys
import os
import time
from unittest.mock import patch, MagicMock, call
from datetime import datetime, timedelta
from queue import PriorityQueue, Empty

# Dodaj ścieżkę do katalogu backend/src, aby można było importować moduły
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../backend/src')))

from utils.queue_manager import QueueManager, AnalysisTask, TaskResult

class TestAnalysisTask(unittest.TestCase):
    def test_task_comparison(self):
        # Tworzenie zadań z różnymi priorytetami
        task1 = AnalysisTask(
            task_id="task1",
            script_text="text1",
            analysis_type="basic",
            created_at=datetime.now(),
            priority=1
        )
        
        task2 = AnalysisTask(
            task_id="task2",
            script_text="text2",
            analysis_type="basic",
            created_at=datetime.now(),
            priority=2
        )
        
        # Sprawdzenie, czy zadanie z niższym priorytetem (wyższą wartością) jest większe
        self.assertTrue(task1 < task2)
        self.assertFalse(task2 < task1)

class TestTaskResult(unittest.TestCase):
    def test_task_result_creation(self):
        # Tworzenie wyniku zadania
        created_at = datetime.now()
        completed_at = created_at + timedelta(seconds=10)
        result = TaskResult(
            status="completed",
            created_at=created_at,
            completed_at=completed_at,
            result={"data": "test"},
            error=None
        )
        
        # Sprawdzenie, czy pola są poprawnie ustawione
        self.assertEqual(result.status, "completed")
        self.assertEqual(result.created_at, created_at)
        self.assertEqual(result.completed_at, completed_at)
        self.assertEqual(result.result, {"data": "test"})
        self.assertIsNone(result.error)

class TestQueueManager(unittest.TestCase):
    def setUp(self):
        # Mockowanie wątków, aby uniknąć rzeczywistego uruchamiania wątków
        self.thread_patcher = patch('threading.Thread')
        self.mock_thread = self.thread_patcher.start()
        
        # Tworzenie menedżera kolejki
        self.queue_manager = QueueManager(
            max_queue_size=5,
            workers=2,
            cleanup_interval=60,
            result_ttl=300
        )
        
        # Zatrzymanie wątków, aby uniknąć rzeczywistego przetwarzania
        self.queue_manager.running = False
    
    def tearDown(self):
        self.thread_patcher.stop()
    
    def test_initialization(self):
        # Sprawdzenie, czy pola są poprawnie ustawione
        self.assertIsInstance(self.queue_manager.task_queue, PriorityQueue)
        self.assertEqual(self.queue_manager.workers, 2)
        self.assertEqual(self.queue_manager.cleanup_interval, 60)
        self.assertEqual(self.queue_manager.result_ttl, 300)
        
        # Sprawdzenie, czy wątki zostały uruchomione
        self.assertEqual(self.mock_thread.call_count, 3)  # 2 wątki robocze + 1 wątek czyszczący
    
    def test_add_task(self):
        # Mockowanie PriorityQueue.put
        with patch.object(self.queue_manager.task_queue, 'put') as mock_put:
            # Dodanie zadania
            task_id = self.queue_manager.add_task(
                script_text="test script",
                analysis_type="basic",
                priority=2
            )
            
            # Sprawdzenie, czy task_id ma poprawny format
            self.assertTrue(task_id.startswith("task_"))
            self.assertTrue("_basic" in task_id)
            
            # Sprawdzenie, czy PriorityQueue.put zostało wywołane
            mock_put.assert_called_once()
            
            # Sprawdzenie, czy zadanie ma poprawne pola
            task = mock_put.call_args[0][0]
            self.assertEqual(task.script_text, "test script")
            self.assertEqual(task.analysis_type, "basic")
            self.assertEqual(task.priority, 2)
            self.assertEqual(task.status, "pending")
    
    def test_get_task_status_not_found(self):
        # Sprawdzenie, czy zwraca 'not_found' dla nieistniejącego zadania
        status = self.queue_manager.get_task_status("nonexistent_task")
        self.assertEqual(status, {'status': 'not_found'})
    
    def test_get_task_status_found(self):
        # Dodanie wyniku zadania
        created_at = datetime.now()
        completed_at = created_at + timedelta(seconds=10)
        with self.queue_manager.results_lock:
            self.queue_manager.results["test_task"] = TaskResult(
                status="completed",
                created_at=created_at,
                completed_at=completed_at,
                result={"data": "test"},
                error=None
            )
        
        # Sprawdzenie, czy zwraca poprawny status
        status = self.queue_manager.get_task_status("test_task")
        self.assertEqual(status['status'], "completed")
        self.assertEqual(status['created_at'], created_at.isoformat())
        self.assertEqual(status['completed_at'], completed_at.isoformat())
        self.assertEqual(status['result'], {"data": "test"})
        self.assertIsNone(status['error'])
    
    def test_get_queue_stats(self):
        # Dodanie wyników zadań
        with self.queue_manager.results_lock:
            self.queue_manager.results["task1"] = TaskResult(
                status="completed",
                created_at=datetime.now()
            )
            self.queue_manager.results["task2"] = TaskResult(
                status="failed",
                created_at=datetime.now()
            )
            self.queue_manager.results["task3"] = TaskResult(
                status="completed",
                created_at=datetime.now()
            )
        
        # Mockowanie PriorityQueue.qsize
        with patch.object(self.queue_manager.task_queue, 'qsize', return_value=2):
            # Pobranie statystyk
            stats = self.queue_manager.get_queue_stats()
            
            # Sprawdzenie, czy statystyki są poprawne
            self.assertEqual(stats['queue_size'], 2)
            self.assertEqual(stats['workers'], 2)
            self.assertEqual(stats['completed_tasks'], 2)
            self.assertEqual(stats['failed_tasks'], 1)
            self.assertEqual(stats['total_results'], 3)
    
    def test_cleanup_old_results(self):
        # Dodanie wyników zadań
        now = datetime.now()
        old_time = now - timedelta(seconds=400)  # Starsze niż result_ttl
        recent_time = now - timedelta(seconds=100)  # Nowsze niż result_ttl
        
        with self.queue_manager.results_lock:
            self.queue_manager.results["old_task"] = TaskResult(
                status="completed",
                created_at=old_time,
                completed_at=old_time
            )
            self.queue_manager.results["recent_task"] = TaskResult(
                status="completed",
                created_at=recent_time,
                completed_at=recent_time
            )
            self.queue_manager.results["pending_task"] = TaskResult(
                status="pending",
                created_at=old_time,
                completed_at=None
            )
        
        # Wywołanie czyszczenia
        self.queue_manager._cleanup_old_results()
        
        # Sprawdzenie, czy stare wyniki zostały usunięte
        with self.queue_manager.results_lock:
            self.assertNotIn("old_task", self.queue_manager.results)
            self.assertIn("recent_task", self.queue_manager.results)
            self.assertIn("pending_task", self.queue_manager.results)
    
    def test_get_analyzer(self):
        # Mockowanie importów
        with patch('importlib.import_module') as mock_import, \
             patch('utils.queue_manager.BasicAnalyzer') as mock_basic_analyzer, \
             patch('utils.queue_manager.SentimentAnalyzer') as mock_sentiment_analyzer, \
             patch('utils.queue_manager.StructureAnalyzer') as mock_structure_analyzer:
            
            # Mockowanie analizatorów
            mock_basic_analyzer.return_value = "basic_analyzer"
            mock_sentiment_analyzer.return_value = "sentiment_analyzer"
            mock_structure_analyzer.return_value = "structure_analyzer"
            
            # Pobranie analizatorów
            basic_analyzer = self.queue_manager._get_analyzer("basic")
            sentiment_analyzer = self.queue_manager._get_analyzer("sentiment")
            structure_analyzer = self.queue_manager._get_analyzer("structure")
            
            # Sprawdzenie, czy analizatory są poprawne
            self.assertEqual(basic_analyzer, "basic_analyzer")
            self.assertEqual(sentiment_analyzer, "sentiment_analyzer")
            self.assertEqual(structure_analyzer, "structure_analyzer")
            
            # Sprawdzenie, czy analizatory są zapisywane w słowniku
            self.assertEqual(self.queue_manager.analyzers["basic"], "basic_analyzer")
            self.assertEqual(self.queue_manager.analyzers["sentiment"], "sentiment_analyzer")
            self.assertEqual(self.queue_manager.analyzers["structure"], "structure_analyzer")
            
            # Sprawdzenie, czy analizatory są pobierane ze słownika przy kolejnym wywołaniu
            self.queue_manager._get_analyzer("basic")
            self.queue_manager._get_analyzer("sentiment")
            self.queue_manager._get_analyzer("structure")
            
            # Sprawdzenie, czy importy zostały wywołane tylko raz dla każdego typu
            self.assertEqual(mock_basic_analyzer.call_count, 1)
            self.assertEqual(mock_sentiment_analyzer.call_count, 1)
            self.assertEqual(mock_structure_analyzer.call_count, 1)
    
    def test_get_analyzer_unknown_type(self):
        # Sprawdzenie, czy rzuca wyjątek dla nieznanego typu analizy
        with self.assertRaises(ValueError):
            self.queue_manager._get_analyzer("unknown")
    
    def test_process_task_basic(self):
        # Tworzenie zadania
        task = AnalysisTask(
            task_id="task1",
            script_text="test script",
            analysis_type="basic",
            created_at=datetime.now()
        )
        
        # Mockowanie analizatora
        mock_analyzer = MagicMock()
        mock_analyzer.parse_script.return_value = {"scenes": [], "dialogues": []}
        
        # Mockowanie _get_analyzer
        with patch.object(self.queue_manager, '_get_analyzer', return_value=mock_analyzer):
            # Przetwarzanie zadania
            self.queue_manager._process_task(task)
            
            # Sprawdzenie, czy analizator został wywołany
            mock_analyzer.parse_script.assert_called_once_with("test script")
            
            # Sprawdzenie, czy zadanie zostało zaktualizowane
            self.assertEqual(task.status, "completed")
            self.assertEqual(task.result, {"scenes": [], "dialogues": []})
            
            # Sprawdzenie, czy wynik został zapisany
            with self.queue_manager.results_lock:
                self.assertIn(task.task_id, self.queue_manager.results)
                result = self.queue_manager.results[task.task_id]
                self.assertEqual(result.status, "completed")
                self.assertEqual(result.result, {"scenes": [], "dialogues": []})
    
    def test_process_task_sentiment(self):
        # Tworzenie zadania
        task = AnalysisTask(
            task_id="task1",
            script_text="test script",
            analysis_type="sentiment",
            created_at=datetime.now()
        )
        task.result = {"dialogues": []}
        
        # Mockowanie analizatora
        mock_analyzer = MagicMock()
        mock_analyzer.analyze_character_emotions.return_value = {"emotions": {}}
        
        # Mockowanie _get_analyzer
        with patch.object(self.queue_manager, '_get_analyzer', return_value=mock_analyzer):
            # Przetwarzanie zadania
            self.queue_manager._process_task(task)
            
            # Sprawdzenie, czy analizator został wywołany
            mock_analyzer.analyze_character_emotions.assert_called_once_with([])
            
            # Sprawdzenie, czy zadanie zostało zaktualizowane
            self.assertEqual(task.status, "completed")
            self.assertEqual(task.result, {"dialogues": [], "sentiment": {"emotions": {}}})
    
    def test_process_task_structure(self):
        # Tworzenie zadania
        task = AnalysisTask(
            task_id="task1",
            script_text="test script",
            analysis_type="structure",
            created_at=datetime.now()
        )
        task.result = {"scenes": [], "dialogues": []}
        
        # Mockowanie analizatora
        mock_analyzer = MagicMock()
        mock_analyzer.analyze_structure.return_value = {"structure": {}}
        
        # Mockowanie _get_analyzer
        with patch.object(self.queue_manager, '_get_analyzer', return_value=mock_analyzer):
            # Przetwarzanie zadania
            self.queue_manager._process_task(task)
            
            # Sprawdzenie, czy analizator został wywołany
            mock_analyzer.analyze_structure.assert_called_once_with([], [])
            
            # Sprawdzenie, czy zadanie zostało zaktualizowane
            self.assertEqual(task.status, "completed")
            self.assertEqual(task.result, {"scenes": [], "dialogues": [], "structure": {"structure": {}}})
    
    def test_process_task_error(self):
        # Tworzenie zadania
        task = AnalysisTask(
            task_id="task1",
            script_text="test script",
            analysis_type="basic",
            created_at=datetime.now()
        )
        
        # Mockowanie analizatora, który rzuca wyjątek
        mock_analyzer = MagicMock()
        mock_analyzer.parse_script.side_effect = ValueError("Test error")
        
        # Mockowanie _get_analyzer
        with patch.object(self.queue_manager, '_get_analyzer', return_value=mock_analyzer), \
             patch.object(self.queue_manager.task_queue, 'put') as mock_put:
            # Przetwarzanie zadania
            self.queue_manager._process_task(task)
            
            # Sprawdzenie, czy zadanie zostało zaktualizowane
            self.assertEqual(task.status, "retry")
            self.assertEqual(task.error, "Test error")
            self.assertEqual(task.retry_count, 1)
            
            # Sprawdzenie, czy zadanie zostało dodane ponownie do kolejki
            mock_put.assert_called_once_with(task)
    
    def test_process_task_max_retries(self):
        # Tworzenie zadania, które już osiągnęło maksymalną liczbę prób
        task = AnalysisTask(
            task_id="task1",
            script_text="test script",
            analysis_type="basic",
            created_at=datetime.now(),
            retry_count=3,
            max_retries=3
        )
        
        # Mockowanie analizatora, który rzuca wyjątek
        mock_analyzer = MagicMock()
        mock_analyzer.parse_script.side_effect = ValueError("Test error")
        
        # Mockowanie _get_analyzer
        with patch.object(self.queue_manager, '_get_analyzer', return_value=mock_analyzer), \
             patch.object(self.queue_manager.task_queue, 'put') as mock_put:
            # Przetwarzanie zadania
            self.queue_manager._process_task(task)
            
            # Sprawdzenie, czy zadanie zostało zaktualizowane
            self.assertEqual(task.status, "failed")
            self.assertEqual(task.error, "Test error")
            
            # Sprawdzenie, czy zadanie NIE zostało dodane ponownie do kolejki
            mock_put.assert_not_called()
            
            # Sprawdzenie, czy wynik został zapisany
            with self.queue_manager.results_lock:
                self.assertIn(task.task_id, self.queue_manager.results)
                result = self.queue_manager.results[task.task_id]
                self.assertEqual(result.status, "failed")
                self.assertEqual(result.error, "Test error")
    
    def test_shutdown(self):
        # Mockowanie threading.Thread.join
        mock_thread1 = MagicMock()
        mock_thread2 = MagicMock()
        self.queue_manager.worker_threads = [mock_thread1, mock_thread2]
        
        # Wywołanie shutdown
        self.queue_manager.shutdown()
        
        # Sprawdzenie, czy running zostało ustawione na False
        self.assertFalse(self.queue_manager.running)
        
        # Sprawdzenie, czy join zostało wywołane dla każdego wątku
        mock_thread1.join.assert_called_once()
        mock_thread2.join.assert_called_once()
    
    def test_queue_context(self):
        # Mockowanie shutdown
        with patch.object(self.queue_manager, 'shutdown') as mock_shutdown:
            # Użycie kontekstu
            with self.queue_manager.queue_context() as qm:
                # Sprawdzenie, czy kontekst zwraca menedżera kolejki
                self.assertEqual(qm, self.queue_manager)
            
            # Sprawdzenie, czy shutdown zostało wywołane
            mock_shutdown.assert_called_once()

if __name__ == '__main__':
    unittest.main()