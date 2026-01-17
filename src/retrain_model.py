
import pandas as pd
import sys
import os

# Add src to path
sys.path.append('./src')

from data_generator import generate_data
from preprocessing import DataPreprocessor, time_based_split
from models import XGBoostModel, predict_landed_cost

def retrain_pipeline():
    print("=" * 60)
    print("إعادة تدريب النموذج - Retraining Model Pipeline")
    print("=" * 60)

    # 1. توليد بيانات جديدة - Generate Data
    print("\n1. توليد بيانات صناعية نظيفة...")
    df = generate_data(n_rows=5000)
    
    # 2. تقسيم البيانات - Split Data
    print("\n2. تقسيم البيانات...")
    train_df, test_df = time_based_split(df)
    
    # 3. المعالجة - Preprocessing
    print("\n3. معالجة البيانات...")
    preprocessor = DataPreprocessor()
    X_train, y_train, _ = preprocessor.prepare_for_modeling(train_df, target_col='Predicted_Landed_Cost')
    X_test, y_test, _ = preprocessor.prepare_for_modeling(test_df, target_col='Predicted_Landed_Cost')
    
    print(f"   Shape of X_train: {X_train.shape}")
    print(f"   Features: {X_train.columns.tolist()}")
    
    # التحقق من عدم وجود تسريب - Check for leaks
    if 'Supply_Alert_Level_encoded' in X_train.columns:
        raise ValueError("CRITICAL: Data Leakage detected! Supply_Alert_Level_encoded found in features.")
    
    # 4. التدريب - Training
    print("\n4. تدريب النموذج...")
    xgb_model = XGBoostModel()
    xgb_model.train(X_train, y_train, tune_hyperparams=False) # Skip tuning for speed, use defaults
    
    # 5. التقييم - Evaluation
    print("\n5. تقييم النموذج...")
    xgb_model.evaluate(X_test, y_test)
    
    # 6. الحفظ - Saving
    print("\n6. حفظ النموذج...")
    xgb_model.save_model()
    
    # 7. اختبار على بيانات المستخدم - Verify on User Data
    print("\n7. التحقق على بيانات المستخدم (إن وجدت)...")
    user_data_path = 'Haeel_Saeed_Supply_Market_Data.csv'
    if os.path.exists(user_data_path):
        try:
            print(f"   Testing prediction on {user_data_path}...")
            # We need to use the SAME preprocessor logic, so we pass it if possible or rely on the script
            # predict_landed_cost re-instantiates preprocessor if not passed, but we should test the flow
            
            # Note: predict_landed_cost in models.py instantiates new preprocessor inside engineer_all_features? 
            # No, predict_landed_cost calls engineer_all_features then preprocessor.
            # But wait, predict_landed_cost in models.py line 368 accepts preprocessor.
            
            results = predict_landed_cost(
                new_data_path=user_data_path,
                model_path='models/xgboost_model.joblib',
                preprocessor=preprocessor # Use the fitted preprocessor!
            )
            print("\n✓ النجاح! النموذج يعمل مع بيانات المستخدم.")
            print(results.head())
        except Exception as e:
            print(f"\n❌ فشل الاختبار على بيانات المستخدم: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"   User data file not found at {user_data_path}")

if __name__ == "__main__":
    retrain_pipeline()
