"""
نموذج تحليل العرض والسوق لمجموعة هائل سعيد
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

sys.path.append('./src')

from models import predict_landed_cost
from utils import calculate_metrics, classify_alert_level

import joblib

st.set_page_config(
    page_title="نموذج تحليل العرض والسوق",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
    
    * {
        font-family: 'Tajawal', 'Poppins', sans-serif;
        margin: 0;
        padding: 0;
    }
    
    .stApp {
        background: #0a0a0a;
        background-image: 
            radial-gradient(circle at 20% 50%, rgba(0, 217, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(0, 217, 255, 0.03) 0%, transparent 50%);
    }
    
    .main-header {
        font-size: 3rem;
        font-weight: 900;
        color: #ffffff;
        text-align: center;
        padding: 2rem 1rem;
        letter-spacing: -1px;
        position: relative;
    }
    
    .main-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 4px;
        background: linear-gradient(90deg, transparent, #00D9FF, transparent);
        border-radius: 2px;
    }
    
    [data-testid="stSidebar"] {
        background: #0f0f0f;
        border-right: 1px solid rgba(0, 217, 255, 0.1);
    }
    
    [data-testid="stSidebar"] * {
        color: #ffffff !important;
    }
    
    [data-testid="stSidebar"] h1,
    [data-testid="stSidebar"] h2,
    [data-testid="stSidebar"] h3 {
        color: #00D9FF !important;
        font-weight: 700;
    }
    
    [data-testid="stMetric"] {
        background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
        padding: 2rem 1.5rem;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        transition: all 0.4s ease;
    }
    
    [data-testid="stMetric"]:hover {
        transform: translateY(-8px);
        border-color: rgba(0, 217, 255, 0.3);
        box-shadow: 0 12px 40px rgba(0, 217, 255, 0.2);
    }
    
    [data-testid="stMetricValue"] {
        font-size: 2.5rem !important;
        font-weight: 900 !important;
        color: #00D9FF !important;
    }
    
    [data-testid="stMetricLabel"] {
        color: #ffffff !important;
        font-weight: 500 !important;
        font-size: 0.9rem !important;
    }
    
    .stButton > button {
        background: linear-gradient(135deg, #00D9FF 0%, #0099cc 100%);
        color: #000000;
        border: none;
        border-radius: 12px;
        padding: 0.9rem 2.5rem;
        font-weight: 700;
        font-size: 1rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 217, 255, 0.3);
    }
    
    .stButton > button:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(0, 217, 255, 0.5);
    }
    
    .sidebar-logo {
        text-align: center;
        padding: 2rem 1rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid rgba(0, 217, 255, 0.2);
    }
    
    .sidebar-logo h1 {
        font-size: 1.5rem;
        color: #00D9FF;
        margin: 0;
    }
    
    .status-card {
        background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
        padding: 1rem;
        border-radius: 10px;
        border-left: 3px solid #00D9FF;
        margin-bottom: 0.5rem;
    }
    
    .status-card.success {
        border-left-color: #00ff88;
    }
    
    .status-card.warning {
        border-left-color: #ffaa00;
    }
    
    .rtl-text {
        direction: rtl;
        text-align: right;
    }
    
    /* All text white */
    .stMarkdown, .stMarkdown p, .stMarkdown li, .stMarkdown span {
        color: #ffffff !important;
    }
    
    h1, h2, h3, h4, h5, h6 {
        color: #ffffff !important;
    }
    
    .stDataFrame {
        color: #ffffff !important;
    }
    
    .stSelectbox label, .stTextInput label, .stFileUploader label {
        color: #ffffff !important;
    }
    
    .stExpander {
        border-color: rgba(0, 217, 255, 0.3) !important;
    }
    
    .stExpander summary {
        color: #ffffff !important;
    }
    
    /* Info boxes */
    .stAlert {
        background: linear-gradient(135deg, #1a1a2e 0%, #0f0f0f 100%) !important;
        border: 1px solid rgba(0, 217, 255, 0.3) !important;
        color: #ffffff !important;
    }
    </style>
""", unsafe_allow_html=True)


@st.cache_data
def load_data(file_path):
    return pd.read_csv(file_path)


def main():
    if 'current_page' not in st.session_state:
        st.session_state.current_page = "home"
    
    if 'predictions_df' not in st.session_state:
        st.session_state.predictions_df = None
    
    with st.sidebar:
        st.markdown("""
        <div class="sidebar-logo">
            <h1>📊 هائل سعيد</h1>
            <p style="color: #888; font-size: 0.9rem;">نموذج تحليل العرض والسوق</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("### 📌 التنقل")
        
        if st.button("🏠 الرئيسية", use_container_width=True, type="primary" if st.session_state.current_page == "home" else "secondary"):
            st.session_state.current_page = "home"
            st.rerun()
            
        if st.button("📈 التوقعات", use_container_width=True, type="primary" if st.session_state.current_page == "predictions" else "secondary"):
            st.session_state.current_page = "predictions"
            st.rerun()
            
        if st.button("🔍 التحليل", use_container_width=True, type="primary" if st.session_state.current_page == "analysis" else "secondary"):
            st.session_state.current_page = "analysis"
            st.rerun()
            

            
        if st.button("⚡ تنبؤ جديد", use_container_width=True, type="primary" if st.session_state.current_page == "new_prediction" else "secondary"):
            st.session_state.current_page = "new_prediction"
            st.rerun()
        
        st.markdown("---")
        st.markdown("### 📂 حالة البيانات")
    
    try:
        if st.session_state.predictions_df is not None:
            predictions_df = st.session_state.predictions_df
            st.sidebar.markdown(f"""
            <div class="status-card success">
                <strong>✓ بيانات مرفوعة</strong><br>
                <span style="color: #00ff88;">{len(predictions_df):,} سجل</span>
            </div>
            """, unsafe_allow_html=True)
        elif os.path.exists('output/predictions.csv'):
            predictions_df = load_data('output/predictions.csv')
            st.sidebar.markdown(f"""
            <div class="status-card success">
                <strong>✓ التوقعات</strong><br>
                <span style="color: #00ff88;">{len(predictions_df):,} سجل</span>
            </div>
            """, unsafe_allow_html=True)
        else:
            predictions_df = None
            st.sidebar.markdown("""
            <div class="status-card warning">
                <strong>⚠ التوقعات</strong><br>
                <span style="color: #ffaa00;">غير متاحة</span>
            </div>
            """, unsafe_allow_html=True)
        
        if os.path.exists('data/synthetic_supply_market.csv'):
            original_df = load_data('data/synthetic_supply_market.csv')
            st.sidebar.markdown(f"""
            <div class="status-card success">
                <strong>✓ البيانات الأصلية</strong><br>
                <span style="color: #00ff88;">{len(original_df):,} صف</span>
            </div>
            """, unsafe_allow_html=True)
        else:
            original_df = None
            
    except Exception as e:
        st.sidebar.error(f"خطأ: {str(e)}")
        predictions_df = None
        original_df = None
    
    st.markdown('<h1 class="main-header">📊 نموذج تحليل العرض والسوق</h1>', unsafe_allow_html=True)
    
    if st.session_state.current_page == "home":
        show_home(predictions_df, original_df)
    elif st.session_state.current_page == "predictions":
        show_predictions(predictions_df)
    elif st.session_state.current_page == "analysis":
        show_analysis(predictions_df, original_df)

    elif st.session_state.current_page == "new_prediction":
        show_new_prediction()


def show_home(predictions_df, original_df):
    st.markdown("## 🏠 نظرة عامة")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("""
        ### عن النموذج
        
        نموذج تحليل العرض والسوق هو نموذج تعلم آلي متقدم يستخدم **XGBoost** لتوقع:
        - **التكلفة المتوقعة عند الوصول** (دولار/طن)
        - **مستوى إنذار العرض** (منخفض/متوسط/مرتفع)
        - **العامل الأكثر تأثيراً** على التكلفة
        
        تم تطوير هذا النموذج لدعم اتخاذ القرارات في مجموعة هائل سعيد.
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
    
    if predictions_df is not None:
        st.markdown("### 📊 إحصائيات سريعة")
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(label="إجمالي التوقعات", value=f"{len(predictions_df):,}")
        
        with col2:
            avg_cost = predictions_df['Predicted_Landed_Cost'].mean()
            st.metric(label="متوسط التكلفة", value=f"${avg_cost:,.0f}")
        
        with col3:
            high_alerts = (predictions_df['Supply_Alert_Level'] == 'High').sum()
            st.metric(label="إنذارات عالية", value=high_alerts, delta=f"{high_alerts/len(predictions_df)*100:.1f}%")
        
        with col4:
            commodities = predictions_df['ID_Commodity'].nunique()
            st.metric(label="السلع", value=commodities)
        
        st.markdown("---")
        st.markdown("### 🚨 توزيع الإنذارات")
        
        alert_counts = predictions_df['Supply_Alert_Level'].value_counts()
        
        colors = {'Low': '#00D9FF', 'Med': '#888888', 'High': '#ffffff'}
        
        fig = go.Figure(data=[go.Pie(
            labels=alert_counts.index,
            values=alert_counts.values,
            hole=0.6,
            marker=dict(
                colors=[colors.get(level, '#00D9FF') for level in alert_counts.index],
                line=dict(color='#0a0a0a', width=3)
            ),
            textinfo='label+percent',
            textfont=dict(size=16, color='#000000', family='Tajawal')
        )])
        
        fig.update_layout(
            title=dict(text="توزيع مستويات الإنذار", font=dict(size=24, color='#ffffff', family='Tajawal')),
            height=500,
            paper_bgcolor='#0a0a0a',
            plot_bgcolor='#0a0a0a',
            showlegend=True,
            legend=dict(font=dict(color='#ffffff', size=14, family='Tajawal'), bgcolor='#1a1a1a')
        )
        
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.warning("لا توجد توقعات متاحة. يرجى تحميل البيانات أو إجراء تنبؤ جديد.")


def show_predictions(predictions_df):
    st.markdown("## 📈 التوقعات والتحليل")
    
    if predictions_df is None:
        st.warning("لا توجد توقعات متاحة")
        return
    
    # إحصائيات رئيسية
    st.markdown("### 📊 الإحصائيات الرئيسية")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("إجمالي التوقعات", f"{len(predictions_df):,}")
    
    with col2:
        avg_cost = predictions_df['Predicted_Landed_Cost'].mean()
        st.metric("متوسط التكلفة", f"${avg_cost:,.0f}")
    
    with col3:
        min_cost = predictions_df['Predicted_Landed_Cost'].min()
        st.metric("أقل تكلفة", f"${min_cost:,.0f}")
    
    with col4:
        max_cost = predictions_df['Predicted_Landed_Cost'].max()
        st.metric("أعلى تكلفة", f"${max_cost:,.0f}")
    
    st.markdown("---")
    
    # رسم بياني للتكاليف حسب السلعة
    st.markdown("### 📈 مقارنة التكاليف حسب السلعة")
    
    col1, col2 = st.columns(2)
    
    with col1:
        commodity_avg = predictions_df.groupby('ID_Commodity')['Predicted_Landed_Cost'].mean().sort_values(ascending=True)
        
        fig_bar = go.Figure(data=[go.Bar(
            x=commodity_avg.values,
            y=commodity_avg.index,
            orientation='h',
            marker=dict(
                color='#00D9FF',
                line=dict(color='#ffffff', width=1)
            ),
            text=[f'${x:,.0f}' for x in commodity_avg.values],
            textposition='outside',
            textfont=dict(color='#ffffff', size=14)
        )])
        
        fig_bar.update_layout(
            title=dict(text="متوسط التكلفة لكل سلعة", font=dict(size=18, color='#ffffff')),
            height=350,
            paper_bgcolor='#0a0a0a',
            plot_bgcolor='#0a0a0a',
            xaxis=dict(title="التكلفة (دولار/طن)", title_font=dict(color='#ffffff'), tickfont=dict(color='#ffffff'), gridcolor='rgba(255,255,255,0.1)'),
            yaxis=dict(title_font=dict(color='#ffffff'), tickfont=dict(color='#ffffff'))
        )
        
        st.plotly_chart(fig_bar, use_container_width=True)
    
    with col2:
        # توزيع الإنذارات
        alert_counts = predictions_df['Supply_Alert_Level'].value_counts()
        colors = {'Low': '#00ff88', 'Med': '#ffaa00', 'High': '#ff4444'}
        
        fig_pie = go.Figure(data=[go.Pie(
            labels=alert_counts.index,
            values=alert_counts.values,
            hole=0.5,
            marker=dict(colors=[colors.get(level, '#00D9FF') for level in alert_counts.index])
        )])
        
        fig_pie.update_layout(
            title=dict(text="توزيع مستويات الإنذار", font=dict(size=18, color='#ffffff')),
            height=350,
            paper_bgcolor='#0a0a0a',
            plot_bgcolor='#0a0a0a',
            legend=dict(font=dict(color='#ffffff'))
        )
        
        st.plotly_chart(fig_pie, use_container_width=True)
    
    st.markdown("---")
    
    # تحليل عوامل التكلفة
    st.markdown("### 🎯 عوامل التأثير على التكلفة")
    
    if 'Driver_Cost_Key' in predictions_df.columns:
        driver_counts = predictions_df['Driver_Cost_Key'].value_counts().head(10)
        
        fig_drivers = go.Figure(data=[go.Bar(
            x=driver_counts.index,
            y=driver_counts.values,
            marker=dict(
                color=driver_counts.values,
                colorscale='Blues',
                line=dict(color='#00D9FF', width=1)
            ),
            text=driver_counts.values,
            textposition='outside',
            textfont=dict(color='#ffffff', size=12)
        )])
        
        fig_drivers.update_layout(
            title=dict(text="العوامل الأكثر تأثيراً على التكلفة", font=dict(size=18, color='#ffffff')),
            height=400,
            paper_bgcolor='#0a0a0a',
            plot_bgcolor='#0a0a0a',
            xaxis=dict(title="العامل", title_font=dict(color='#ffffff'), tickfont=dict(color='#ffffff'), tickangle=45, gridcolor='rgba(255,255,255,0.1)'),
            yaxis=dict(title="عدد التوقعات", title_font=dict(color='#ffffff'), tickfont=dict(color='#ffffff'), gridcolor='rgba(255,255,255,0.1)')
        )
        
        st.plotly_chart(fig_drivers, use_container_width=True)
    
    st.markdown("---")
    
    # جدول التحليل المفصل
    st.markdown("### 📋 تحليل مفصل حسب السلعة")
    
    commodity_stats = predictions_df.groupby('ID_Commodity').agg({
        'Predicted_Landed_Cost': ['mean', 'min', 'max', 'std', 'count']
    }).round(2)
    commodity_stats.columns = ['متوسط التكلفة', 'أقل تكلفة', 'أعلى تكلفة', 'الانحراف المعياري', 'عدد التوقعات']
    
    # حساب الإنذارات لكل سلعة
    alert_by_commodity = predictions_df.groupby('ID_Commodity')['Supply_Alert_Level'].apply(
        lambda x: (x == 'High').sum()
    )
    commodity_stats['إنذارات عالية'] = alert_by_commodity
    
    st.dataframe(commodity_stats, use_container_width=True)
    
    st.markdown("---")
    
    # عرض البيانات مع فلترة
    st.markdown("### 📑 عرض التوقعات")
    
    col1, col2 = st.columns([1, 3])
    
    with col1:
        selected_commodity = st.selectbox("فلترة حسب السلعة", ["الكل"] + list(predictions_df['ID_Commodity'].unique()))
        selected_alert = st.selectbox("فلترة حسب الإنذار", ["الكل", "High", "Med", "Low"])
    
    filtered_df = predictions_df.copy()
    if selected_commodity != "الكل":
        filtered_df = filtered_df[filtered_df['ID_Commodity'] == selected_commodity]
    if selected_alert != "الكل":
        filtered_df = filtered_df[filtered_df['Supply_Alert_Level'] == selected_alert]
    
    st.dataframe(filtered_df.head(50), use_container_width=True)
    
    # تنزيل البيانات
    csv = filtered_df.to_csv(index=False, encoding='utf-8-sig')
    st.download_button(
        label="📥 تنزيل البيانات المفلترة",
        data=csv,
        file_name=f"predictions_filtered_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
        mime="text/csv"
    )


def show_analysis(predictions_df, original_df):
    st.markdown("## 🔍 التحليل")
    
    if predictions_df is None:
        st.warning("لا توجد توقعات متاحة للتحليل")
        return
    
    st.markdown("### 📈 اتجاه التكاليف")
    
    if 'Date' in predictions_df.columns:
        predictions_df['Date'] = pd.to_datetime(predictions_df['Date'])
        
        fig = px.line(
            predictions_df,
            x='Date',
            y='Predicted_Landed_Cost',
            color='ID_Commodity',
            title='اتجاه التكاليف المتوقعة'
        )
        
        fig.update_layout(
            paper_bgcolor='#0a0a0a',
            plot_bgcolor='#0a0a0a',
            font=dict(color='#ffffff'),
            xaxis=dict(gridcolor='rgba(255,255,255,0.1)'),
            yaxis=dict(gridcolor='rgba(255,255,255,0.1)')
        )
        
        st.plotly_chart(fig, use_container_width=True)





def show_new_prediction():
    st.markdown("## ⚡ تنبؤ جديد")
    
    st.info("""
    📋 **متطلبات الملف:**
    
    يجب أن يحتوي الملف على الأعمدة التالية:
    - `Date`: التاريخ
    - `ID_Commodity`: نوع السلعة (wheat, sugar, oil)
    - `Anomaly_Price_Global`: السعر العالمي
    - `Index_Cost_Shipping`: تكلفة الشحن
    - `Premium_Insurance_Risk_War`: تأمين المخاطر
    - `Outlook_Production_Local`: التوقعات المحلية
    - `USD_Spread_Price_Market`: فرق السعر
    - `Index_Stress_Chain_Supply`: ضغط سلسلة الإمداد
    - `News_Sentiment_Score`: تحليل الأخبار
    - `Customs_Fees_Estimate`: رسوم جمركية
    """)
    
    uploaded_file = st.file_uploader("اختر ملف CSV", type=['csv'])
    
    if uploaded_file is not None:
        try:
            new_data = pd.read_csv(uploaded_file)
            
            st.success(f"✓ تم تحميل {len(new_data):,} صف")
            
            st.markdown("### معاينة البيانات")
            st.dataframe(new_data.head(10), use_container_width=True)
            
            if st.button("🚀 بدء التنبؤ", type="primary"):
                with st.spinner("جارٍ التنبؤ..."):
                    try:
                        temp_path = 'data/temp_upload.csv'
                        new_data.to_csv(temp_path, index=False)
                        
                        model_path = 'models/xgboost_model.joblib'
                        if not os.path.exists(model_path):
                            st.error("النموذج غير موجود! يرجى تدريب النموذج أولاً.")
                        else:
                            required_cols = ['Date', 'ID_Commodity']
                            if not all(col in new_data.columns for col in required_cols):
                                st.error(f"البيانات يجب أن تحتوي على: {', '.join(required_cols)}")
                            else:
                                from preprocessing import DataPreprocessor
                                
                                preprocessor = DataPreprocessor()
                                
                                results = predict_landed_cost(
                                    temp_path, 
                                    model_path=model_path,
                                    preprocessor=preprocessor,
                                    output_path='output/new_predictions.csv'
                                )
                                
                                st.session_state.predictions_df = results
                                
                                st.success("✓ تم التنبؤ بنجاح!")
                                
                                st.markdown("### 📊 النتائج")
                                st.dataframe(results, use_container_width=True)
                                
                                col1, col2, col3 = st.columns(3)
                                with col1:
                                    avg_cost = results['Predicted_Landed_Cost'].mean()
                                    st.metric("متوسط التكلفة", f"${avg_cost:,.0f}")
                                with col2:
                                    high_alerts = (results['Supply_Alert_Level'] == 'High').sum()
                                    st.metric("إنذارات عالية", high_alerts)
                                with col3:
                                    total = len(results)
                                    st.metric("إجمالي التوقعات", total)
                                
                                csv = results.to_csv(index=False, encoding='utf-8-sig')
                                st.download_button(
                                    label="📥 تنزيل النتائج",
                                    data=csv,
                                    file_name=f"predictions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                                    mime="text/csv"
                                )
                                
                                st.info("💡 البيانات الآن متاحة في جميع الأقسام!")
                        
                    except Exception as e:
                        st.error(f"خطأ في التنبؤ: {str(e)}")
                        with st.expander("تفاصيل الخطأ"):
                            st.code(str(e))
        
        except Exception as e:
            st.error(f"خطأ في قراءة الملف: {str(e)}")


if __name__ == "__main__":
    main()
