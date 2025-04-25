import unittest
import sys
import os
import gc
from unittest.mock import patch, MagicMock
from io import StringIO

# Dodaj ścieżkę do katalogu backend/src, aby można było importować moduły
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../backend/src')))

from utils.memory_manager import MemoryManager, BatchProcessor

class TestMemoryManager(unittest.TestCase):
    def setUp(self):
        self.memory_manager = MemoryManager(memory_threshold_mb=100)
    
    def test_get_memory_usage(self):
        # Test, czy funkcja zwraca wartość większą od zera
        memory_usage = self.memory_manager.get_memory_usage()
        self.assertGreater(memory_usage, 0)
    
    def test_check_memory(self):
        # Test z bardzo wysokim progiem (powinien zwrócić True)
        self.memory_manager.memory_threshold = 1000 * 1024 * 1024  # 1000 MB
        self.assertTrue(self.memory_manager.check_memory())
        
        # Test z bardzo niskim progiem (powinien zwrócić False)
        self.memory_manager.memory_threshold = 1  # 1 bajt
        self.assertFalse(self.memory_manager.check_memory())
    
    def test_force_garbage_collection(self):
        # Mockowanie gc.collect, aby sprawdzić, czy jest wywoływane
        with patch('gc.collect') as mock_collect:
            self.memory_manager.force_garbage_collection()
            mock_collect.assert_called_once()
    
    def test_chunk_text(self):
        text = "To jest przykładowy tekst do podziału na fragmenty."
        chunk_size = 10
        chunks = list(self.memory_manager.chunk_text(text, chunk_size))
        
        # Sprawdź, czy wszystkie fragmenty oprócz ostatniego mają rozmiar chunk_size
        for i in range(len(chunks) - 1):
            self.assertEqual(len(chunks[i]), chunk_size)
        
        # Sprawdź, czy połączenie fragmentów daje oryginalny tekst
        self.assertEqual(''.join(chunks), text)
    
    def test_monitor_memory_decorator(self):
        # Mockowanie logger.info i logger.warning
        with patch('logging.Logger.info') as mock_info, \
             patch('logging.Logger.warning') as mock_warning, \
             patch.object(self.memory_manager, 'get_memory_usage') as mock_get_memory_usage, \
             patch.object(self.memory_manager, 'force_garbage_collection') as mock_force_gc:
            
            # Symuluj, że funkcja zużywa dużo pamięci
            mock_get_memory_usage.side_effect = [100, 200]  # Przed i po wykonaniu funkcji
            
            # Utwórz dekorowaną funkcję
            @self.memory_manager.monitor_memory(threshold_mb=0.05)  # Niski próg, aby wywołać ostrzeżenie
            def test_func():
                return "test"
            
            # Wywołaj funkcję
            result = test_func()
            
            # Sprawdź, czy funkcja zwróciła poprawny wynik
            self.assertEqual(result, "test")
            
            # Sprawdź, czy logger.info został wywołany
            self.assertEqual(mock_info.call_count, 4)
            
            # Sprawdź, czy logger.warning został wywołany
            mock_warning.assert_called_once()
            
            # Sprawdź, czy force_garbage_collection zostało wywołane
            mock_force_gc.assert_called_once()
    
    def test_memory_context(self):
        # Mockowanie logger.info i logger.warning
        with patch('logging.Logger.info') as mock_info, \
             patch('logging.Logger.warning') as mock_warning, \
             patch.object(self.memory_manager, 'get_memory_usage') as mock_get_memory_usage, \
             patch.object(self.memory_manager, 'force_garbage_collection') as mock_force_gc:
            
            # Symuluj, że operacja zużywa dużo pamięci
            mock_get_memory_usage.side_effect = [100, 200]  # Przed i po wykonaniu operacji
            
            # Ustaw niski próg, aby wywołać ostrzeżenie
            self.memory_manager.memory_threshold = 50
            
            # Użyj kontekstu
            with self.memory_manager.memory_context("test_operation"):
                pass
            
            # Sprawdź, czy logger.info został wywołany
            self.assertEqual(mock_info.call_count, 5)
            
            # Sprawdź, czy logger.warning został wywołany
            mock_warning.assert_called_once()
            
            # Sprawdź, czy force_garbage_collection zostało wywołane
            mock_force_gc.assert_called_once()

class TestBatchProcessor(unittest.TestCase):
    def setUp(self):
        self.batch_processor = BatchProcessor(batch_size=2, memory_threshold_mb=100)
    
    def test_process_in_batches(self):
        # Mockowanie memory_manager.check_memory i memory_manager.force_garbage_collection
        with patch.object(self.batch_processor.memory_manager, 'check_memory') as mock_check_memory, \
             patch.object(self.batch_processor.memory_manager, 'force_garbage_collection') as mock_force_gc:
            
            # Symuluj, że pamięć jest przekroczona po pierwszej partii
            mock_check_memory.side_effect = [False, True]
            
            # Funkcja przetwarzająca
            def processor_func(batch):
                return [item * 2 for item in batch]
            
            # Przetwórz elementy
            items = [1, 2, 3, 4, 5]
            results = self.batch_processor.process_in_batches(items, processor_func)
            
            # Sprawdź, czy wyniki są poprawne
            self.assertEqual(results, [2, 4, 6, 8, 10])
            
            # Sprawdź, czy check_memory zostało wywołane
            self.assertEqual(mock_check_memory.call_count, 3)
            
            # Sprawdź, czy force_garbage_collection zostało wywołane
            mock_force_gc.assert_called_once()
    
    def test_batch_context(self):
        # Mockowanie memory_manager.memory_context
        with patch.object(self.batch_processor.memory_manager, 'memory_context') as mock_memory_context:
            mock_context = MagicMock()
            mock_memory_context.return_value = mock_context
            
            # Użyj kontekstu
            with self.batch_processor.batch_context("test_operation"):
                pass
            
            # Sprawdź, czy memory_context zostało wywołane
            mock_memory_context.assert_called_once_with("test_operation")
            
            # Sprawdź, czy kontekst został użyty
            mock_context.__enter__.assert_called_once()
            mock_context.__exit__.assert_called_once()

if __name__ == '__main__':
    unittest.main()