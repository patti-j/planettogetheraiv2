import os
import hashlib
import json
import joblib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any

class ModelCache:
    """Persistent disk-based model caching system"""
    
    def __init__(self, cache_dir: str = "models/cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_cache = {}
        self._load_metadata_index()
    
    def _generate_cache_key(self, model_type: str, forecast_days: int, item: str, 
                           planning_areas: Optional[List[str]] = None,
                           scenario_names: Optional[List[str]] = None,
                           hyperparameter_tuning: bool = False) -> str:
        """Generate stable hash key for caching including hierarchical filters and hyperparameter tuning flag"""
        key_components = [model_type, str(forecast_days), str(item)]
        
        # Add hyperparameter tuning flag to ensure tuned vs untuned models don't collide
        key_components.append(f"HPT:{hyperparameter_tuning}")
        
        # Add hierarchical filters to ensure unique keys per filter combination
        if planning_areas:
            key_components.append("PA:" + "|".join(sorted(planning_areas)))
        else:
            key_components.append("PA:none")
            
        if scenario_names:
            key_components.append("SC:" + "|".join(sorted(scenario_names)))
        else:
            key_components.append("SC:none")
        
        key_string = "_".join(key_components)
        return hashlib.md5(key_string.encode()).hexdigest()[:16]
    
    def _load_metadata_index(self):
        """Load metadata index for fast lookups"""
        try:
            index_file = self.cache_dir / "cache_index.json"
            if index_file.exists():
                with open(index_file, 'r') as f:
                    self.metadata_cache = json.load(f)
        except Exception:
            self.metadata_cache = {}
    
    def _save_metadata_index(self):
        """Save metadata index to disk"""
        try:
            index_file = self.cache_dir / "cache_index.json"
            with open(index_file, 'w') as f:
                json.dump(self.metadata_cache, f, indent=2)
        except Exception:
            pass
    
    def save_model(self, model_type: str, forecast_days: int, item: str, 
                   model: Any, metadata: Dict, 
                   planning_areas: Optional[List[str]] = None,
                   scenario_names: Optional[List[str]] = None,
                   hyperparameter_tuning: bool = False) -> str:
        """Save model and metadata to cache"""
        
        cache_key = self._generate_cache_key(
            model_type, forecast_days, item, planning_areas, scenario_names, hyperparameter_tuning
        )
        
        try:
            # Save model to disk
            model_file = self.cache_dir / f"{cache_key}.joblib"
            joblib.dump(model, model_file)
            
            # Prepare metadata
            full_metadata = {
                'model_type': model_type,
                'forecast_days': forecast_days,
                'item': str(item),
                'cache_key': cache_key,
                'cached_at': datetime.now().isoformat(),
                **metadata
            }
            
            # Save metadata
            meta_file = self.cache_dir / f"{cache_key}.meta.json"
            with open(meta_file, 'w') as f:
                json.dump(full_metadata, f, indent=2)
            
            # Update in-memory index
            self.metadata_cache[cache_key] = full_metadata
            self._save_metadata_index()
            
            return cache_key
            
        except Exception as e:
            print(f"Failed to save model to cache: {e}")
            return None
    
    def load_model(self, cache_key: str) -> Tuple[Optional[Any], Optional[Dict]]:
        """Load model and metadata from cache"""
        try:
            model_file = self.cache_dir / f"{cache_key}.joblib"
            meta_file = self.cache_dir / f"{cache_key}.meta.json"
            
            if not (model_file.exists() and meta_file.exists()):
                return None, None
            
            # Load model
            model = joblib.load(model_file)
            
            # Load metadata
            with open(meta_file, 'r') as f:
                metadata = json.load(f)
            
            return model, metadata
            
        except Exception as e:
            print(f"Failed to load model from cache: {e}")
            return None, None
    
    def exists(self, model_type: str, forecast_days: int, item: str,
               planning_areas: Optional[List[str]] = None,
               scenario_names: Optional[List[str]] = None,
               hyperparameter_tuning: bool = False) -> bool:
        """Check if model exists in cache"""
        
        cache_key = self._generate_cache_key(
            model_type, forecast_days, item, planning_areas, scenario_names, hyperparameter_tuning
        )
        
        return cache_key in self.metadata_cache
    
    def get_cache_key(self, model_type: str, forecast_days: int, item: str,
                      planning_areas: Optional[List[str]] = None,
                      scenario_names: Optional[List[str]] = None,
                      hyperparameter_tuning: bool = False) -> str:
        """Get cache key for configuration"""
        return self._generate_cache_key(
            model_type, forecast_days, item, planning_areas, scenario_names, hyperparameter_tuning
        )
    
    def delete_model(self, cache_key: str) -> bool:
        """Delete model and metadata from cache"""
        try:
            model_file = self.cache_dir / f"{cache_key}.joblib"
            meta_file = self.cache_dir / f"{cache_key}.meta.json"
            
            # Remove files if they exist
            if model_file.exists():
                model_file.unlink()
            if meta_file.exists():
                meta_file.unlink()
            
            # Remove from index
            if cache_key in self.metadata_cache:
                del self.metadata_cache[cache_key]
                self._save_metadata_index()
            
            return True
            
        except Exception as e:
            print(f"Failed to delete model from cache: {e}")
            return False
    
    def clear_all(self) -> int:
        """Clear all cached models"""
        deleted_count = 0
        for cache_key in list(self.metadata_cache.keys()):
            if self.delete_model(cache_key):
                deleted_count += 1
        return deleted_count

# Global cache instance
_model_cache = None

def get_model_cache() -> ModelCache:
    """Get global model cache instance"""
    global _model_cache
    if _model_cache is None:
        _model_cache = ModelCache()
    return _model_cache
