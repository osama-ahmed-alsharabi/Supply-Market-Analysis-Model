"""
Feature Engineering Module - هندسة الميزات
==============================================
إنشاء ميزات متقدمة من البيانات الأولية
Create advanced features from raw data
"""

import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')


def create_lag_features(df, columns, lags=[7, 30], group_col='ID_Commodity'):
    """
    إنشاء ميزات التأخير - Create lag features
    
    Parameters:
    -----------
    df : pd.DataFrame
        البيانات مرتبة حسب التاريخ - Data sorted by date
    columns : list
        الأعمدة المراد إنشاء تأخيرات لها - Columns to create lags for
    lags : list
        فترات التأخير بالأيام - Lag periods in days
    group_col : str
        عمود التجميع - Grouping column
        
    Returns:
    --------
    pd.DataFrame
        البيانات مع ميزات التأخير - Data with lag features
    """
    df = df.copy()
    df = df.sort_values('Date').reset_index(drop=True)
    
    for col in columns:
        for lag in lags:
            # تأخير بحسب المجموعة (السلعة) - Lag by group (commodity)
            lag_col_name = f'{col}_lag_{lag}d'
            df[lag_col_name] = df.groupby(group_col)[col].shift(lag)
    
    return df


def create_rolling_features(df, columns, windows=[7, 30], group_col='ID_Commodity'):
    """
    إنشاء ميزات المتوسطات المتحركة - Create rolling average features
    
    Parameters:
    -----------
    df : pd.DataFrame
        البيانات - Data
    columns : list
        الأعمدة - Columns
    windows : list
        نوافذ المتوسط - Rolling windows
    group_col : str
        عمود التجميع - Grouping column
        
    Returns:
    --------
    pd.DataFrame
        البيانات مع المتوسطات المتحركة - Data with rolling features
    """
    df = df.copy()
    df = df.sort_values('Date').reset_index(drop=True)
    
    for col in columns:
        for window in windows:
            # المتوسط المتحرك - Rolling mean
            ma_col_name = f'{col}_ma_{window}d'
            df[ma_col_name] = df.groupby(group_col)[col].transform(
                lambda x: x.rolling(window=window, min_periods=1).mean()
            )
            
            # الانحراف المعياري المتحرك - Rolling std
            std_col_name = f'{col}_std_{window}d'
            df[std_col_name] = df.groupby(group_col)[col].transform(
                lambda x: x.rolling(window=window, min_periods=1).std()
            )
    
    return df


def create_price_ratios(df):
    """
    إنشاء نسب السعر - Create price ratio features
    
    Parameters:
    -----------
    df : pd.DataFrame
        البيانات - Data
        
    Returns:
    --------
    pd.DataFrame
        البيانات مع نسب الأسعار - Data with price ratios
    """
    df = df.copy()
    
    # نسبة السعر الحالي إلى المتوسط المتحرك - Current price to MA ratio
    if 'Anomaly_Price_Global_ma_7d' in df.columns:
        df['price_to_ma7_ratio'] = df['Anomaly_Price_Global'] / (df['Anomaly_Price_Global_ma_7d'] + 1e-6)
    
    if 'Anomaly_Price_Global_ma_30d' in df.columns:
        df['price_to_ma30_ratio'] = df['Anomaly_Price_Global'] / (df['Anomaly_Price_Global_ma_30d'] + 1e-6)
    
    # نسبة التغير - Rate of change
    if 'Anomaly_Price_Global_lag_7d' in df.columns:
        df['price_change_7d'] = (df['Anomaly_Price_Global'] - df['Anomaly_Price_Global_lag_7d']) / (df['Anomaly_Price_Global_lag_7d'] + 1e-6)
    
    return df


def create_interaction_features(df):
    """
    إنشاء ميزات التفاعل - Create interaction features
    
    Parameters:
    -----------
    df : pd.DataFrame
        البيانات - Data
        
    Returns:
    --------
    pd.DataFrame
        البيانات مع ميزات التفاعل - Data with interaction features
    """
    df = df.copy()
    
    # تفاعل السعر مع تكلفة الشحن - Price × Shipping cost
    if 'Anomaly_Price_Global' in df.columns and 'Index_Cost_Shipping' in df.columns:
        df['price_shipping_interaction'] = df['Anomaly_Price_Global'] * df['Index_Cost_Shipping'] / 100
    
    # تفاعل المخاطر مع إجهاد سلسلة التوريد - Risk × Supply chain stress
    if 'Premium_Insurance_Risk_War' in df.columns and 'Index_Stress_Chain_Supply' in df.columns:
        df['risk_stress_interaction'] = df['Premium_Insurance_Risk_War'] * df['Index_Stress_Chain_Supply']
    
    # تفاعل الأخبار مع الأسعار - Sentiment × Price
    if 'News_Sentiment_Score' in df.columns and 'Anomaly_Price_Global' in df.columns:
        df['sentiment_price_interaction'] = df['News_Sentiment_Score'] * df['Anomaly_Price_Global']
    
    return df


def create_seasonal_features(df):
    """
    إنشاء ميزات موسمية إضافية - Create additional seasonal features
    
    Parameters:
    -----------
    df : pd.DataFrame
        البيانات مع ميزات التاريخ - Data with date features
        
    Returns:
    --------
    pd.DataFrame
        البيانات مع الميزات الموسمية - Data with seasonal features
    """
    df = df.copy()
    
    if 'month' in df.columns:
        # فصول السنة - Seasons
        season_map = {
            12: 'winter', 1: 'winter', 2: 'winter',
            3: 'spring', 4: 'spring', 5: 'spring',
            6: 'summer', 7: 'summer', 8: 'summer',
            9: 'fall', 10: 'fall', 11: 'fall'
        }
        df['season'] = df['month'].map(season_map)
        
        # ترميز الفصول - Encode seasons
        season_encoding = {'winter': 1, 'spring': 2, 'summer': 3, 'fall': 4}
        df['season_encoded'] = df['season'].map(season_encoding)
        df.drop('season', axis=1, inplace=True)
    
    # مؤشر منتصف الشهر - Mid-month indicator
    if 'Date' in df.columns:
        df['is_month_start'] = (pd.to_datetime(df['Date']).dt.day <= 10).astype(int)
        df['is_month_end'] = (pd.to_datetime(df['Date']).dt.day >= 20).astype(int)
    
    return df


def engineer_all_features(df, target_col='Predicted_Landed_Cost'):
    """
    تطبيق جميع هندسات الميزات - Apply all feature engineering
    
    Parameters:
    -----------
    df : pd.DataFrame
        البيانات الأولية - Raw data
    target_col : str
        عمود الهدف (لا نطبق عليه الهندسة) - Target column
        
    Returns:
    --------
    pd.DataFrame
        البيانات مع جميع الميزات المهندسة - Data with all engineered features
    """
    print("بدء هندسة الميزات - Starting feature engineering...")
    
    df = df.copy()
    initial_cols = len(df.columns)
    
    # التأكد من ترتيب البيانات - Ensure data is sorted
    df = df.sort_values('Date').reset_index(drop=True)
    
    # 1. ميزات التأخير - Lag features
    print("  • إنشاء ميزات التأخير - Creating lag features...")
    lag_columns = ['Anomaly_Price_Global', 'Index_Cost_Shipping', 'Index_Stress_Chain_Supply']
    df = create_lag_features(df, lag_columns, lags=[7, 30])
    
    # 2. المتوسطات المتحركة - Rolling features
    print("  • إنشاء المتوسطات المتحركة - Creating rolling features...")
    rolling_columns = ['Anomaly_Price_Global', 'Index_Stress_Chain_Supply']
    df = create_rolling_features(df, rolling_columns, windows=[7, 30])
    
    # 3. نسب الأسعار - Price ratios
    print("  • إنشاء نسب الأسعار - Creating price ratios...")
    df = create_price_ratios(df)
    
    # 4. ميزات التفاعل - Interaction features
    print("  • إنشاء ميزات التفاعل - Creating interaction features...")
    df = create_interaction_features(df)
    
    # 5. الميزات الموسمية - Seasonal features
    print("  • إنشاء الميزات الموسمية - Creating seasonal features...")
    df = create_seasonal_features(df)
    
    final_cols = len(df.columns)
    print(f"\n✓ تمت إضافة {final_cols - initial_cols} ميزة جديدة")
    print(f"  Added {final_cols - initial_cols} new features")
    print(f"  إجمالي الأعمدة - Total columns: {final_cols}")
    
    return df


if __name__ == "__main__":
    # اختبار هندسة الميزات - Test feature engineering
    print("=" * 60)
    print("اختبار هندسة الميزات - Testing Feature Engineering")
    print("=" * 60)
    
    try:
        # قراءة البيانات - Load data
        df = pd.read_csv('data/synthetic_supply_market.csv')
        print(f"\n✓ البيانات الأولية: {df.shape}")
        
        # تطبيق هندسة الميزات - Apply feature engineering
        df_engineered = engineer_all_features(df)
        print(f"\n✓ بعد الهندسة: {df_engineered.shape}")
        
        # عرض بعض الأعمدة الجديدة - Show some new columns
        new_cols = [col for col in df_engineered.columns if col not in df.columns]
        print(f"\nأمثلة على الميزات الجديدة - Sample new features:")
        for col in new_cols[:10]:
            print(f"  - {col}")
        
    except FileNotFoundError:
        print("\n⚠ لم يتم العثور على البيانات. قم بتشغيل data_generator.py أولاً")
