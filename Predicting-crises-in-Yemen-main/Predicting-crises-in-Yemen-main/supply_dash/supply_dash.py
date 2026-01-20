"""
📡 SENTINEL V4.0: YEMEN LOGISTICS RADAR
=======================================
A cumulative layout integrating all requirements:
Radar UI, Network Counters, Smart Routing Meter, Dynamic Ledger, SHAP.
"""

import sys
import json
from pathlib import Path
from datetime import datetime
import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import folium
from streamlit_folium import folium_static

# --- SYSTEM PATH ---
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.etl.data_loader import load_synthetic_data
from src.models.train import RouteDisruptionModel
from src.models.predict import calculate_risk_score
from src.models.explain import RouteDisruptionExplainer

# --- PAGE CONFIG ---
st.set_page_config(
    page_title="Sentinel V4.0",
    page_icon="📡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- RADAR THEME ---
def apply_radar_theme():
    st.markdown("""
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;700&display=swap');
        
        .stApp {
            background-color: #0F172A; /* Deep Space */
            color: #E2E8F0;
            font-family: 'Inter', sans-serif;
        }
        
        /* Counters */
        div[data-testid="metric-container"] {
            background: #1E293B;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            text-align: center;
            transition: transform 0.2s;
        }
        div[data-testid="metric-container"]:hover {
            transform: translateY(-2px);
            border-color: #3B82F6;
        }
        
        /* Pulse Animation for Critical Alert */
        @keyframes pulse-red {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        
        .critical-metric {
            animation: pulse-red 2s infinite;
            border: 1px solid #EF4444 !important;
        }
        
        /* Sidebar Advisor */
        .advisor-card {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid #10B981;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .risk-meter-bg {
            background: #334155;
            height: 8px;
            border-radius: 4px;
            margin-top: 8px;
            overflow: hidden;
        }
        .risk-meter-fill {
            height: 100%;
            transition: width 0.5s;
        }
        
        /* Map Tooltip */
        .folium-popup-content-wrapper {
            background: #1E293B;
            color: white;
            border: 1px solid #475569;
            font-family: 'JetBrains Mono', monospace;
        }
    </style>
    """, unsafe_allow_html=True)

# --- LOGIC & UTILS ---
@st.cache_resource(show_spinner=False)
def load_system():
    base_path = Path(__file__).parent.parent.parent
    try:
        model = RouteDisruptionModel.load(
            base_path / 'models' / 'lightgbm_model.pkl', 
            base_path / 'models' / 'feature_engineer.pkl'
        )
        explainer = RouteDisruptionExplainer(
            base_path / 'models' / 'lightgbm_model.pkl', 
            base_path / 'models' / 'feature_engineer.pkl'
        )
        # Init Explainer
        df = load_synthetic_data().head(10)
        df_trans = model.feature_engineer.transform(df)
        cols = [f for f in model.feature_engineer.get_feature_names() if f in df_trans.columns]
        explainer.init_explainer(df_trans[cols])
        return model, explainer
    except: return None, None

def get_risk_meta(score):
    if score >= 7: return "#EF4444", "CRITICAL", "🔴"
    if score >= 4: return "#F59E0B", "CAUTION", "�"
    return "#10B981", "SAFE", "🟢"

def generate_context_reason(row):
    reasons = []
    if row['rainfall_mm_24h'] > 15: reasons.append(f"مطر: {row['rainfall_mm_24h']:.0f}mm")
    if row['security_incidents_24h'] > 0: reasons.append(f"أمن: {row['security_incidents_24h']}")
    if row['checkpoint_delay_min'] > 45: reasons.append(f"تأخير: {row['checkpoint_delay_min']}m")
    return " | ".join(reasons) if reasons else "مسار آمن"

# --- COMPONENTS ---

def render_network_health_counters(df):
    """Network Health Counters: High Risk | Caution | Safe"""
    c1, c2, c3, c4 = st.columns(4)
    
    high_risk = len(df[df['risk_score_1_10'] >= 7])
    caution = len(df[(df['risk_score_1_10'] >= 4) & (df['risk_score_1_10'] < 7)])
    safe = len(df[df['risk_score_1_10'] < 4])
    
    c1.metric("🔴 High Risk Routes", high_risk, "Score > 7")
    c2.metric("🟠 Caution Routes", caution, "Score 4-7")
    c3.metric("🟢 Safe Routes", safe, "Score < 4")
    
    # Global Avg Risk
    avg_risk = df['risk_score_1_10'].mean()
    c4.metric("📊 Avg Network Risk", f"{avg_risk:.1f}/10", "Global Index")

def render_smart_map_layer(df):
    """Geospatial Layer with specific Technical Tooltips."""
    yemen_center = [15.5, 47.5]
    m = folium.Map(location=yemen_center, zoom_start=6, tiles='CartoDB dark_matter')
    
    base_path = Path(__file__).parent.parent.parent
    try:
        with open(base_path / 'data/synthetic/routes_config.json') as f:
            r_geo = {r['route_id']: r for r in json.load(f)['routes']}
    except: r_geo = {}

    for _, row in df.iterrows():
        geo = r_geo.get(row['route_id'])
        if not geo: continue
        
        color, status, _ = get_risk_meta(row['risk_score_1_10'])
        
        # EXACT TECHNICAL TOOLTIP FORMAT
        tooltip_html = f"""
        <div style="min-width:180px;">
            <b style="color:{color}; font-size:14px;">{row['route_name']}</b><br>
            <hr style="border-color:#475569; margin:4px 0;">
            <b>primary_risk:</b> <span style="color:#CBD5E1">{row['primary_risk_factor']}</span><br>
            <b>risk_score:</b> <span style="color:{color}">{row['risk_score_1_10']:.1f}/10</span><br>
            <b>disruption_probability:</b> {row['disruption_probability_48h']:.1%}<br>
            <b>Status:</b> {status}
        </div>
        """
        
        folium.PolyLine(
            locations=[geo['start_coords'], geo['end_coords']],
            color=color, weight=4, opacity=0.85,
            popup=folium.Popup(tooltip_html, max_width=250),
            tooltip=f"{row['route_name']}"
        ).add_to(m)
        
        folium.CircleMarker(
            location=geo['start_coords'], radius=4, color=color, fill=True, fill_opacity=1
        ).add_to(m)
        
    return m

def render_smart_routing_advisor(df):
    """Sidebar: Recommended Route with Risk Meter."""
    st.sidebar.markdown("### 🏹 Smart Routing Advisor")
    st.sidebar.markdown("---")
    
    # Logic: Best Route (Lowest Score)
    best_route = df.sort_values('risk_score_1_10').iloc[0]
    
    risk_pct = (best_route['risk_score_1_10'] / 10) * 100
    meter_color = "#10B981" if risk_pct < 40 else "#F59E0B"
    
    st.sidebar.markdown(f"#### 🏆 RECOMMENDED ROUTE")
    
    # Use native Streamlit container with styling
    with st.sidebar.container():
        st.success(f"**{best_route['route_name']}**")
        st.caption(f"Target Probability: {(1 - best_route['disruption_probability_48h']):.1%} Success")
        
        # Native Progress Bar for Risk Meter
        st.write(f"Risk Meter: {best_route['risk_score_1_10']}/10")
        st.progress(int(risk_pct))
    
    st.sidebar.markdown("**Network Alerts:**")
    high_risk = df[df['risk_score_1_10'] >= 7]
    if not high_risk.empty:
        for _, r in high_risk.iterrows():
            st.sidebar.error(f"⛔ Avoid: {r['route_name']} ({r['risk_score_1_10']})")
    else:
        st.sidebar.success("All routes operational.")

def render_shap_waterfall(explainer, row, feats):
    """SHAP Waterfall for Explainability."""
    try:
        row_data = row[feats]
        shap_values = explainer.explainer.shap_values(row_data)
        if isinstance(shap_values, list): shap_values = shap_values[1]
        
        contributions = pd.DataFrame({
            'Feature': feats,
            'Contribution': shap_values[0]
        }).sort_values('Contribution', key=abs, ascending=True).tail(8)
        
        fig = go.Figure(go.Bar(
            y=contributions['Feature'], x=contributions['Contribution'], orientation='h',
            marker=dict(color=contributions['Contribution'].apply(lambda x: '#EF4444' if x > 0 else '#10B981'))
        ))
        fig.update_layout(
            title="🔍 Cause Analysis (SHAP)", paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)',
            font_color='#E2E8F0', height=250, margin=dict(l=0, r=0, t=30, b=0)
        )
        return fig
    except: return None

# --- MAIN APP ---
def main():
    apply_radar_theme()
    
    model, explainer = load_system()
    raw_df = load_synthetic_data()
    if not model: st.stop()
    
    # Header & Date
    c_title, c_date = st.columns([3, 1])
    with c_title: st.markdown("## 📡 SENTINEL V4.0 | LOGISTICS RADAR")
    with c_date: 
        latest = raw_df['timestamp'].max()
        sel_date = st.date_input("Operations Date", value=latest)
        
    # Date Filtering (Syncs everything)
    df_day = raw_df[raw_df['timestamp'].dt.date == sel_date]
    if df_day.empty: st.error("No Data"); st.stop()
    df_active = df_day.sort_values('timestamp').groupby('route_id').tail(1).reset_index(drop=True)
    
    # Prediction
    X = model.feature_engineer.transform(df_active).reset_index(drop=True)
    feats = [f for f in model.feature_engineer.get_feature_names() if f in X.columns]
    
    probs = model.predict_proba(X[feats], use_calibrated=True)
    scores = calculate_risk_score(probs)
    
    df_active['disruption_probability_48h'] = probs
    df_active['risk_score_1_10'] = scores
    
    # Determine Primary Risk Factor using composite risk scores
    # This uses the same logic as the updated explain.py
    factors = []
    for i, row_idx in enumerate(X.index):
        row = X.loc[row_idx]
        
        # Get composite risk scores (same logic as get_primary_risk_factor)
        score_mapping = {
            'Climate': ('weather_risk_score', 1.0),
            'Logistics': ('logistics_risk_score', 1.0),
            'Security': ('security_risk_score', 1.0),
            'Fuel': ('fuel_scarcity', 10.0),
            'Terrain': ('road_deterioration', 10.0),
        }
        
        category_scores = {}
        for category, (feature, scale) in score_mapping.items():
            if feature in row.index:
                category_scores[category] = abs(float(row[feature])) * scale
            else:
                category_scores[category] = 0.0
        
        # Get category with highest score
        max_category = max(category_scores.items(), key=lambda x: x[1])
        
        # If all scores are very low (< 2.0), show "Low Risk" instead
        if max_category[1] < 2.0:
            primary = "Low Risk"
        else:
            primary = max_category[0]
        
        factors.append(primary)
    
    df_active['primary_risk_factor'] = factors
    
    # 1. Network Health Counters
    render_network_health_counters(df_active)
    
    # Smart Toast Notification
    high_risk_count = len(df_active[df_active['risk_score_1_10'] >= 7])
    if high_risk_count > 0:
        st.toast(f"⚠️ Alert: {high_risk_count} Critical Routes Detected!", icon="🚨")
    else:
        st.toast("✅ Network Operations Stable", icon="🟢")
        
    st.markdown("---")
    
    # 2. Main Map 
    col_map, col_list = st.columns([3, 1])
    with col_map:
        st.markdown("### 📍 Smart Map Layer")
        folium_static(render_smart_map_layer(df_active), width=None, height=450)
    
    # 3. Smart Routing Sidebar
    # We put this in the main column layout or sidebar? Prompt says "Sidebar Section" usually implies Streamlit Sidebar.
    render_smart_routing_advisor(df_active)
    
    # 3b. (Optional) Right column quick list if Sidebar is full
    with col_list:
        st.info("💡 Select Date to update forecasts (48h window).")
    
    # 4. Dynamic Ledger & Explainability
    st.markdown("### 📋 Dynamic Route Ledger & Analysis")
    
    l_col, r_col = st.columns([1.5, 1])
    
    with l_col:
        # Ledger Table
        # Ledger Table
        table_data = df_active.copy()
        
        table_data['اسم الطريق'] = table_data['route_name']
        table_data['Primary Risk Factor'] = table_data['primary_risk_factor']
        table_data['Risk Score'] = table_data['risk_score_1_10']
        table_data['Disruption Probability'] = table_data['disruption_probability_48h']
        table_data['نوع الطريق'] = table_data['road_type']
        table_data['التفاصيل المهمه'] = [generate_context_reason(r) for _, r in df_active.iterrows()]
        
        final_view = table_data[['اسم الطريق', 'Primary Risk Factor', 'Risk Score', 'Disruption Probability', 'نوع الطريق', 'التفاصيل المهمه']]
        
        st.dataframe(
            final_view.style.background_gradient(subset=['Risk Score'], cmap='RdYlGn_r', vmin=1, vmax=10)
                      .format({'Risk Score': '{:.1f}', 'Disruption Probability': '{:.1%}'}),
            use_container_width=True, height=350
        )
        
        # Download Button
        csv = final_view.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="📥 Export Risk Report (CSV)",
            data=csv,
            file_name=f"sentinel_risk_report_{sel_date}.csv",
            mime="text/csv",
        )
        
    with r_col:
        # SHAP Waterfall
        sel_route = st.selectbox("Select Route to EXPLAIN:", df_active['route_name'].unique())
        if sel_route:
            idx = df_active.index[df_active['route_name'] == sel_route][0]
            fig = render_shap_waterfall(explainer, X.iloc[[idx]], feats)
            if fig: st.plotly_chart(fig, use_container_width=True)

if __name__ == "__main__":
    main()
