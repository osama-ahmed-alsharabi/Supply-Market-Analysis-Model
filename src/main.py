"""
Main Pipeline Script - ملف التشغيل الرئيسي
==============================================
Runs the complete workflow:
1. Generate Data
2. Preprocess
3. Train Model
4. Generate Predictions
"""

import os
import pandas as pd
import numpy as np
from data_generator import generate_data, save_data
from preprocessing import DataPreprocessor, time_based_split
from feature_engineering import engineer_all_features
from models import XGBoostModel, SHAPAnalyzer
from utils import calculate_metrics, print_metrics, export_predictions, classify_alert_level

def run_pipeline():
    print("🚀 Starting Supply & Market Analysis Pipeline...")
    
    # 1. Generate Data
    print("\n1️⃣  Generating Synthetic Data...")
    df = generate_data(n_rows=5000)
    save_data(df, filepath='data/synthetic_supply_market.csv')
    
    # 2. Preprocess & Feature Engineering
    print("\n2️⃣  Preprocessing & Feature Engineering...")
    # Split first to avoid leakage (though for time series we usually engineer then split, 
    # but here we follow the notebook logic: split then engineer or engineer then split?
    # In notebook we engineered then split. Let's follow notebook logic for consistency 
    # or better yet, engineer then split to ensure lag features are correct at boundaries if continuous)
    
    # Actually, for lag features, it's better to engineer on the whole dataset then split, 
    # provided we don't use future data.
    df_engineered = engineer_all_features(df)
    
    train_df, test_df = time_based_split(df_engineered, train_ratio=0.8)
    
    preprocessor = DataPreprocessor()
    X_train, y_train, _ = preprocessor.prepare_for_modeling(train_df, scale=True)
    
    # Prepare test data (transform only)
    # We need to process it to get the same features (date extraction, encoding)
    # but we shouldn't fit the scaler again.
    X_test, y_test, _ = preprocessor.prepare_for_modeling(test_df, scale=False)
    
    # Align columns to match training data (handle missing/extra categories)
    X_test = X_test.reindex(columns=X_train.columns, fill_value=0)
    
    # Scale test data using the scaler fitted on training data
    # Use feature_names_in_ to ensure we only scale columns that were seen during fit
    if hasattr(preprocessor.scaler, 'feature_names_in_'):
        cols_to_scale = preprocessor.scaler.feature_names_in_
        X_test = preprocessor.scale_features(X_test, cols_to_scale, fit=False)
    else:
        # Fallback if feature_names_in_ is not available (older sklearn)
        numeric_cols = X_test.select_dtypes(include=[np.number]).columns.tolist()
        # Filter to keep only those in X_train.columns (though we already reindexed)
        # This is risky if types changed, but best effort
        X_test = preprocessor.scale_features(X_test, numeric_cols, fit=False)
    
    # 3. Train Model
    print("\n3️⃣  Training XGBoost Model...")
    xgb_model = XGBoostModel()
    # Using fewer iterations for quick run
    xgb_model.train(X_train, y_train, tune_hyperparams=True, n_iter=5) 
    xgb_model.save_model('models/xgboost_model.joblib')
    
    # Evaluate
    metrics, preds = xgb_model.evaluate(X_test, y_test)
    
    # 4. Generate Predictions & Driver Keys
    print("\n4️⃣  Generating Predictions & Analysis...")
    
    # استخدام feature importance من XGBoost مباشرة بدلاً من SHAP
    # Use XGBoost feature importance directly instead of SHAP (compatibility issues)
    print("\nUsing XGBoost feature importance for driver cost keys...")
    
    # الحصول على أهم ميزة - Get top feature
    feature_importance = xgb_model.model.feature_importances_
    top_feature_idx = np.argmax(feature_importance)
    top_driver = X_test.columns[top_feature_idx]
    
    # استخدام نفس العامل لجميع الصفوف (مبسط)
    # Use same driver for all rows (simplified)
    drivers = [top_driver] * len(test_df)
    
    print(f"✓ Top cost driver: {top_driver}")
    
    alert_levels = classify_alert_level(preds, test_df['ID_Commodity'].values)
    
    predictions = {
        'predicted_cost': preds,
        'alert_level': alert_levels,
        'driver_cost_key': drivers
    }
    
    export_predictions(test_df, predictions, output_path='output/predictions.csv')
    
    print("\n✅ Pipeline Completed Successfully!")
    print("   - Model saved to models/xgboost_model.joblib")
    print("   - Predictions saved to output/predictions.csv")

if __name__ == "__main__":
    # Ensure directories exist
    os.makedirs('data', exist_ok=True)
    os.makedirs('models', exist_ok=True)
    os.makedirs('output', exist_ok=True)
    
    run_pipeline()
