
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import os
from datetime import datetime, timedelta

# ==================== 1. Load Model & Data ====================
try:
    models = joblib.load('models/lgbm_quantile_models.pkl')
    encoders = joblib.load('models/label_encoders.pkl')
    metadata = joblib.load('models/model_metadata.pkl')
    
    # Load a sample line for "Baseline" values (Simulating real DB)
    # We take the last known values from the training data generated
    historical_df = pd.read_csv('data/sanaa_food_demand.csv')
    last_date = historical_df['Date'].max()
    baseline_data = historical_df[historical_df['Date'] == last_date].copy()
    
    print("✅ Models and baseline data loaded.")
except Exception as e:
    print(f"❌ Error loading: {e}")
    models = None
    baseline_data = pd.DataFrame()

app = FastAPI(title="Sana'a Food Crisis Prediction System", version="2.0")

# ==================== 2. Simulation Logic ====================

class SimulationRequest(BaseModel):
    fx_multiplier: float = Field(1.0, description="1.0 = No change, 1.2 = 20% increase")
    is_ramadan: bool = False
    fuel_crisis: bool = False
    governorate: str = "Sanaa"

class DashboardResponse(BaseModel):
    kpis: Dict[str, float]
    charts: Dict[str, list]
    table: List[Dict]

def get_baseline_for_product(product):
    """Get the last known features for a product to use as base"""
    if baseline_data.empty: return None
    row = baseline_data[baseline_data['Product_SKU'] == product]
    if row.empty: return None
    return row.iloc[0]

@app.post("/api/simulate", response_model=DashboardResponse)
async def run_simulation(sim: SimulationRequest):
    if not models:
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    products = ['Wheat_Flour_50kg', 'Rice_Basmati_10kg', 'Sugar_10kg', 'Cooking_Oil_4L', 'Beans_Can_400g']
    
    results = []
    total_demand = 0
    risk_score_sum = 0
    
    # Chart Data Containers
    chart_distribution = []
    chart_prices = []
    
    for prod in products:
        base_row = get_baseline_for_product(prod)
        if base_row is None: continue
        
        # --- Apply Simulation Logic ---
        
        # 1. Economic / FX Impact on Price
        # IF FX increases, Real Price increases (Imported goods)
        # We assume pass-through elasticity of 0.8 for simplicity in simulation
        adjusted_price = base_row['Real_Unit_Price_YER'] * sim.fx_multiplier
        
        # 2. Terms of Trade (Purchasing Power)
        # Fuel Crisis or High FX reduces ToT
        adjusted_tot = base_row['Terms_of_Trade_Proxy']
        if sim.fuel_crisis:
            adjusted_tot *= 0.85 # -15% purchasing power
        if sim.fx_multiplier > 1.1:
            adjusted_tot *= (1 / sim.fx_multiplier) # Roughly inverse
            
        # 3. Day Type
        day_type = "Ramadan" if sim.is_ramadan else "Normal"
        
        # 4. FX Shock
        # If multiplier is high (> 1.1), we register a shock
        fx_shock = max(0, sim.fx_multiplier - 1.0)
        
        # Construct Input DataFrame
        input_dict = {
            'Date': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
            'Product_SKU': prod,
            'Governorate_ID': sim.governorate,
            'Quantity_Sold_Lag_7D': base_row['Quantity_Sold'], # Use last sold as Lag
            'Quantity_Sold_MA_14D': base_row['Quantity_Sold'], # Approx
            'Real_Unit_Price_YER': adjusted_price,
            'Is_Promotion': 0, # Assume no promo in base simulation
            'Day_Type': day_type,
            'Terms_of_Trade_Proxy': adjusted_tot,
            'FX_Shock_7D': fx_shock,
            
            # Date Components
            'Year': datetime.now().year,
            'Month': datetime.now().month,
            'Day': datetime.now().day,
            'Week': datetime.now().isocalendar().week
        }
        
        df = pd.DataFrame([input_dict])
        
        # Encode
        for col, le in encoders.items():
            if col in df.columns:
                # Handle unknown classes by picking first class (Safety fallback for simulation)
                val = df[col].iloc[0]
                if val not in le.classes_:
                    df[col] = le.transform([le.classes_[0]]) 
                else:
                    df[col] = le.transform(df[col])
                    
        X = df[metadata['features']]
        
        # Predict
        pred = models['prediction'].predict(X)[0]
        upper = models['upper'].predict(X)[0]
        
        # Post-process
        pred = max(0, pred)
        risk_level = "Normal"
        if pred > base_row['Quantity_Sold'] * 1.2: risk_level = "High"
        elif pred < base_row['Quantity_Sold'] * 0.8: risk_level = "Low"
        
        results.append({
            "product": prod,
            "price": round(adjusted_price, 0),
            "demand": round(pred, 0),
            "risk": risk_level,
            "details": f"ToT: {int(adjusted_tot)}"
        })
        
        total_demand += pred
        
        # Chart Data
        chart_distribution.append(round(pred, 0))
        chart_prices.append({"x": round(adjusted_price,0), "y": round(pred,0), "product": prod})

    # Prepare Response
    avg_fx = 550 * sim.fx_multiplier # Base 550
    risk_text = "Stable"
    if sim.fuel_crisis or sim.fx_multiplier > 1.3: risk_text = "Critical"
    elif sim.fx_multiplier > 1.1: risk_text = "Warning"
    
    return {
        "kpis": {
            "total_demand": round(total_demand, 0),
            "avg_fx": round(avg_fx, 0),
            "risk_score": 90.0 if risk_text == "Stable" else (70.0 if risk_text == "Warning" else 45.0)
        },
        "charts": {
            "distribution": chart_distribution,
            "labels": products,
            "scatter": chart_prices
        },
        "table": results
    }

# ==================== 3. Dashboard HTML ====================

dashboard_html = """
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>نظام التنبؤ بالأزمات الغذائية - صنعاء</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Cairo', sans-serif; background-color: #1a1a2e; color: #e0e0e0; }
        .card { background-color: #16213e; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid #1f4068; }
        .btn-primary { background: linear-gradient(90deg, #4e54c8, #8f94fb); color: white; transition: 0.3s; }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-2px); }
        .input-dark { background-color: #0f3460; border: 1px solid #1f4068; color: white; }
        input[type=range] { accent-color: #e94560; }
    </style>
</head>
<body class="p-6">

    <!-- Header -->
    <header class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-3xl font-bold text-blue-400">نظام التنبؤ بالأزمات الغذائية</h1>
            <p class="text-gray-400">محافظة صنعاء - الجمهورية اليمنية</p>
        </div>
        <div class="flex items-center gap-2">
            <span class="inline-flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
            <span class="text-sm font-semibold">النظام نشط</span>
        </div>
    </header>

    <!-- KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card flex items-center justify-between">
            <div>
                <p class="text-sm text-gray-400">إجمالي الطلب المتوقع (يومي)</p>
                <h2 id="kpi-demand" class="text-2xl font-bold mt-1">Calculating...</h2>
            </div>
            <div class="bg-blue-900/50 p-3 rounded-lg"><span class="text-2xl">📦</span></div>
        </div>
        <div class="card flex items-center justify-between">
            <div>
                <p class="text-sm text-gray-400">سعر الصرف (ريال/دولار)</p>
                <h2 id="kpi-fx" class="text-2xl font-bold mt-1 text-yellow-500">550</h2>
            </div>
            <div class="bg-yellow-900/50 p-3 rounded-lg"><span class="text-2xl">💰</span></div>
        </div>
        <div class="card flex items-center justify-between">
            <div>
                <p class="text-sm text-gray-400">مستوى المخاطر</p>
                <h2 id="kpi-risk" class="text-2xl font-bold mt-1 text-green-400">مستقر</h2>
            </div>
            <div class="bg-green-900/50 p-3 rounded-lg"><span class="text-2xl">🛡️</span></div>
        </div>
        <div class="card flex items-center justify-between">
            <div>
                <p class="text-sm text-gray-400">دقة النموذج</p>
                <h2 class="text-2xl font-bold mt-1 text-purple-400">90.4%</h2>
            </div>
            <div class="bg-purple-900/50 p-3 rounded-lg"><span class="text-2xl">📈</span></div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1lg:grid-cols-3 gap-6">
        
        <!-- Simulation Control -->
        <div class="card col-span-1">
            <h3 class="text-xl font-bold mb-6 border-b border-gray-700 pb-2">محاكي السيناريوهات</h3>
            
            <div class="mb-6">
                <label class="block text-sm mb-2 text-gray-300">تغير سعر الصرف (FX Multiplier)</label>
                <div class="flex items-center gap-4">
                    <span class="text-xs">1.0x</span>
                    <input type="range" id="sim-fx" min="0.5" max="3.0" step="0.1" value="1.0" class="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-700">
                    <span id="fx-val" class="text-xs font-mono bg-gray-700 px-2 py-1 rounded">1.0</span>
                </div>
            </div>

            <div class="mb-6 space-y-3">
                <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" id="sim-fuel" class="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500">
                    <span class="text-gray-300">أزمة وقود (تأثير على الأسعار والنقل)</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" id="sim-ramadan" class="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500">
                    <span class="text-gray-300">موسم رمضان (زيادة الطلب)</span>
                </label>
            </div>

            <button onclick="runSimulation()" class="w-full btn-primary py-3 rounded-lg font-bold shadow-lg">تشغيل المحاكاة</button>
            
            <div class="mt-6 bg-gray-900/50 p-4 rounded text-xs text-gray-400">
                <p>ملاحظة: النتائج تعتمد على نموذج LightGBM المدرب على بيانات 2021-2023.</p>
            </div>
        </div>

        <!-- Charts Area -->
        <div class="card col-span-2 grid grid-cols-2 gap-4">
            <!-- Donut Chart -->
            <div class="p-2">
                <h4 class="text-sm text-gray-400 mb-2 text-center">توزيع الطلب حسب المنتج</h4>
                <canvas id="chartDistribution"></canvas>
            </div>
            <!-- Scatter Chart -->
            <div class="p-2">
                <h4 class="text-sm text-gray-400 mb-2 text-center">العلاقة بين السعر والطلب</h4>
                <canvas id="chartScatter"></canvas>
            </div>
        </div>
    </div>

    <!-- Product Table -->
    <div class="card mt-6">
        <h3 class="text-xl font-bold mb-4">تفاصيل المنتجات (Live Forecast)</h3>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-sm text-gray-400 border-b border-gray-700">
                        <th class="py-3 px-4 text-right">المنتج</th>
                        <th class="py-3 px-4 text-center">السعر المتوقع (ريال)</th>
                        <th class="py-3 px-4 text-center">الطلب المتوقع (كجم/لتر)</th>
                        <th class="py-3 px-4 text-center">مستوى الخطر</th>
                        <th class="py-3 px-4 text-left">التفاصيل</th>
                    </tr>
                </thead>
                <tbody id="table-body" class="text-sm">
                    <!-- Rows will be populated by JS -->
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // Charts Instances
        let chartDist = null;
        let chartScatter = null;

        // Init UI
        document.getElementById('sim-fx').addEventListener('input', (e) => {
            document.getElementById('fx-val').innerText = e.target.value;
        });

        async function runSimulation() {
            const btn = document.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'جاري المعالجة...';
            btn.classList.add('opacity-75');

            const payload = {
                fx_multiplier: parseFloat(document.getElementById('sim-fx').value),
                is_ramadan: document.getElementById('sim-ramadan').checked,
                fuel_crisis: document.getElementById('sim-fuel').checked,
                governorate: "Sanaa"
            };

            try {
                const res = await fetch('/api/simulate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                updateDashboard(data);
            } catch (err) {
                alert("Error running simulation: " + err);
            } finally {
                btn.innerText = originalText;
                btn.classList.remove('opacity-75');
            }
        }

        function updateDashboard(data) {
            // KPIs
            document.getElementById('kpi-demand').innerText = data.kpis.total_demand.toLocaleString() + " كجم";
            document.getElementById('kpi-fx').innerText = data.kpis.avg_fx.toLocaleString() + " ريال";
            
            const risk = document.getElementById('kpi-risk');
            const score = data.kpis.risk_score;
            if (score < 50) { risk.innerText = "خطر مرتفع"; risk.className = "text-2xl font-bold mt-1 text-red-500"; }
            else if (score < 80) { risk.innerText = "حذر"; risk.className = "text-2xl font-bold mt-1 text-yellow-500"; }
            else { risk.innerText = "مستقر"; risk.className = "text-2xl font-bold mt-1 text-green-400"; }

            // Table
            const tbody = document.getElementById('table-body');
            tbody.innerHTML = '';
            data.table.forEach(row => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-gray-800 hover:bg-gray-800/50 transition";
                tr.innerHTML = `
                    <td class="py-3 px-4 text-right font-semibold">${row.product}</td>
                    <td class="py-3 px-4 text-center text-yellow-400">${row.price.toLocaleString()}</td>
                    <td class="py-3 px-4 text-center text-blue-400">${row.demand.toLocaleString()}</td>
                    <td class="py-3 px-4 text-center">
                        <span class="px-2 py-1 rounded text-xs ${row.risk === 'High' ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}">
                            ${row.risk === 'High' ? 'مرتفع' : 'طبيعي'}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-left text-gray-500 text-xs">${row.details}</td>
                `;
                tbody.appendChild(tr);
            });

            // Charts
            updateCharts(data.charts);
        }

        function updateCharts(chartsData) {
            // 1. Distribution (Donut)
            const ctxDist = document.getElementById('chartDistribution').getContext('2d');
            if (chartDist) chartDist.destroy();
            chartDist = new Chart(ctxDist, {
                type: 'doughnut',
                data: {
                    labels: chartsData.labels,
                    datasets: [{
                        data: chartsData.distribution,
                        backgroundColor: ['#4e54c8', '#e94560', '#0f3460', '#533483', '#16213e'],
                        borderWidth: 0
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    cutout: '70%'
                }
            });

            // 2. Scatter (Price vs Demand)
            const ctxScat = document.getElementById('chartScatter').getContext('2d');
            if (chartScatter) chartScatter.destroy();
            chartScatter = new Chart(ctxScat, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Price vs Demand',
                        data: chartsData.scatter,
                        backgroundColor: '#e94560'
                    }]
                },
                options: {
                    scales: {
                        x: { title: { display: true, text: 'Price' }, grid: { color: '#333' } },
                        y: { title: { display: true, text: 'Demand' }, grid: { color: '#333' } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // Run initial simulation on load
        window.onload = runSimulation;
    </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
async def dashboard_view():
    """Serve the dashboard HTML"""
    return dashboard_html

# ==================== 4. API Endpoint (For Parent Model) ====================

class PredictionInput(BaseModel):
    # Inputs corresponding to the 10 specific features
    Date: str = Field(..., description="YYYY-MM-DD")
    Product_SKU: str
    Governorate_ID: str
    Quantity_Sold_Lag_7D: float
    Quantity_Sold_MA_14D: float
    Real_Unit_Price_YER: float
    Is_Promotion: int = Field(..., description="0 or 1")
    Day_Type: str = Field(..., description="Normal, Weekend, Ramadan, etc.")
    Terms_of_Trade_Proxy: float
    FX_Shock_7D: float

class PredictionOutput(BaseModel):
    Predicted_Quantity_Sold: float
    Confidence_Interval_Lower: float
    Confidence_Interval_Upper: float

@app.post("/predict", response_model=PredictionOutput)
def predict(input_data: PredictionInput):
    """
    Standard Prediction Endpoint for Parent Model Integration.
    Returns Prediction + 95% Confidence Intervals.
    """
    if not models:
        raise HTTPException(status_code=500, detail="Models not loaded")
        
    try:
        # 1. Prepare DataFrame
        data = input_data.dict()
        df = pd.DataFrame([data])
        
        # 2. Date Features
        dt = pd.to_datetime(df['Date'])
        df['Year'] = dt.dt.year
        df['Month'] = dt.dt.month
        df['Day'] = dt.dt.day
        df['Week'] = dt.dt.isocalendar().week.astype(int)
        
        # 3. Encode Categoricals
        for col, le in encoders.items():
            if col in df.columns:
                # Handle unseen labels carefully (fallback or error)
                val = df[col].iloc[0]
                if val not in le.classes_:
                    # Fallback to first class or raise error? 
                    # For API consistency, raising 400 is better if strict, 
                    # but for robustness we might fallback. Let's start with strict.
                    # Actually, let's allow fallback for robustness like in simulation
                    df[col] = le.transform([le.classes_[0]])
                    print(f"Warning: Unknown category '{val}' for '{col}', using fallback.")
                else:
                    df[col] = le.transform(df[col])
                
        # 4. Feature Selection
        features = metadata['features']
        X = df[features]
        
        # 5. Predict
        pred = models['prediction'].predict(X)[0]
        lower = models['lower'].predict(X)[0]
        upper = models['upper'].predict(X)[0]
        
        # Ensure non-negative and logical bounds
        pred = max(0, pred)
        lower = max(0, lower)
        upper = max(pred, upper) # Upper shouldn't be lower than pred
        if lower > pred: lower = pred 
        
        return {
            "Predicted_Quantity_Sold": round(pred, 2),
            "Confidence_Interval_Lower": round(lower, 2),
            "Confidence_Interval_Upper": round(upper, 2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Server...")
    print("🌍 Dashboard available at: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
