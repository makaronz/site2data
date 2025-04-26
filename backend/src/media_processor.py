"""
Zoptymalizowany moduł do przetwarzania mediów.
"""
import cv2
import numpy as np
from moviepy.editor import VideoFileClip
import ffmpeg
import os
import shutil
import tempfile
from PIL import Image
import pytesseract
from skimage import measure
import json
import logging
from typing import List, Dict, Any, Optional, Tuple, Set, Generator
from dataclasses import dataclass, field
from contextlib import contextmanager
from datetime import datetime
import multiprocessing as mp
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import hashlib
import pickle
from pathlib import Path
import psutil
import gc

# Konfiguracja logowania
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('media_processor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ProcessingConfig:
    """Konfiguracja parametrów przetwarzania mediów."""
    frame_interval: float = 1.0
    scene_threshold: float = 30.0
    min_object_area: int = 1000
    face_detection_scale: float = 1.1
    face_detection_neighbors: int = 4
    edge_detection_threshold1: int = 100
    edge_detection_threshold2: int = 200
    cleanup_temp_files: bool = True
    max_workers: int = mp.cpu_count()
    chunk_size: int = 1000
    use_gpu: bool = True
    cache_dir: str = ".cache"
    cache_ttl: int = 3600  # 1 godzina
    memory_limit: int = 1024 * 1024 * 1024  # 1GB
    log_level: str = "INFO"

class CacheManager:
    """Zarządza cache'owaniem wyników przetwarzania."""
    
    def __init__(self, cache_dir: str, ttl: int):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl = ttl
        
    def _get_cache_key(self, data: Any) -> str:
        """Generuje klucz cache'a na podstawie danych."""
        if isinstance(data, str):
            content = data.encode()
        elif isinstance(data, (bytes, bytearray)):
            content = data
        else:
            content = pickle.dumps(data)
        return hashlib.sha256(content).hexdigest()
        
    def get(self, key: str) -> Optional[Any]:
        """Pobiera dane z cache'a."""
        try:
            cache_file = self.cache_dir / f"{key}.cache"
            if not cache_file.exists():
                return None
                
            # Sprawdź TTL
            if datetime.now().timestamp() - cache_file.stat().st_mtime > self.ttl:
                cache_file.unlink()
                return None
                
            with cache_file.open('rb') as f:
                return pickle.load(f)
        except Exception as e:
            logger.warning(f"Błąd podczas odczytu z cache'a: {e}")
            return None
            
    def set(self, key: str, data: Any) -> None:
        """Zapisuje dane do cache'a."""
        try:
            cache_file = self.cache_dir / f"{key}.cache"
            with cache_file.open('wb') as f:
                pickle.dump(data, f)
        except Exception as e:
            logger.warning(f"Błąd podczas zapisu do cache'a: {e}")
            
    def clear_expired(self) -> None:
        """Czyści wygasłe wpisy z cache'a."""
        now = datetime.now().timestamp()
        for cache_file in self.cache_dir.glob("*.cache"):
            if now - cache_file.stat().st_mtime > self.ttl:
                cache_file.unlink()

class MemoryManager:
    """Zarządza zużyciem pamięci."""
    
    def __init__(self, memory_limit: int):
        self.memory_limit = memory_limit
        self.process = psutil.Process()
        
    def check_memory(self) -> bool:
        """Sprawdza, czy zużycie pamięci jest poniżej limitu."""
        return self.process.memory_info().rss < self.memory_limit
        
    def free_memory(self) -> None:
        """Zwalnia pamięć."""
        gc.collect()
        
    @contextmanager
    def monitor_memory(self, operation_name: str):
        """Monitoruje zużycie pamięci podczas operacji."""
        start_memory = self.process.memory_info().rss
        try:
            yield
        finally:
            end_memory = self.process.memory_info().rss
            memory_diff = end_memory - start_memory
            logger.info(f"Zużycie pamięci dla {operation_name}: {memory_diff / 1024 / 1024:.2f} MB")
            
            if not self.check_memory():
                logger.warning(f"Przekroczono limit pamięci podczas {operation_name}")
                self.free_memory()

class MediaProcessor:
    """Przetwarza pliki multimedialne z optymalizacjami wydajności."""
    
    def __init__(self, output_dir: str = "downloaded_content", config: Optional[ProcessingConfig] = None):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self.config = config or ProcessingConfig()
        self.temp_files: List[str] = []
        
        # Inicjalizacja menedżerów
        self.cache_manager = CacheManager(self.config.cache_dir, self.config.cache_ttl)
        self.memory_manager = MemoryManager(self.config.memory_limit)
        
        # Konfiguracja poziomu logowania
        logger.setLevel(getattr(logging, self.config.log_level.upper()))
        
        # Inicjalizacja GPU
        if self.config.use_gpu and cv2.cuda.getCudaEnabledDeviceCount() > 0:
            self.gpu_enabled = True
            logger.info("GPU dostępne do przetwarzania")
        else:
            self.gpu_enabled = False
            logger.info("GPU niedostępne, używanie CPU")
            
    def process_video(self, video_path: str) -> Dict[str, Any]:
        """Przetwarza wideo z wykorzystaniem cache'a i monitorowaniem pamięci."""
        logger.info(f"Rozpoczęto przetwarzanie wideo: {video_path}")
        start_time = datetime.now()
        
        try:
            # Sprawdź cache
            cache_key = self.cache_manager._get_cache_key(video_path)
            cached_result = self.cache_manager.get(cache_key)
            if cached_result:
                logger.info(f"Znaleziono wyniki w cache'u dla: {video_path}")
                return cached_result
                
            with self.memory_manager.monitor_memory("przetwarzanie_wideo"):
                # Użyj przetwarzania równoległego
                result = self.process_video_parallel(video_path)
                
                # Dodaj informacje o czasie przetwarzania
                processing_time = (datetime.now() - start_time).total_seconds()
                result['processing_info']['processing_time'] = processing_time
                
                # Zapisz do cache'a
                self.cache_manager.set(cache_key, result)
                
                logger.info(f"Zakończono przetwarzanie wideo: {video_path} (czas: {processing_time:.2f}s)")
                return result
                
        except Exception as e:
            logger.error(f"Błąd podczas przetwarzania wideo: {e}", exc_info=True)
            raise
        finally:
            # Wyczyść tymczasowe pliki
            if self.config.cleanup_temp_files:
                self._cleanup_temp_files()
                
    def _cleanup_temp_files(self) -> None:
        """Czyści pliki tymczasowe."""
        logger.debug("Czyszczenie plików tymczasowych")
        for file_path in self.temp_files:
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                logger.warning(f"Błąd podczas usuwania pliku tymczasowego {file_path}: {e}")
                
    @contextmanager
    def processing_context(self, operation_name: str):
        """Kontekst do przetwarzania z monitorowaniem zasobów."""
        start_time = datetime.now()
        logger.info(f"Rozpoczęto operację: {operation_name}")
        
        try:
            with self.memory_manager.monitor_memory(operation_name):
                yield
        finally:
            processing_time = (datetime.now() - start_time).total_seconds()
            logger.info(f"Zakończono operację: {operation_name} (czas: {processing_time:.2f}s)")
            
    def __del__(self):
        """Destruktor klasy."""
        if self.config.cleanup_temp_files:
            self._cleanup_temp_files()
            
    def process_video_parallel(self, video_path: str) -> Dict[str, Any]:
        """Przetwarza wideo równolegle używając wielu rdzeni CPU/GPU."""
        try:
            metadata = self.extract_video_metadata(video_path)
            
            # Ekstrakcja klatek w osobnym procesie
            with ProcessPoolExecutor(max_workers=self.config.max_workers) as executor:
                frames_future = executor.submit(self.extract_frames, video_path)
                scene_changes_future = executor.submit(self.detect_scene_changes, video_path)
                
                frames = frames_future.result()
                scene_changes = scene_changes_future.result()
            
            # Analiza klatek równolegle
            with ThreadPoolExecutor(max_workers=self.config.max_workers) as executor:
                frame_analyses = list(executor.map(self.analyze_frame, frames))
                frame_objects = list(executor.map(self.detect_objects, frames))
                frame_moods = list(executor.map(self.analyze_scene_mood, frames))
            
            # Agregacja wyników
            results = {
                'metadata': metadata,
                'scene_changes': scene_changes,
                'frame_analyses': frame_analyses,
                'objects': frame_objects,
                'moods': frame_moods,
                'processing_info': {
                    'gpu_enabled': self.gpu_enabled,
                    'workers_used': self.config.max_workers,
                    'processing_time': None  # będzie uzupełnione później
                }
            }
            
            return results
            
        except Exception as e:
            logger.error(f"Błąd podczas przetwarzania wideo: {e}")
            raise

    def extract_frames_gpu(self, video_path: str) -> List[str]:
        """Ekstrahuje klatki z wideo używając GPU jeśli dostępne."""
        try:
            if not self.gpu_enabled:
                return self.extract_frames(video_path)
                
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_interval = int(fps * self.config.frame_interval)
            
            frames_dir = os.path.join(self.output_dir, "frames")
            os.makedirs(frames_dir, exist_ok=True)
            self.temp_files.append(frames_dir)
            
            frames = []
            frame_count = 0
            
            # Utwórz strumień CUDA
            stream = cv2.cuda_Stream()
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                    
                if frame_count % frame_interval == 0:
                    # Przenieś frame na GPU
                    gpu_frame = cv2.cuda_GpuMat()
                    gpu_frame.upload(frame)
                    
                    # Przetwarzanie na GPU
                    gpu_frame = cv2.cuda.cvtColor(gpu_frame, cv2.COLOR_BGR2RGB)
                    
                    # Pobierz wynik z GPU
                    processed_frame = gpu_frame.download()
                    
                    frame_path = os.path.join(frames_dir, f"frame_{frame_count}.jpg")
                    cv2.imwrite(frame_path, processed_frame)
                    frames.append(frame_path)
                    
                frame_count += 1
                
            cap.release()
            return frames
            
        except Exception as e:
            logger.error(f"Błąd podczas ekstrakcji klatek na GPU: {e}")
            return self.extract_frames(frame_path)  # Fallback do CPU

    def detect_objects_gpu(self, frame_path: str) -> List[Dict[str, Any]]:
        """Wykrywa obiekty na klatce używając GPU jeśli dostępne."""
        try:
            if not self.gpu_enabled:
                return self.detect_objects(frame_path)
                
            img = cv2.imread(frame_path)
            if img is None:
                raise ValueError(f"Nie można odczytać klatki: {frame_path}")
                
            # Przenieś obraz na GPU
            gpu_img = cv2.cuda_GpuMat()
            gpu_img.upload(img)
            
            # Konwersja do skali szarości na GPU
            gpu_gray = cv2.cuda.cvtColor(gpu_img, cv2.COLOR_BGR2GRAY)
            
            # Detekcja krawędzi na GPU
            gpu_edges = cv2.cuda.createCannyEdgeDetector(
                self.config.edge_detection_threshold1,
                self.config.edge_detection_threshold2
            ).detect(gpu_gray)
            
            # Pobierz wyniki z GPU
            edges = gpu_edges.download()
            
            # Znajdź kontury (na CPU, bo nie ma GPU API)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            objects = []
            for contour in contours:
                area = cv2.contourArea(contour)
                if area > self.config.min_object_area:
                    x, y, w, h = cv2.boundingRect(contour)
                    aspect_ratio = float(w / h) if h > 0 else 0
                    extent = float(area / (w * h)) if w * h > 0 else 0
                    
                    objects.append({
                        'position': {'x': int(x), 'y': int(y), 'width': int(w), 'height': int(h)},
                        'area': float(area),
                        'perimeter': float(cv2.arcLength(contour, True)),
                        'aspect_ratio': aspect_ratio,
                        'extent': extent,
                        'type': self._classify_object_type(aspect_ratio, extent, area)
                    })
                    
            return objects
            
        except Exception as e:
            logger.error(f"Błąd podczas wykrywania obiektów na GPU: {e}")
            return self.detect_objects(frame_path)  # Fallback do CPU

    def process_frames_batch(self, frames: List[str], batch_size: int = 10) -> List[Dict[str, Any]]:
        """Przetwarza klatki wsadowo dla lepszej wydajności."""
        results = []
        
        for i in range(0, len(frames), batch_size):
            batch = frames[i:i + batch_size]
            
            with ThreadPoolExecutor(max_workers=self.config.max_workers) as executor:
                batch_results = list(executor.map(lambda f: {
                    'frame': f,
                    'analysis': self.analyze_frame(f),
                    'objects': self.detect_objects_gpu(f) if self.gpu_enabled else self.detect_objects(f),
                    'mood': self.analyze_scene_mood(f)
                }, batch))
                
            results.extend(batch_results)
            
        return results 

    def process_media(self, file_path: str) -> Dict[str, Any]:
        """
        Przetwarza plik multimedialny (wideo lub obraz) w zależności od formatu.
        
        Args:
            file_path: Ścieżka do pliku multimedialnego
            
        Returns:
            Dict zawierający wyniki przetwarzania
        """
        logger.info(f"Rozpoczęto przetwarzanie pliku: {file_path}")
        
        # Sprawdź rozszerzenie pliku
        extension = Path(file_path).suffix.lower()
        
        # Obsługiwane formaty
        video_formats = {'.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'}
        image_formats = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
        
        try:
            if extension in video_formats:
                return self.process_video(file_path)
            elif extension in image_formats:
                return self.process_image(file_path)
            else:
                raise ValueError(f"Nieobsługiwany format pliku: {extension}")
                
        except Exception as e:
            logger.error(f"Błąd podczas przetwarzania pliku {file_path}: {e}", exc_info=True)
            raise
            
    def process_image(self, image_path: str) -> Dict[str, Any]:
        """
        Przetwarza pojedynczy obraz.
        
        Args:
            image_path: Ścieżka do pliku obrazu
            
        Returns:
            Dict zawierający wyniki przetwarzania
        """
        logger.info(f"Rozpoczęto przetwarzanie obrazu: {image_path}")
        start_time = datetime.now()
        
        try:
            # Sprawdź cache
            cache_key = self.cache_manager._get_cache_key(image_path)
            cached_result = self.cache_manager.get(cache_key)
            if cached_result:
                logger.info(f"Znaleziono wyniki w cache'u dla: {image_path}")
                return cached_result
                
            with self.memory_manager.monitor_memory("przetwarzanie_obrazu"):
                # Wczytaj obraz
                if self.gpu_enabled:
                    gpu_img = cv2.cuda_GpuMat()
                    img = cv2.imread(image_path)
                    gpu_img.upload(img)
                    
                    # Przetwarzanie na GPU
                    result = self._process_image_gpu(gpu_img)
                else:
                    img = cv2.imread(image_path)
                    result = self._process_image_cpu(img)
                    
                # Dodaj informacje o czasie przetwarzania
                processing_time = (datetime.now() - start_time).total_seconds()
                result['processing_info'] = {
                    'processing_time': processing_time,
                    'gpu_enabled': self.gpu_enabled
                }
                
                # Zapisz do cache'a
                self.cache_manager.set(cache_key, result)
                
                logger.info(f"Zakończono przetwarzanie obrazu: {image_path} (czas: {processing_time:.2f}s)")
                return result
                
        except Exception as e:
            logger.error(f"Błąd podczas przetwarzania obrazu {image_path}: {e}", exc_info=True)
            raise
            
    def _process_image_gpu(self, gpu_img: cv2.cuda_GpuMat) -> Dict[str, Any]:
        """
        Przetwarza obraz na GPU.
        
        Args:
            gpu_img: Obraz na GPU
            
        Returns:
            Dict zawierający wyniki przetwarzania
        """
        try:
            # Konwersja do skali szarości
            gpu_gray = cv2.cuda.cvtColor(gpu_img, cv2.COLOR_BGR2GRAY)
            
            # Detekcja krawędzi
            gpu_edges = cv2.cuda.createCannyEdgeDetector(
                self.config.edge_detection_threshold1,
                self.config.edge_detection_threshold2
            ).detect(gpu_gray)
            
            # Pobierz wyniki z GPU
            img = gpu_img.download()
            edges = gpu_edges.download()
            gray = gpu_gray.download()
            
            return self._analyze_image(img, gray, edges)
            
        except Exception as e:
            logger.error(f"Błąd podczas przetwarzania obrazu na GPU: {e}")
            return self._process_image_cpu(gpu_img.download())
            
    def _process_image_cpu(self, img: np.ndarray) -> Dict[str, Any]:
        """
        Przetwarza obraz na CPU.
        
        Args:
            img: Obraz w formacie NumPy array
            
        Returns:
            Dict zawierający wyniki przetwarzania
        """
        # Konwersja do skali szarości
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detekcja krawędzi
        edges = cv2.Canny(
            gray,
            self.config.edge_detection_threshold1,
            self.config.edge_detection_threshold2
        )
        
        return self._analyze_image(img, gray, edges)
        
    def _analyze_image(self, img: np.ndarray, gray: np.ndarray, edges: np.ndarray) -> Dict[str, Any]:
        """
        Analizuje obraz i zwraca wyniki.
        
        Args:
            img: Oryginalny obraz
            gray: Obraz w skali szarości
            edges: Wykryte krawędzie
            
        Returns:
            Dict zawierający wyniki analizy
        """
        # Wykryj obiekty
        objects = self.detect_objects_gpu(img) if self.gpu_enabled else self.detect_objects(img)
        
        # Analizuj nastrój
        mood = self.analyze_scene_mood(img)
        
        # Generuj tagi
        tags = self.generate_tags(img)
        
        # Oblicz statystyki
        stats = {
            'brightness': float(np.mean(gray)),
            'contrast': float(np.std(gray)),
            'edges_density': float(np.mean(edges) / 255.0),
            'resolution': {
                'width': int(img.shape[1]),
                'height': int(img.shape[0])
            }
        }
        
        return {
            'objects': objects,
            'mood': mood,
            'tags': tags,
            'stats': stats
        } 