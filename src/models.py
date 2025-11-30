"""
Models Module - وحدة النماذج
==============================================
بناء وتدريب النماذج مع SHAP للتفسير
Build and train models with SHAP interpretation
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
import xgboost as xgb
import lightgbm as lgb
from sklearn.model_selection import RandomizedSearchCV
import shap
import joblib
import warnings
warnings.filterwarnings('ignore')

from utils import calculate_metrics, print_metrics, classify_alert_level


class BaselineModel:
    """
    نموذج الخط الأساسي - Baseline Linear Regression Model
    """
    
    def __init__(self):
        self.model = LinearRegression()
        self.name = "Linear Regression Baseline"
        
    def train(self, X_train, y_train):
        """تدريب النموذج - Train the model"""
        print(f"\n{'='*60}")
        print(f"تدريب {self.name} - Training {self.name}")
        print(f"{'='*60}")
        
        self.model.fit(X_train, y_train)
        print("✓ تم التدريب بنجاح - Training completed")
        
    def predict(self, X):
        """التنبؤ - Make predictions"""
        return self.model.predict(X)
    
    def evaluate(self, X_test, y_test):
        """تقييم النموذج - Evaluate model"""
        y_pred = self.predict(X_test)
        metrics = calculate_metrics(y_test, y_pred)
        print_metrics(metrics, self.name)
        return metrics, y_pred


class XGBoostModel:
    """
    نموذج XGBoost مع تحسين المعاملات - XGBoost Model with Hyperparameter Tuning
    """
    
    def __init__(self, random_state=42):
        self.random_state = random_state
        self.model = None
        self.best_params = None
        self.name = "XGBoost Regressor"
        self.feature_importance = None
        
    def train(self, X_train, y_train, tune_hyperparams=True, n_iter=20):
        """
        تدريب النموذج - Train the model
        
        Parameters:
        -----------
        X_train : pd.DataFrame
            ميزات التدريب - Training features
        y_train : pd.Series
            أهداف التدريب - Training targets
        tune_hyperparams : bool
            هل نحسّن المعاملات - Whether to tune hyperparameters
        n_iter : int
            عدد التكرارات للبحث العشوائي - Number of iterations for random search
        """
        print(f"\n{'='*60}")
        print(f"تدريب {self.name} - Training {self.name}")
        print(f"{'='*60}")
        
        if tune_hyperparams:
            print("تحسين المعاملات... - Tuning hyperparameters...")
            
            # نطاقات المعاملات - Parameter ranges
            param_distributions = {
                'max_depth': [3, 5, 7, 10],
                'learning_rate': [0.01, 0.05, 0.1, 0.2],
                'n_estimators': [100, 200, 300, 500],
                'min_child_weight': [1, 3, 5],
                'subsample': [0.6, 0.8, 1.0],
                'colsample_bytree': [0.6, 0.8, 1.0],
                'gamma': [0, 0.1, 0.2],
            }
            
            # النموذج الأساسي - Base model
            base_model = xgb.XGBRegressor(
                random_state=self.random_state,
                objective='reg:squarederror',
                tree_method='hist'
            )
            
            # البحث العشوائي - Random search
            random_search = RandomizedSearchCV(
                estimator=base_model,
                param_distributions=param_distributions,
                n_iter=n_iter,
                cv=3,
                scoring='neg_root_mean_squared_error',
                random_state=self.random_state,
                n_jobs=-1,
                verbose=1
            )
            
            random_search.fit(X_train, y_train)
            
            self.model = random_search.best_estimator_
            self.best_params = random_search.best_params_
            
            print(f"\n✓ أفضل المعاملات - Best parameters:")
            for param, value in self.best_params.items():
                print(f"  • {param}: {value}")
                
        else:
            # استخدام معاملات افتراضية جيدة - Use good default parameters
            self.model = xgb.XGBRegressor(
                max_depth=7,
                learning_rate=0.1,
                n_estimators=200,
                min_child_weight=3,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=self.random_state,
                objective='reg:squarederror',
                tree_method='hist'
            )
            
            self.model.fit(X_train, y_train)
        
        # حساب أهمية الميزات - Calculate feature importance
        self.feature_importance = pd.DataFrame({
            'feature': X_train.columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\n✓ تم التدريب بنجاح - Training completed")
        
    def predict(self, X):
        """التنبؤ - Make predictions"""
        if self.model is None:
            raise ValueError("النموذج غير مدرب! - Model not trained!")
        return self.model.predict(X)
    
    def evaluate(self, X_test, y_test):
        """تقييم النموذج - Evaluate model"""
        y_pred = self.predict(X_test)
        metrics = calculate_metrics(y_test, y_pred)
        print_metrics(metrics, self.name)
        return metrics, y_pred
    
    def get_feature_importance(self, top_n=15):
        """
        الحصول على أهمية الميزات - Get feature importance
        
        Parameters:
        -----------
        top_n : int
            عدد الميزات الأكثر أهمية - Number of top features
            
        Returns:
        --------
        pd.DataFrame
            جدول أهمية الميزات - Feature importance dataframe
        """
        if self.feature_importance is None:
            raise ValueError("لم يتم حساب أهمية الميزات - Feature importance not calculated")
        
        return self.feature_importance.head(top_n)
    
    def save_model(self, filepath='models/xgboost_model.joblib'):
        """حفظ النموذج - Save model"""
        joblib.dump(self.model, filepath)
        print(f"\n✓ تم حفظ النموذج في: {filepath}")
        print(f"  Model saved to: {filepath}")
        
    def load_model(self, filepath='models/xgboost_model.joblib'):
        """تحميل النموذج - Load model"""
        self.model = joblib.load(filepath)
        print(f"✓ تم تحميل النموذج من: {filepath}")
        print(f"  Model loaded from: {filepath}")


class SHAPAnalyzer:
    """
    محلل SHAP لتفسير النموذج - SHAP Analyzer for Model Interpretation
    """
    
    def __init__(self, model, X_data):
        """
        تهيئة محلل SHAP - Initialize SHAP analyzer
        
        Parameters:
        -----------
        model : trained model
            النموذج المدرب - Trained model
        X_data : pd.DataFrame
            بيانات الميزات - Feature data
        """
        print("\nإعداد محلل SHAP... - Initializing SHAP analyzer...")
        
        # نأخذ عينة إذا كانت البيانات كبيرة جداً - Sample if data is too large
        if len(X_data) > 1000:
            sample_size = 1000
            sample_indices = np.random.choice(len(X_data), sample_size, replace=False)
            self.X_sample = X_data.iloc[sample_indices]
        else:
            self.X_sample = X_data

        # استخدام Explainer العام لتجنب مشاكل التوافق مع XGBoost 3.x
        # Use generic Explainer to avoid compatibility issues with XGBoost 3.x
        print("Using generic shap.Explainer with model.predict...")
        # تحويل إلى numpy لتجنب مشاكل الأنواع - Convert to numpy to avoid type issues
        X_sample_np = self.X_sample.values if hasattr(self.X_sample, 'values') else self.X_sample
        self.explainer = shap.Explainer(model.predict, X_sample_np)
        
        print(f"حساب قيم SHAP لـ {len(self.X_sample)} عينة...")
        print(f"Calculating SHAP values for {len(self.X_sample)} samples...")
        
        # Explainer الجديد يعيد كائن Explanation
        # New Explainer returns Explanation object
        shap_obj = self.explainer(self.X_sample)
        self.shap_values = shap_obj.values
        self.feature_names = X_data.columns.tolist()
        
        print("✓ تم حساب قيم SHAP - SHAP values calculated")
    
    def get_driver_cost_key(self, X_instance=None):
        """
        الحصول على العامل الأكثر تأثيراً - Get the most influential cost driver
        
        Parameters:
        -----------
        X_instance : pd.Series or None
            حالة محددة أو None للمتوسط العام
            
        Returns:
        --------
        str or array
            اسم العامل الأكثر تأثيراً - Name of most influential driver
        """
        if X_instance is not None:
            # لحالة واحدة - For single instance
            # نحتاج تمرير DataFrame للحفاظ على أسماء الأعمدة
            if isinstance(X_instance, pd.Series):
                X_df = X_instance.to_frame().T
            else:
                X_df = pd.DataFrame([X_instance], columns=self.feature_names)
                
            shap_val = self.explainer(X_df).values[0]
            abs_shap = np.abs(shap_val)
            driver_idx = np.argmax(abs_shap)
            return self.feature_names[driver_idx]
        else:
            # للمتوسط العام - For overall average
            mean_abs_shap = np.abs(self.shap_values).mean(axis=0)
            driver_indices = np.argsort(mean_abs_shap)[::-1]
            
            # إرجاع أهم 3 عوامل - Return top 3 drivers
            top_drivers = [self.feature_names[i] for i in driver_indices[:3]]
            return top_drivers
    
    def get_driver_for_dataset(self, X_data):
        """
        الحصول على العامل الأكثر تأثيراً لكل صف - Get driver for each row
        
        Parameters:
        -----------
        X_data : pd.DataFrame
            البيانات - Data
            
        Returns:
        --------
        list
            قائمة العوامل - List of drivers
        """
        print("\nحساب العوامل الرئيسية لكل صف...")
        print("Calculating key drivers for each row...")
        
        drivers = []
        
        # معالجة على دفعات - Process in batches
        batch_size = 100
        for i in range(0, len(X_data), batch_size):
            batch = X_data.iloc[i:i+batch_size]
            # استخدام API الجديد
            batch_shap = self.explainer(batch).values
            
            for shap_val in batch_shap:
                abs_shap = np.abs(shap_val)
                driver_idx = np.argmax(abs_shap)
                drivers.append(self.feature_names[driver_idx])
        
        print(f"✓ تم حساب {len(drivers)} عامل رئيسي")
        return drivers
    
    def plot_summary(self, max_display=15):
        """رسم ملخص SHAP - Plot SHAP summary"""
        shap.summary_plot(self.shap_values, self.X_sample, 
                         feature_names=self.feature_names,
                         max_display=max_display,
                         show=False)
        return plt.gcf()
    
    def plot_bar(self, max_display=15):
        """رسم أهمية الميزات - Plot feature importance"""
        shap.summary_plot(self.shap_values, self.X_sample,
                         feature_names=self.feature_names,
                         plot_type='bar',
                         max_display=max_display,
                         show=False)
        return plt.gcf()


def predict_landed_cost(new_data_path, model_path='models/xgboost_model.joblib',
                       preprocessor=None, output_path='output/predictions.csv'):
    """
    دالة التنبؤ الرئيسية - Main prediction function
    
    Parameters:
    -----------
    new_data_path : str
        مسار البيانات الجديدة - Path to new data
    model_path : str
        مسار النموذج المحفوظ - Path to saved model
    preprocessor : DataPreprocessor
        معالج البيانات - Data preprocessor
    output_path : str
        مسار حفظ النتائج - Path to save results
        
    Returns:
    --------
    pd.DataFrame
        التوقعات - Predictions
    """
    print("\n" + "="*60)
    print("دالة التنبؤ - Prediction Function")
    print("="*60)
    
    # تحميل البيانات - Load data
    print(f"\n1. قراءة البيانات من: {new_data_path}")
    df = pd.read_csv(new_data_path)
    print(f"   ✓ تم قراءة {len(df):,} صف")
    
    # تحميل النموذج - Load model
    print(f"\n2. تحميل النموذج من: {model_path}")
    model = joblib.load(model_path)
    print("   ✓ تم التحميل")
    
    # معالجة البيانات - Preprocess data
    if preprocessor is not None:
        print("\n3. معالجة البيانات...")
        X, _, _ = preprocessor.prepare_for_modeling(df, scale=True, handle_missing=True)
        print(f"   ✓ الميزات جاهزة: {X.shape}")
    else:
        print("\n⚠ تحذير: لم يتم توفير معالج بيانات")
        X = df
    
    # التنبؤ - Predict
    print("\n4. التنبؤ...")
    predicted_costs = model.predict(X)
    print(f"   ✓ تم التنبؤ بـ {len(predicted_costs):,} قيمة")
    
    # تصنيف الإنذارات - Classify alerts
    print("\n5. تصنيف مستويات الإنذار...")
    alert_levels = classify_alert_level(predicted_costs, df['ID_Commodity'])
    print("   ✓ تم التصنيف")
    
    # حساب العوامل الرئيسية (مبسط) - Calculate key drivers (simplified)
    # نستخدم أهمية الميزات من النموذج - Use feature importance from model
    feature_importance = model.feature_importances_
    top_feature_idx = np.argmax(feature_importance)
    driver_cost_key = X.columns[top_feature_idx]
    drivers = [driver_cost_key] * len(predicted_costs)  # نفس العامل لجميع الصفوف (مبسط)
    
    # تجميع النتائج - Compile results
    print("\n6. تجميع النتائج...")
    results = pd.DataFrame({
        'Date': df['Date'],
        'ID_Commodity': df['ID_Commodity'],
        'Predicted_Landed_Cost': predicted_costs,
        'Supply_Alert_Level': alert_levels,
        'Driver_Cost_Key': drivers
    })
    
    # الحفظ - Save
    results.to_csv(output_path, index=False, encoding='utf-8-sig')
    print(f"\n✓ تم حفظ النتائج في: {output_path}")
    
    return results


if __name__ == "__main__":
    print("=" * 60)
    print("اختبار وحدة النماذج - Testing Models Module")
    print("=" * 60)
    print("\n⚠ يمكن تشغيل هذا الملف بعد إنشاء البيانات والمعالجة")
    print("  This file can be run after data generation and preprocessing")
