import xgboost as xgb
import shap
import numpy as np
import json

print(f"XGBoost version: {xgb.__version__}")
print(f"SHAP version: {shap.__version__}")

X = np.random.rand(100, 5)
y = np.random.rand(100)

model = xgb.XGBRegressor(n_estimators=10)
model.fit(X, y)

booster = model.get_booster()
config = json.loads(booster.save_config())
print(f"Base score in config: {config.get('learner', {}).get('learner_model_param', {}).get('base_score')}")

print("\nTesting shap.TreeExplainer(model)...")
try:
    explainer = shap.TreeExplainer(model)
    print("Success!")
except Exception as e:
    print(f"Failed: {e}")

print("\nTesting shap.TreeExplainer(booster)...")
try:
    explainer = shap.TreeExplainer(booster)
    print("Success!")
except Exception as e:
    print(f"Failed: {e}")

print("\nTesting workaround: set base_score manually...")
try:
    booster = model.get_booster()
    # Try to force set base_score to a float string or just float
    # Note: XGBoost might still wrap it in list internally
    booster.set_param({'base_score': 0.5})
    
    explainer = shap.TreeExplainer(booster)
    print("Success with workaround!")
except Exception as e:
    print(f"Failed with workaround: {e}")

print("\nTesting shap.Explainer(model.predict, X)...")
try:
    # Use a small sample for background
    background = X[:10]
    explainer = shap.Explainer(model.predict, background)
    shap_values = explainer(X[:5])
    print("Success with model.predict!")
except Exception as e:
    print(f"Failed with model.predict: {e}")
