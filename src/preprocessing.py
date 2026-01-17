"""
Preprocessing Module - معالجة البيانات
==============================================
معالجة وتحضير البيانات للنمذجة
Data preprocessing and preparation for modeling
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')


class DataPreprocessor:
    """
    معالج البيانات - Data Preprocessor
    يتعامل مع جميع خطوات المعالجة المسبقة
    Handles all preprocessing steps
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = None
        
    def extract_date_features(self, df):
        """
        استخراج ميزات التاريخ - Extract date features
        
        Parameters:
        -----------
        df : pd.DataFrame
            البيانات مع عمود التاريخ - Data with Date column
            
        Returns:
        --------
        pd.DataFrame
            البيانات مع ميزات التاريخ المستخرجة
        """
        df = df.copy()
        df['Date'] = pd.to_datetime(df['Date'])
        
        # استخراج الميزات - Extract features
        df['year'] = df['Date'].dt.year
        df['month'] = df['Date'].dt.month
        df['week'] = df['Date'].dt.isocalendar().week
        df['day_of_week'] = df['Date'].dt.dayofweek
        df['quarter'] = df['Date'].dt.quarter
        df['day_of_year'] = df['Date'].dt.dayofyear
        
        # ميزات دورية - Cyclical features (أفضل للسلاسل الزمنية)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        df['day_of_week_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_of_week_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        
        return df
    
    def handle_missing_values(self, df, strategy='median'):
        """
        معالجة القيم المفقودة - Handle missing values
        
        Parameters:
        -----------
        df : pd.DataFrame
            البيانات - Data
        strategy : str
            الاستراتيجية: 'median', 'mean', 'forward_fill'
            
        Returns:
        --------
        pd.DataFrame
            البيانات بعد معالجة القيم المفقودة
        """
        df = df.copy()
        
        # الأعمدة الرقمية - Numerical columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            if df[col].isna().sum() > 0:
                if strategy == 'median':
                    df[col].fillna(df[col].median(), inplace=True)
                elif strategy == 'mean':
                    df[col].fillna(df[col].mean(), inplace=True)
                elif strategy == 'forward_fill':
                    df[col].fillna(method='ffill', inplace=True)
                    df[col].fillna(df[col].median(), inplace=True)  # للصفوف الأولى
        
        return df
    
    def encode_categorical(self, df, categorical_cols=None):
        """
        ترميز المتغيرات الفئوية - Encode categorical variables
        
        Parameters:
        -----------
        df : pd.DataFrame
            البيانات - Data
        categorical_cols : list
            الأعمدة الفئوية - Categorical columns
            
        Returns:
        --------
        pd.DataFrame
            البيانات مع ترميز الفئات
        """
        df = df.copy()
        
        if categorical_cols is None:
            categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
            # استبعاد التاريخ إذا كان موجوداً
            categorical_cols = [col for col in categorical_cols if col != 'Date']
        
        for col in categorical_cols:
            if col in df.columns:
                # استخدام One-Hot Encoding للسلع
                if col == 'ID_Commodity':
                    dummies = pd.get_dummies(df[col], prefix=col, drop_first=False)
                    df = pd.concat([df, dummies], axis=1)
                    df.drop(col, axis=1, inplace=True)
                
                # استخدام Label Encoding للفئات الأخرى
                elif col == 'Outlook_Production_Local':
                    # ترميز مخصص - Custom encoding
                    production_map = {'low': 1, 'medium': 2, 'high': 3}
                    
                    # التحقق إذا كانت البيانات نصية أم رقمية
                    if df[col].dtype == 'object' or isinstance(df[col].iloc[0], str):
                         df[f'{col}_encoded'] = df[col].map(production_map).fillna(2).astype(float) # Default to medium
                    else:
                        # إذا كانت رقمية (مثل 0.3, 0.6, 0.9) نقوم بتحويلها
                        # 0-0.4 -> 1 (Low), 0.4-0.75 -> 2 (Medium), >0.75 -> 3 (High)
                        conditions = [
                            (df[col] <= 0.4),
                            (df[col] > 0.4) & (df[col] <= 0.75),
                            (df[col] > 0.75)
                        ]
                        choices = [1.0, 2.0, 3.0]
                        df[f'{col}_encoded'] = np.select(conditions, choices, default=2.0)
                        
                    df.drop(col, axis=1, inplace=True)
                
                # Supply_Alert_Level (إذا كان موجوداً في البيانات)
                elif col == 'Supply_Alert_Level':
                    alert_map = {'Low': 0, 'Med': 1, 'High': 2}
                    df[f'{col}_encoded'] = df[col].map(alert_map).astype(float)
                    # نبقي العمود الأصلي للمرجعية
        
        return df
    
    def scale_features(self, df, columns_to_scale, fit=True):
        """
        تطبيع الميزات - Scale features
        
        Parameters:
        -----------
        df : pd.DataFrame
            البيانات - Data
        columns_to_scale : list
            الأعمدة المراد تطبيعها - Columns to scale
        fit : bool
            هل نحسب المعاملات أم نستخدم المحسوبة مسبقاً
            
        Returns:
        --------
        pd.DataFrame
            البيانات مع الميزات المطبعة
        """
        df = df.copy()
        
        if fit:
            df[columns_to_scale] = self.scaler.fit_transform(df[columns_to_scale])
        else:
            df[columns_to_scale] = self.scaler.transform(df[columns_to_scale])
        
        return df
    
    def prepare_for_modeling(self, df, target_col='Predicted_Landed_Cost', 
                            scale=True, handle_missing=True):
        """
        تحضير البيانات للنمذجة - Prepare data for modeling
        
        Parameters:
        -----------
        df : pd.DataFrame
            البيانات الأولية - Raw data
        target_col : str or None
            عمود الهدف - Target column (None for prediction on new data)
        scale : bool
            هل نطبّع البيانات - Whether to scale
        handle_missing : bool
            هل نعالج القيم المفقودة - Whether to handle missing values
            
        Returns:
        --------
        X : pd.DataFrame
            الميزات - Features
        y : pd.Series or None
            الهدف - Target (None if target_col is None)
        df_processed : pd.DataFrame
            البيانات المعالجة كاملة - Full processed data
        """
        df_processed = df.copy()
        
        # استخراج ميزات التاريخ - Extract date features
        if 'Date' in df_processed.columns:
            df_processed = self.extract_date_features(df_processed)
        
        # معالجة القيم المفقودة - Handle missing values
        if handle_missing:
            df_processed = self.handle_missing_values(df_processed)
        
        # ترميز الفئات - Encode categorical
        df_processed = self.encode_categorical(df_processed)
        
        # منع تسرب البيانات - Prevent Data Leakage
        # استبعاد المتغيرات التابعة (Target) ومشتقاتها
        cols_to_exclude = ['Date', 'Supply_Alert_Level', 'Supply_Alert_Level_encoded']
        if target_col is not None and target_col in df_processed.columns:
            cols_to_exclude.append(target_col)
        
        feature_cols = [col for col in df_processed.columns if col not in cols_to_exclude]
        
        X = df_processed[feature_cols].copy()
        y = df_processed[target_col].copy() if (target_col is not None and target_col in df_processed.columns) else None
        
        # تطبيع الميزات - Scale features
        if scale:
            # فقط الأعمدة الرقمية التي ليست مشفرة (encoded) لتجنب تشويه الفئات
            numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
            # استثناء الأعمدة المشفرة يدوياً
            cols_to_skip_scale = [c for c in numeric_cols if c.endswith('_encoded')]
            cols_to_scale_final = [c for c in numeric_cols if c not in cols_to_skip_scale]
            
            if cols_to_scale_final:
                X = self.scale_features(X, cols_to_scale_final, fit=True)
        
        self.feature_names = X.columns.tolist()
        
        return X, y, df_processed


def time_based_split(df, date_col='Date', train_ratio=0.8):
    """
    تقسيم زمني للبيانات - Time-based split
    
    Parameters:
    -----------
    df : pd.DataFrame
        البيانات - Data
    date_col : str
        عمود التاريخ - Date column
    train_ratio : float
        نسبة التدريب - Training ratio
        
    Returns:
    --------
    train_df, test_df : pd.DataFrame
        بيانات التدريب والاختبار - Train and test data
    """
    df = df.sort_values(date_col).reset_index(drop=True)
    
    split_idx = int(len(df) * train_ratio)
    
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()
    
    print(f"التقسيم الزمني - Time-based split:")
    print(f"  التدريب - Train: {len(train_df):,} صفوف ({train_ratio*100:.0f}%)")
    print(f"    من {train_df[date_col].min()} إلى {train_df[date_col].max()}")
    print(f"  الاختبار - Test: {len(test_df):,} صفوف ({(1-train_ratio)*100:.0f}%)")
    print(f"    من {test_df[date_col].min()} إلى {test_df[date_col].max()}")
    
    return train_df, test_df


if __name__ == "__main__":
    # اختبار المعالج - Test preprocessor
    print("=" * 60)
    print("اختبار معالج البيانات - Testing Data Preprocessor")
    print("=" * 60)
    
    # قراءة البيانات - Load data
    try:
        df = pd.read_csv('data/synthetic_supply_market.csv')
        print(f"\n✓ تم قراءة البيانات: {len(df)} صف")
        
        # تقسيم زمني - Time-based split
        train_df, test_df = time_based_split(df)
        
        # معالجة البيانات - Preprocess
        preprocessor = DataPreprocessor()
        X_train, y_train, train_processed = preprocessor.prepare_for_modeling(train_df)
        
        print(f"\n✓ عدد الميزات: {X_train.shape[1]}")
        print(f"  أسماء الميزات: {preprocessor.feature_names[:5]}...")
        
    except FileNotFoundError:
        print("\n⚠ لم يتم العثور على البيانات. قم بتشغيل data_generator.py أولاً")
        print("  Data not found. Run data_generator.py first")
