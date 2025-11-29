"""
Supply & Market Analysis Model
نموذج تحليل العرض والسوق

Main package for supply chain and market analysis
"""

__version__ = "1.0.0"
__author__ = "Supply & Market Analysis Team"

# استيراد الوحدات الرئيسية - Import main modules
from .data_generator import generate_data, save_data
from . preprocessing import DataPreprocessor, time_based_split
from .feature_engineering import engineer_all_features
from .models import BaselineModel, XGBoostModel, SHAPAnalyzer, predict_landed_cost
from .utils import (
    calculate_metrics,
    print_metrics,
    plot_predictions,
    plot_feature_importance,
    plot_time_series,
    export_predictions,
    classify_alert_level
)

__all__ = [
    # Data generation
    'generate_data',
    'save_data',
    
    # Preprocessing
    'DataPreprocessor',
    'time_based_split',
    
    # Feature engineering
    'engineer_all_features',
    
    # Models
    'BaselineModel',
    'XGBoostModel',
    'SHAPAnalyzer',
    'predict_landed_cost',
    
    # Utilities
    'calculate_metrics',
    'print_metrics',
    'plot_predictions',
    'plot_feature_importance',
    'plot_time_series',
    'export_predictions',
    'classify_alert_level',
]
