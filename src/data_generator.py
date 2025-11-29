"""
Data Generator Module - مولد البيانات
==============================================
هذا الملف مسؤول عن إنشاء بيانات صناعية واقعية لنموذج تحليل العرض والسوق
This module generates synthetic realistic data for the Supply & Market Analysis Model
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')


def generate_data(n_rows=5000, start_date='2023-01-01', random_seed=42):
    """
    إنشاء بيانات صناعية - Generate synthetic dataset
    
    Parameters:
    -----------
    n_rows : int
        عدد الصفوف المطلوبة - Number of rows to generate
    start_date : str
        تاريخ البداية - Start date
    random_seed : int
        البذرة للتكرارية - Random seed for reproducibility
        
    Returns:
    --------
    pd.DataFrame
        البيانات الصناعية المُولدة - Generated synthetic data
    """
    
    np.random.seed(random_seed)
    
    # توليد التواريخ - Generate dates
    start = pd.to_datetime(start_date)
    dates = [start + timedelta(days=i) for i in range(n_rows)]
    
    # السلع الأساسية - Commodities
    commodities = ['wheat', 'sugar', 'oil']
    commodity_ids = np.random.choice(commodities, n_rows)
    
    # استخراج ميزات التاريخ - Extract date features للموسمية
    df = pd.DataFrame({'Date': dates, 'ID_Commodity': commodity_ids})
    df['month'] = pd.to_datetime(df['Date']).dt.month
    df['year'] = pd.to_datetime(df['Date']).dt.year
    df['day_of_year'] = pd.to_datetime(df['Date']).dt.dayofyear
    
    # ============================================
    # توليد الميزات - Feature Generation
    # ============================================
    
    # 1. أسعار عالمية مع شذوذات - Global prices with anomalies
    base_prices = {
        'wheat': 250,  # USD per ton
        'sugar': 400,
        'oil': 1200
    }
    
    # إضافة اتجاه موسمي - Add seasonal trend
    seasonal_component = 50 * np.sin(2 * np.pi * df['day_of_year'] / 365)
    
    # إضافة اتجاه طويل المدى - Add long-term trend
    trend_component = np.linspace(0, 30, n_rows)
    
    # إضافة صدمات عشوائية - Add random shocks (anomalies)
    shock_indices = np.random.choice(n_rows, size=int(n_rows * 0.05), replace=False)
    shocks = np.zeros(n_rows)
    shocks[shock_indices] = np.random.uniform(50, 200, size=len(shock_indices))
    
    # السعر العالمي النهائي - Final global price
    df['Anomaly_Price_Global'] = df['ID_Commodity'].map(base_prices) + \
                                   seasonal_component + \
                                   trend_component + \
                                   shocks + \
                                   np.random.normal(0, 20, n_rows)
    
    # 2. مؤشر تكلفة الشحن - Shipping cost index (متأثر بالوقت والأحداث)
    df['Index_Cost_Shipping'] = 100 + \
                                 10 * np.sin(2 * np.pi * df['day_of_year'] / 365) + \
                                 np.random.normal(0, 15, n_rows) + \
                                 (df['year'] - df['year'].min()) * 5
    
    # 3. علاوة التأمين ضد المخاطر/الحرب - Insurance premium for war/risk (0-1)
    base_risk = 0.1
    risk_events = np.random.choice([0, 0, 0, 1], n_rows)  # 25% احتمال رفع المخاطر
    df['Premium_Insurance_Risk_War'] = base_risk + \
                                         risk_events * np.random.uniform(0.1, 0.4, n_rows) + \
                                         np.random.normal(0, 0.05, n_rows)
    df['Premium_Insurance_Risk_War'] = df['Premium_Insurance_Risk_War'].clip(0, 1)
    
    # 4. توقعات الإنتاج المحلي - Local production outlook
    production_categories = ['low', 'medium', 'high']
    production_probs = [0.3, 0.5, 0.2]
    df['Outlook_Production_Local'] = np.random.choice(
        production_categories, 
        n_rows, 
        p=production_probs
    )
    
    # تحويل لرقمي - Convert to numeric
    production_map = {'low': 0.3, 'medium': 0.6, 'high': 0.9}
    df['Outlook_Production_Local_Numeric'] = df['Outlook_Production_Local'].map(production_map)
    
    # 5. فارق سعر USD في السوق - USD price spread in market
    df['USD_Spread_Price_Market'] = np.random.normal(0, 10, n_rows) + \
                                     (df['year'] - df['year'].min()) * 2
    
    # 6. مؤشر إجهاد سلسلة التوريد - Supply chain stress index
    df['Index_Stress_Chain_Supply'] = 50 + \
                                        20 * np.sin(2 * np.pi * df['day_of_year'] / 365) + \
                                        np.random.normal(0, 10, n_rows) + \
                                        shocks * 0.3
    df['Index_Stress_Chain_Supply'] = df['Index_Stress_Chain_Supply'].clip(0, 100)
    
    # 7. نقاط تحليل المشاعر في الأخبار - News sentiment score (-1 to 1)
    # الأخبار السلبية ترفع التوتر والأسعار
    base_sentiment = 0.1  # إيجابي بشكل طفيف
    sentiment_volatility = 0.3
    df['News_Sentiment_Score'] = base_sentiment + \
                                  np.random.normal(0, sentiment_volatility, n_rows) + \
                                  -0.5 * (shocks > 0).astype(int)  # الصدمات تخفض المشاعر
    df['News_Sentiment_Score'] = df['News_Sentiment_Score'].clip(-1, 1)
    
    # 8. رسوم جمركية تقديرية - Customs fees estimate
    commodity_customs = {
        'wheat': 15,  # USD per ton
        'sugar': 25,
        'oil': 40
    }
    df['Customs_Fees_Estimate'] = df['ID_Commodity'].map(commodity_customs) + \
                                   np.random.normal(0, 5, n_rows)
    df['Customs_Fees_Estimate'] = df['Customs_Fees_Estimate'].clip(0, None)
    
    # ============================================
    # المتغير المستهدف - Target Variable
    # ============================================
    
    # التكلفة النهائية عند الوصول - Predicted Landed Cost
    # معادلة واقعية تعتمد على جميع العوامل
    df['Predicted_Landed_Cost'] = (
        df['Anomaly_Price_Global'] * 1.0 +  # السعر الأساسي
        df['Index_Cost_Shipping'] * 2.0 +   # تكلفة الشحن
        df['Premium_Insurance_Risk_War'] * 100 +  # التأمين
        -df['Outlook_Production_Local_Numeric'] * 50 +  # الإنتاج المحلي يقلل الحاجة للاستيراد
        df['USD_Spread_Price_Market'] * 1.5 +  # فارق العملة
        df['Index_Stress_Chain_Supply'] * 1.2 +  # إجهاد سلسلة التوريد
        -df['News_Sentiment_Score'] * 30 +  # الأخبار السلبية ترفع التكلفة
        df['Customs_Fees_Estimate'] * 1.0 +  # الرسوم الجمركية
        np.random.normal(0, 25, n_rows)  # ضوضاء عشوائية
    )
    
    # ============================================
    # مستوى الإنذار - Supply Alert Level
    # ============================================
    
    # حساب النسبة المئوية للزيادة عن المتوسط
    avg_cost = df.groupby('ID_Commodity')['Predicted_Landed_Cost'].transform('mean')
    pct_increase = (df['Predicted_Landed_Cost'] - avg_cost) / avg_cost * 100
    
    # تصنيف الإنذارات
    df['Supply_Alert_Level'] = pd.cut(
        pct_increase,
        bins=[-np.inf, 5, 15, np.inf],
        labels=['Low', 'Med', 'High']
    )
    
    # ============================================
    # إضافة بعض القيم المفقودة - Add some missing values (realistic)
    # ============================================
    missing_mask = np.random.random(n_rows) < 0.02  # 2% قيم مفقودة
    df.loc[missing_mask, 'News_Sentiment_Score'] = np.nan
    
    missing_mask_2 = np.random.random(n_rows) < 0.01  # 1% قيم مفقودة
    df.loc[missing_mask_2, 'Index_Stress_Chain_Supply'] = np.nan
    
    # ============================================
    # تنظيف وترتيب الأعمدة - Clean and order columns
    # ============================================
    
    final_columns = [
        'Date',
        'ID_Commodity',
        'Anomaly_Price_Global',
        'Index_Cost_Shipping',
        'Premium_Insurance_Risk_War',
        'Outlook_Production_Local',
        'USD_Spread_Price_Market',
        'Index_Stress_Chain_Supply',
        'News_Sentiment_Score',
        'Customs_Fees_Estimate',
        'Predicted_Landed_Cost',
        'Supply_Alert_Level'
    ]
    
    df_final = df[final_columns].copy()
    
    return df_final


def save_data(df, filepath='data/synthetic_supply_market.csv'):
    """
    حفظ البيانات - Save data to CSV
    
    Parameters:
    -----------
    df : pd.DataFrame
        البيانات المراد حفظها - Data to save
    filepath : str
        مسار الملف - File path
    """
    df.to_csv(filepath, index=False, encoding='utf-8-sig')
    print(f"Data saved to: {filepath}")
    print(f"Rows: {len(df):,} | Columns: {len(df.columns)}")

    

if __name__ == "__main__":
    # عند تشغيل الملف مباشرة - When running the file directly
    print("=" * 60)
    print("مولد بيانات نموذج تحليل العرض والسوق")
    print("Supply & Market Analysis - Data Generator")
    print("=" * 60)
    
    # توليد البيانات - Generate data
    df = generate_data(n_rows=5000)
    
    # عرض معلومات أساسية - Display basic info
    print("\nمعلومات البيانات - Data Info:")
    print(df.info())
    
    print("\nإحصائيات وصفية - Descriptive Statistics:")
    print(df[['Anomaly_Price_Global', 'Predicted_Landed_Cost']].describe())
    
    print("\nتوزيع الإنذارات - Alert Distribution:")
    print(df['Supply_Alert_Level'].value_counts())
    
    print("\nتوزيع السلع - Commodity Distribution:")
    print(df['ID_Commodity'].value_counts())
    
    # حفظ البيانات - Save data
    save_data(df)
