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
    
    def _generate_cache_key(self, schema: str, table: str, date_col: str, 
                           item_col: str, qty_col: str, model_type: str, 
                           forecast_days: int, item: str, 
                           planning_areas: Optional[List[str]] = None,
                           scenario_names: Optional[List[str]] = None,
                           hyperparameter_tuning: bool = False) -> str:
        """Generate stable hash key for caching based on database config and filters"""
        key_components = [
            schema, table, date_col, item_col, qty_col, 
            model_type, str(forecast_days), str(item)
        ]
        
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
    
    def save_model(self, schema: str, table: str, date_col: str, 
                   item_col: str, qty_col: str, model_type: str,
                   forecast_days: int, item: str, model: Any, 
                   metadata: Dict, planning_areas: Optional[List[str]] = None,
                   scenario_names: Optional[List[str]] = None,
                   hyperparameter_tuning: bool = False) -> Optional[str]:
        """Save model and metadata to persistent cache"""
        
        cache_key = self._generate_cache_key(
            schema, table, date_col, item_col, qty_col, 
            model_type, forecast_days, item, 
            planning_areas, scenario_names, hyperparameter_tuning
        )
        
        try:
            # Save model to disk using joblib
            model_file = self.cache_dir / f"{cache_key}.joblib"
            joblib.dump(model, model_file)
            
            # Save metadata (metrics, timestamps, config)
            full_metadata = {
                'schema': schema,
                'table': table,
                'date_col': date_col,
                'item_col': item_col,
                'qty_col': qty_col,
                'model_type': model_type,
                'forecast_days': forecast_days,
                'item': str(item),
                'cache_key': cache_key,
                'cached_at': datetime.now().isoformat(),
                'planning_areas': planning_areas,
                'scenario_names': scenario_names,
                'hyperparameter_tuning': hyperparameter_tuning,
                **metadata  # Includes MAE, MAPE, RMSE, data_points
            }
            
            # Save metadata
            meta_file = self.cache_dir / f"{cache_key}.meta.json"
            with open(meta_file, 'w') as f:
                json.dump(full_metadata, f, indent=2)
            
            # Update in-memory index
            self.metadata_cache[cache_key] = full_metadata
            self._save_metadata_index()
            
            print(f"Cached model for {item} with key {cache_key}")
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
    
    def exists(self, schema: str, table: str, date_col: str, 
               item_col: str, qty_col: str, model_type: str,
               forecast_days: int, item: str,
               planning_areas: Optional[List[str]] = None,
               scenario_names: Optional[List[str]] = None,
               hyperparameter_tuning: bool = False) -> bool:
        """Check if model exists in cache"""
        
        cache_key = self._generate_cache_key(
            schema, table, date_col, item_col, qty_col, 
            model_type, forecast_days, item, 
            planning_areas, scenario_names, hyperparameter_tuning
        )
        
        # Check both in-memory index and actual file existence
        model_file = self.cache_dir / f"{cache_key}.joblib"
        meta_file = self.cache_dir / f"{cache_key}.meta.json"
        
        return (cache_key in self.metadata_cache or 
                (model_file.exists() and meta_file.exists()))
    
    def get_cache_key(self, schema: str, table: str, date_col: str,
                      item_col: str, qty_col: str, model_type: str,
                      forecast_days: int, item: str,
                      planning_areas: Optional[List[str]] = None,
                      scenario_names: Optional[List[str]] = None,
                      hyperparameter_tuning: bool = False) -> str:
        """Get cache key for configuration"""
        return self._generate_cache_key(
            schema, table, date_col, item_col, qty_col, 
            model_type, forecast_days, item, 
            planning_areas, scenario_names, hyperparameter_tuning
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
    
    def get_cached_items(self, schema: str, table: str, date_col: str,
                         item_col: str, qty_col: str, model_type: str,
                         forecast_days: int, items: List[str],
                         planning_areas: Optional[List[str]] = None,
                         scenario_names: Optional[List[str]] = None,
                         hyperparameter_tuning: bool = False) -> Tuple[List[str], List[str]]:
        """Check which items have cached models and which need training"""
        cached_items = []
        missing_items = []
        
        for item in items:
            if self.exists(schema, table, date_col, item_col, qty_col, 
                          model_type, forecast_days, item, 
                          planning_areas, scenario_names, hyperparameter_tuning):
                cached_items.append(item)
            else:
                missing_items.append(item)
        
        return cached_items, missing_items
    
    def clear_all(self) -> int:
        """Clear all cached models"""
        deleted_count = 0
        for cache_key in list(self.metadata_cache.keys()):
            if self.delete_model(cache_key):
                deleted_count += 1
        return deleted_count
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        total_models = len(self.metadata_cache)
        total_size = 0
        
        for cache_key in self.metadata_cache:
            model_file = self.cache_dir / f"{cache_key}.joblib"
            if model_file.exists():
                total_size += model_file.stat().st_size
        
        return {
            'total_models': total_models,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'cache_dir': str(self.cache_dir)
        }

# Global cache instance
_model_cache = None

def get_model_cache() -> ModelCache:
    """Get global model cache instance"""
    global _model_cache
    if _model_cache is None:
        _model_cache = ModelCache()
    return _model_cache
