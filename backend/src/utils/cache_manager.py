"""
Cache management for script analysis results.
"""
import json
import hashlib
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from pathlib import Path

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self, cache_dir: str = 'cache', max_age_hours: int = 24):
        self.cache_dir = Path(cache_dir)
        self.max_age = timedelta(hours=max_age_hours)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
    def _generate_key(self, data: str) -> str:
        """
        Generate cache key from input data
        """
        return hashlib.md5(data.encode()).hexdigest()
        
    def _get_cache_path(self, key: str) -> Path:
        """
        Get cache file path for key
        """
        return self.cache_dir / f"{key}.json"
        
    def get(self, data: str) -> Optional[Dict]:
        """
        Get cached result for input data
        """
        key = self._generate_key(data)
        cache_path = self._get_cache_path(key)
        
        if not cache_path.exists():
            return None
            
        try:
            cache_data = json.loads(cache_path.read_text())
            cached_time = datetime.fromisoformat(cache_data['cached_at'])
            
            # Check if cache is expired
            if datetime.now() - cached_time > self.max_age:
                logger.info(f"Cache expired for key {key}")
                cache_path.unlink()
                return None
                
            logger.info(f"Cache hit for key {key}")
            return cache_data['result']
            
        except Exception as e:
            logger.error(f"Error reading cache for key {key}: {str(e)}")
            return None
            
    def set(self, data: str, result: Dict):
        """
        Cache result for input data
        """
        key = self._generate_key(data)
        cache_path = self._get_cache_path(key)
        
        try:
            cache_data = {
                'cached_at': datetime.now().isoformat(),
                'result': result
            }
            
            cache_path.write_text(json.dumps(cache_data))
            logger.info(f"Cached result for key {key}")
            
        except Exception as e:
            logger.error(f"Error caching result for key {key}: {str(e)}")
            
    def clear_expired(self):
        """
        Clear expired cache entries
        """
        now = datetime.now()
        cleared = 0
        
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                cache_data = json.loads(cache_file.read_text())
                cached_time = datetime.fromisoformat(cache_data['cached_at'])
                
                if now - cached_time > self.max_age:
                    cache_file.unlink()
                    cleared += 1
                    
            except Exception as e:
                logger.error(f"Error clearing cache file {cache_file}: {str(e)}")
                
        logger.info(f"Cleared {cleared} expired cache entries")
        
    def clear_all(self):
        """
        Clear all cache entries
        """
        cleared = 0
        
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                cache_file.unlink()
                cleared += 1
            except Exception as e:
                logger.error(f"Error clearing cache file {cache_file}: {str(e)}")
                
        logger.info(f"Cleared all {cleared} cache entries")
        
class MemoryCache:
    """
    In-memory cache for frequently accessed data
    """
    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self.cache = {}
        self.access_times = {}
        
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        """
        if key in self.cache:
            self.access_times[key] = datetime.now()
            return self.cache[key]
        return None
        
    def set(self, key: str, value: Any):
        """
        Set value in cache
        """
        # Clear space if needed
        if len(self.cache) >= self.max_size:
            # Remove least recently used item
            oldest_key = min(self.access_times.items(), key=lambda x: x[1])[0]
            del self.cache[oldest_key]
            del self.access_times[oldest_key]
            
        self.cache[key] = value
        self.access_times[key] = datetime.now()
        
    def clear(self):
        """
        Clear all cached values
        """
        self.cache.clear()
        self.access_times.clear() 