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
    
    def normalize_cache_context(self, schema: str, table_name: str, date_col: str, 
                               item_col: str, qty_col: str, planning_areas: List[str] = None,
                               scenario_names: List[str] = None) -> Dict[str, Any]:
        """Normalize cache context to ensure consistent key generation"""
        # Remove brackets and schema qualifiers from table name
        clean_table = table_name
        if '.' in clean_table:
            clean_table = clean_table.split('.')[-1]
        clean_table = clean_table.strip('[]')
        
        # Remove brackets from column names
        clean_date_col = date_col.strip('[]')
        clean_item_col = item_col.strip('[]')
        clean_qty_col = qty_col.strip('[]')
        
        # Ensure planning areas and scenario names are sorted lists
        normalized_planning_areas = sorted(planning_areas) if planning_areas else None
        normalized_scenario_names = sorted(scenario_names) if scenario_names else None
        
        return {
            'schema': schema,
            'table': clean_table,
            'date_col': clean_date_col,
            'item_col': clean_item_col,
            'qty_col': clean_qty_col,
            'planning_areas': normalized_planning_areas,
            'scenario_names': normalized_scenario_names
        }
    
    def _generate_cache_key(self, schema: str, table: str, date_col: str, 
                           item_col: str, qty_col: str, model_type: str, 
                           forecast_days: int, item: str, 
                           planning_areas: Optional[List[str]] = None,
                           scenario_names: Optional[List[str]] = None) -> str:
        """Generate stable hash key for caching including hierarchical filters"""
        key_components = [
            schema, table, date_col, item_col, qty_col, 
            model_type, str(item)
        ]
        
        # Add hierarchical filters to ensure unique keys per filter combination
        if planning_areas:
            # Sort to ensure consistent key regardless of order
            key_components.append("PA:" + "|".join(sorted(planning_areas)))
        else:
            key_components.append("PA:none")
            
        if scenario_names:
            # Sort to ensure consistent key regardless of order
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
                   scenario_names: Optional[List[str]] = None) -> str:
        """Save model and metadata to cache"""
        
        # Normalize inputs for consistent cache keys
        normalized = self.normalize_cache_context(
            schema, table, date_col, item_col, qty_col, 
            planning_areas, scenario_names
        )
        
        cache_key = self._generate_cache_key(
            normalized['schema'], normalized['table'], normalized['date_col'], 
            normalized['item_col'], normalized['qty_col'], 
            model_type, forecast_days, item, 
            normalized['planning_areas'], normalized['scenario_names']
        )
        
        # Model will be saved with cache key
        
        try:
            # Save model to disk
            model_file = self.cache_dir / f"{cache_key}.joblib"
            joblib.dump(model, model_file)
            
            # Prepare metadata
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
    
    def exists(self, schema: str, table: str, date_col: str,
               item_col: str, qty_col: str, model_type: str,
               forecast_days: int, item: str, 
               planning_areas: Optional[List[str]] = None,
               scenario_names: Optional[List[str]] = None) -> bool:
        """Check if model exists in cache"""
        
        # Use same normalization as save_model and get_cache_key
        normalized = self.normalize_cache_context(
            schema, table, date_col, item_col, qty_col, 
            planning_areas, scenario_names
        )
        
        cache_key = self._generate_cache_key(
            normalized['schema'], normalized['table'], normalized['date_col'], 
            normalized['item_col'], normalized['qty_col'], 
            model_type, forecast_days, item, 
            normalized['planning_areas'], normalized['scenario_names']
        )
        
        # Check cache existence
        
        return cache_key in self.metadata_cache
    
    def get_cache_key(self, schema: str, table: str, date_col: str,
                      item_col: str, qty_col: str, model_type: str,
                      forecast_days: int, item: str,
                      planning_areas: Optional[List[str]] = None,
                      scenario_names: Optional[List[str]] = None) -> str:
        """Get cache key for configuration"""
        # Normalize inputs for consistent cache keys
        normalized = self.normalize_cache_context(
            schema, table, date_col, item_col, qty_col, 
            planning_areas, scenario_names
        )
        
        cache_key = self._generate_cache_key(
            normalized['schema'], normalized['table'], normalized['date_col'], 
            normalized['item_col'], normalized['qty_col'], 
            model_type, forecast_days, item, 
            normalized['planning_areas'], normalized['scenario_names']
        )
        
        # Generate cache key for lookup
        
        return cache_key
    
    def get_cached_items(self, schema: str, table: str, date_col: str,
                        item_col: str, qty_col: str, model_type: str,
                        forecast_days: int, items: List[str],
                        planning_areas: Optional[List[str]] = None,
                        scenario_names: Optional[List[str]] = None) -> Tuple[List[str], List[str]]:
        """Get which items have cached models vs need training"""
        
        cached_items = []
        missing_items = []
        
        for item in items:
            if self.exists(schema, table, date_col, item_col, qty_col, 
                          model_type, forecast_days, item, planning_areas, scenario_names):
                cached_items.append(item)
            else:
                missing_items.append(item)
        
        return cached_items, missing_items
    
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
    
    def clear_cache_for_config(self, schema: str, table: str, date_col: str,
                              item_col: str, qty_col: str, model_type: str,
                              forecast_days: int, items: List[str],
                              planning_areas: Optional[List[str]] = None,
                              scenario_names: Optional[List[str]] = None) -> int:
        """Clear all cached models for given configuration"""
        
        deleted_count = 0
        for item in items:
            cache_key = self._generate_cache_key(
                schema, table, date_col, item_col, qty_col,
                model_type, forecast_days, item, planning_areas, scenario_names
            )
            if self.delete_model(cache_key):
                deleted_count += 1
        
        return deleted_count
    
    def get_cache_info(self, schema: str, table: str, date_col: str,
                      item_col: str, qty_col: str, model_type: str,
                      forecast_days: int, items: List[str],
                      planning_areas: Optional[List[str]] = None,
                      scenario_names: Optional[List[str]] = None) -> Dict:
        """Get cache information for display"""
        
        cached_items, missing_items = self.get_cached_items(
            schema, table, date_col, item_col, qty_col, 
            model_type, forecast_days, items, planning_areas, scenario_names
        )
        
        cache_info = []
        for item in cached_items:
            cache_key = self._generate_cache_key(
                schema, table, date_col, item_col, qty_col,
                model_type, forecast_days, item, planning_areas, scenario_names
            )
            if cache_key in self.metadata_cache:
                metadata = self.metadata_cache[cache_key]
                cache_info.append({
                    'item': item,
                    'cached_at': metadata.get('cached_at', 'Unknown'),
                    'metrics': {
                        k: v for k, v in metadata.items() 
                        if k in ['mae', 'mape', 'rmse', 'data_points']
                    }
                })
        
        return {
            'total_items': len(items),
            'cached_count': len(cached_items),
            'missing_count': len(missing_items),
            'cached_items': cached_items,
            'missing_items': missing_items,
            'cache_details': cache_info
        }

# Global cache instance
_model_cache = None

def get_model_cache() -> ModelCache:
    """Get global model cache instance"""
    global _model_cache
    if _model_cache is None:
        _model_cache = ModelCache()
    return _model_cache