"""
Streamlit Dashboard - لوحة التحكم التفاعلية
==============================================
لوحة تفاعلية لعرض توقعات نموذج تحليل العرض والسوق
Interactive dashboard for Supply & Market Analysis Model predictions
"""

import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import sys
import os

# إضافة مسار src - Add src path
sys.path.append('./src')

from models import predict_landed_cost
from utils import calculate_metrics, classify_alert_level
import joblib

# إعدادات الصفحة - Page configuration
st.set_page_config(
    page_title="نموذج تحليل العرض والسوق",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS مخصص - Custom CSS
st.markdown("""
    <style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        padding: 1rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #1f77b4;
    }
    </style>
""", unsafe_allow_html=True)


@st.cache_data
def load_data(filepath):
    """تحميل البيانات - Load data"""
    return pd.read_csv(filepath)


@st.cache_resource
def load_model(model_path):
    """تحميل النموذج - Load model"""
    return joblib.load(model_path)


def main():
    """الدالة الرئيسية - Main function"""
    
    # العنوان الرئيسي - Main header
    st.markdown('<h1 class="main-header">📊 نموذج تحليل العرض والسوق<br>Supply & Market Analysis Dashboard</h1>', 
                unsafe_allow_html=True)
    
    # الشريط الجانبي - Sidebar
    st.sidebar.title("⚙️ الإعدادات - Settings")
    
    # اختيار الصفحة - Page selection
    page = st.sidebar.selectbox(
        "اختر الصفحة - Select Page",
        ["🏠 الرئيسية - Home", 
         "📈 التوقعات - Predictions", 
         "🔍 التحليل - Analysis",
         "⚡ تنبؤ جديد - New Prediction"]
    )
    
    # تحميل البيانات - Load data
    st.sidebar.markdown("---")
    st.sidebar.subheader("📂 البيانات - Data")
    
    try:
        # محاولة تحميل التوقعات - Try to load predictions
        if os.path.exists('output/predictions.csv'):
            predictions_df = load_data('output/predictions.csv')
            st.sidebar.success(f"✓ تم تحميل {len(predictions_df):,} توقع")
        else:
            predictions_df = None
            st.sidebar.warning("⚠ لا توجد توقعات متاحة")
        
        # تحميل البيانات الأصلية - Load original data
        if os.path.exists('data/synthetic_supply_market.csv'):
            original_df = load_data('data/synthetic_supply_market.csv')
            st.sidebar.success(f"✓ البيانات: {len(original_df):,} صف")
        else:
            original_df = None
            st.sidebar.warning("⚠ البيانات الأصلية غير موجودة")
            
    except Exception as e:
        st.sidebar.error(f"❌ خطأ في تحميل البيانات: {str(e)}")
        predictions_df = None
        original_df = None
    
    # الصفحات - Pages
    if page == "🏠 الرئيسية - Home":
        show_home(predictions_df, original_df)
    elif page == "📈 التوقعات - Predictions":
        show_predictions(predictions_df)
    elif page == "🔍 التحليل - Analysis":
        show_analysis(predictions_df, original_df)
    elif page == "⚡ تنبؤ جديد - New Prediction":
        show_new_prediction()


def show_home(predictions_df, original_df):
    """الصفحة الرئيسية - Home page"""
    
    st.markdown("## 🏠 نظرة عامة - Overview")
    
    # معلومات المشروع - Project info
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("""
        ### عن النموذج - About the Model
        
        نموذج تحليل العرض والسوق هو نموذج تعلم آلي متقدم يستخدم **XGBoost** لتوقع:
        - **التكلفة المتوقعة عند الوصول** (USD/ton)
        - **مستوى إنذار العرض** (Low/Med/High)
        - **العامل الأكثر تأثيراً** على التكلفة
        
        ---
        
        This Supply & Market Analysis Model uses **XGBoost** to predict:
        - **Predicted Landed Cost** (USD/ton)
        - **Supply Alert Level** (Low/Med/High)
        - **Key Cost Driver** affecting the cost
        """)
    
    with col2:
        st.info("""
        **الميزات الرئيسية**
        
        ✅ دقة عالية (R² > 0.90)
        
        ✅ تفسير واضح مع SHAP
        
        ✅ تحديث في الوقت الفعلي
        
        ✅ تنبيهات تلقائية
        """)
    
    st.markdown("---")
    
    # إحصائيات سريعة - Quick stats
    if predictions_df is not None:
        st.markdown("### 📊 إحصائيات سريعة - Quick Statistics")
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                label="إجمالي التوقعات - Total Predictions",
                value=f"{len(predictions_df):,}"
            )
        
        with col2:
            avg_cost = predictions_df['Predicted_Landed_Cost'].mean()
            st.metric(
                label="متوسط التكلفة - Avg Cost",
                value=f"${avg_cost:,.0f}"
            )
        
        with col3:
            high_alerts = (predictions_df['Supply_Alert_Level'] == 'High').sum()
            st.metric(
                label="إنذارات عالية - High Alerts",
                value=high_alerts,
                delta=f"{high_alerts/len(predictions_df)*100:.1f}%"
            )
        
        with col4:
            commodities = predictions_df['ID_Commodity'].nunique()
            st.metric(
                label="السلع - Commodities",
                value=commodities
            )
        
        st.markdown("---")
        
        # رسم توزيع الإنذارات - Alert distribution chart
        st.markdown("### 🚨 توزيع الإنذارات - Alert Distribution")
        
        alert_counts = predictions_df['Supply_Alert_Level'].value_counts()
        
        fig = go.Figure(data=[go.Pie(
            labels=alert_counts.index,
            values=alert_counts.values,
            hole=0.4,
            marker=dict(colors=['green', 'orange', 'red']),
            textinfo='label+percent'
        )])
        
        fig.update_layout(
            title="توزيع مستويات الإنذار - Alert Level Distribution",
            height=400
        )
        
        st.plotly_chart(fig, use_container_width=True)


def show_predictions(predictions_df):
    """صفحة التوقعات - Predictions page"""
    
    st.markdown("## 📈 التوقعات - Predictions")
    
    if predictions_df is None:
        st.warning("⚠ لا توجد توقعات متاحة. يرجى تشغيل النموذج أولاً.")
        return
    
    # تحويل التاريخ - Convert date
    predictions_df['Date'] = pd.to_datetime(predictions_df['Date'])
    
    # فلترة حسب السلعة - Filter by commodity
    st.sidebar.markdown("---")
    st.sidebar.subheader("🔍 الفلاتر - Filters")
    
    selected_commodity = st.sidebar.multiselect(
        "اختر السلعة - Select Commodity",
        options=predictions_df['ID_Commodity'].unique(),
        default=predictions_df['ID_Commodity'].unique()
    )
    
    selected_alert = st.sidebar.multiselect(
        "مستوى الإنذار - Alert Level",
        options=['Low', 'Med', 'High'],
        default=['Low', 'Med', 'High']
    )
    
    # تطبيق الفلاتر - Apply filters
    filtered_df = predictions_df[
        (predictions_df['ID_Commodity'].isin(selected_commodity)) &
        (predictions_df['Supply_Alert_Level'].isin(selected_alert))
    ]
    
    st.info(f"عرض {len(filtered_df):,} من {len(predictions_df):,} توقع")
    
    # رسم السلسلة الزمنية - Time series plot
    st.markdown("### 📊 التكلفة عبر الزمن - Cost Over Time")
    
    fig = px.line(
        filtered_df,
        x='Date',
        y='Predicted_Landed_Cost',
        color='ID_Commodity',
        title='التكلفة المتوقعة عبر الزمن - Predicted Cost Over Time',
        labels={'Predicted_Landed_Cost': 'التكلفة (USD/ton)', 'Date': 'التاريخ'}
    )
    
    fig.update_layout(height=500, hovermode='x unified')
    st.plotly_chart(fig, use_container_width=True)
    
    # جدول البيانات - Data table
    st.markdown("### 📋 جدول التوقعات - Predictions Table")
    
    # عرض البيانات - Display data
    st.dataframe(
        filtered_df.sort_values('Date', ascending=False).head(100),
        use_container_width=True,
        height=400
    )
    
    # تنزيل البيانات - Download data
    csv = filtered_df.to_csv(index=False, encoding='utf-8-sig')
    st.download_button(
        label="📥 تنزيل البيانات - Download Data (CSV)",
        data=csv,
        file_name=f"predictions_{datetime.now().strftime('%Y%m%d')}.csv",
        mime="text/csv"
    )


def show_analysis(predictions_df, original_df):
    """صفحة التحليل - Analysis page"""
    
    st.markdown("## 🔍 التحليل المتقدم - Advanced Analysis")
    
    if predictions_df is None:
        st.warning("⚠ لا توجد بيانات للتحليل")
        return
    
    # تحليل الإنذارات حسب السلعة - Alerts by commodity
    st.markdown("### 📊 الإنذارات حسب السلعة - Alerts by Commodity")
    
    alert_by_commodity = pd.crosstab(
        predictions_df['ID_Commodity'],
        predictions_df['Supply_Alert_Level'],
        normalize='index'
    ) * 100
    
    fig = go.Figure()
    
    for alert_level, color in zip(['Low', 'Med', 'High'], ['green', 'orange', 'red']):
        if alert_level in alert_by_commodity.columns:
            fig.add_trace(go.Bar(
                name=alert_level,
                x=alert_by_commodity.index,
                y=alert_by_commodity[alert_level],
                marker_color=color
            ))
    
    fig.update_layout(
        barmode='stack',
        title='توزيع الإنذارات حسب السلعة (%) - Alert Distribution by Commodity (%)',
        xaxis_title='السلعة - Commodity',
        yaxis_title='النسبة المئوية - Percentage (%)',
        height=400
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # العوامل الأكثر تأثيراً - Most frequent drivers
    st.markdown("### 🔑 العوامل الأكثر تأثيراً - Most Influential Drivers")
    
    driver_counts = predictions_df['Driver_Cost_Key'].value_counts().head(10)
    
    fig = px.bar(
        x=driver_counts.values,
        y=driver_counts.index,
        orientation='h',
        title='أكثر 10 عوامل تأثيراً - Top 10 Cost Drivers',
        labels={'x': 'التكرار - Frequency', 'y': 'العامل - Driver'}
    )
    
    fig.update_layout(height=400)
    st.plotly_chart(fig, use_container_width=True)
    
    # إحصائيات التكلفة - Cost statistics
    st.markdown("### 💰 إحصائيات التكلفة - Cost Statistics")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### حسب السلعة - By Commodity")
        cost_stats = predictions_df.groupby('ID_Commodity')['Predicted_Landed_Cost'].agg([
            ('المتوسط - Mean', 'mean'),
            ('الحد الأدنى - Min', 'min'),
            ('الحد الأقصى - Max', 'max'),
            ('الانحراف المعياري - Std', 'std')
        ]).round(2)
        st.dataframe(cost_stats, use_container_width=True)
    
    with col2:
        st.markdown("#### حسب مستوى الإنذار - By Alert Level")
        alert_stats = predictions_df.groupby('Supply_Alert_Level')['Predicted_Landed_Cost'].agg([
            ('المتوسط - Mean', 'mean'),
            ('الحد الأدنى - Min', 'min'),
            ('الحد الأقصى - Max', 'max'),
            ('العدد - Count', 'count')
        ]).round(2)
        st.dataframe(alert_stats, use_container_width=True)


def show_new_prediction():
    """صفحة التنبؤ الجديد - New prediction page"""
    
    st.markdown("## ⚡ تنبؤ جديد - New Prediction")
    
    st.info("""
    قم برفع ملف CSV يحتوي على البيانات الجديدة للحصول على التوقعات
    
    Upload a CSV file with new data to get predictions
    """)
    
    # رفع الملف - File upload
    uploaded_file = st.file_uploader(
        "اختر ملف CSV - Choose CSV file",
        type=['csv']
    )
    
    if uploaded_file is not None:
        try:
            # قراءة الملف - Read file
            new_data = pd.read_csv(uploaded_file)
            
            st.success(f"✓ تم تحميل {len(new_data):,} صف")
            
            # عرض البيانات - Show data
            st.markdown("### معاينة البيانات - Data Preview")
            st.dataframe(new_data.head(10), use_container_width=True)
            
            # زر التنبؤ - Predict button
            if st.button("🚀 بدء التنبؤ - Start Prediction", type="primary"):
                with st.spinner("جارٍ التنبؤ... - Predicting..."):
                    try:
                        # حفظ مؤقت - Temporary save
                        temp_path = 'data/temp_upload.csv'
                        new_data.to_csv(temp_path, index=False)
                        
                        # التنبؤ - Predict
                        # ملاحظة: يحتاج لمعالج بيانات - Note: needs preprocessor
                        st.warning("⚠ هذه الميزة تحتاج لإعداد إضافي. يرجى استخدام الدالة predict_landed_cost() من الكود")
                        
                        # يمكن تفعيلها بعد التأكد من المعالج - Can be activated after preprocessor setup
                        # results = predict_landed_cost(temp_path)
                        # st.success("✓ تم التنبؤ بنجاح")
                        # st.dataframe(results)
                        
                    except Exception as e:
                        st.error(f"❌ خطأ في التنبؤ: {str(e)}")
        
        except Exception as e:
            st.error(f"❌ خطأ في قراءة الملف: {str(e)}")
    
    # نموذج إدخال يدوي - Manual input form
    st.markdown("---")
    st.markdown("### أو أدخل البيانات يدوياً - Or Enter Data Manually")
    
    with st.form("manual_input"):
        col1, col2 = st.columns(2)
        
        with col1:
            commodity = st.selectbox("السلعة - Commodity", ['wheat', 'sugar', 'oil'])
            global_price = st.number_input("السعر العالمي - Global Price (USD/ton)", 
                                          value=300.0, min_value=0.0)
            shipping_cost = st.number_input("تكلفة الشحن - Shipping Cost Index", 
                                           value=100.0, min_value=0.0)
            insurance = st.slider("التأمين/المخاطر - Insurance/Risk", 
                                 min_value=0.0, max_value=1.0, value=0.1)
        
        with col2:
            production = st.selectbox("الإنتاج المحلي - Local Production", 
                                     ['low', 'medium', 'high'])
            usd_spread = st.number_input("فارق USD - USD Spread", 
                                        value=0.0)
            supply_stress = st.slider("إجهاد سلسلة التوريد - Supply Chain Stress", 
                                     min_value=0, max_value=100, value=50)
            sentiment = st.slider("تحليل المشاعر - Sentiment Score", 
                                 min_value=-1.0, max_value=1.0, value=0.0)
        
        submitted = st.form_submit_button("🎯 احسب التوقع - Calculate Prediction")
        
        if submitted:
            st.info("💡 هذه الميزة قيد التطوير - This feature is under development")


if __name__ == "__main__":
    main()
