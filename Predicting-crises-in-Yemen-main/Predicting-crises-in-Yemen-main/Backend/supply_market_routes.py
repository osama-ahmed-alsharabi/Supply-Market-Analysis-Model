"""
API Routes for Supply & Market Analysis Model
Integrated into Predicting-crises-in-Yemen project
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, date

from supply_market_schemas import (
    CostForecastRequest, CostForecastResponse, MetadataResponse,
    EarlyWarningRequest, EarlyWarningResponse,
    LocalProductionRequest, LocalProductionResponse,
    CompetitiveHealthRequest, CompetitiveHealthResponse,
    StrategicSummaryRequest, StrategicSummaryResponse,
    SupplyMarketDashboardRequest, SupplyMarketDashboardResponse
)
from supply_market_services import (
    cost_forecast_service,
    early_warning_service,
    local_production_service,
    competitive_health_service,
    strategic_summary_service,
    supply_market_dashboard_service
)


# Create main router with prefix
router = APIRouter(prefix="/api/supply-market", tags=["Supply & Market Analysis"])


# ==========================================
# Dashboard API (Combined Data for Frontend)
# ==========================================
@router.post("/dashboard")
async def get_dashboard_data(request: SupplyMarketDashboardRequest):
    """
    Get combined dashboard data for Supply & Market Analysis.
    Returns all KPIs, predictions, and recommendations in one call.
    
    - **commodity_id**: wheat, sugar, or oil
    - **date**: Optional reference date (YYYY-MM-DD format)
    """
    try:
        reference_date = None
        if request.date:
            reference_date = datetime.strptime(request.date, "%Y-%m-%d").date()
        
        result = supply_market_dashboard_service.get_dashboard_data(
            commodity_id=request.commodity_id,
            reference_date=reference_date
        )
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "commodity_id": request.commodity_id,
            "kpis": {},
            "cost_predictions": [],
            "risk_breakdown": {},
            "recommendation": "",
            "action_items": [],
            "error": str(e)
        }


# ==========================================
# 1. Cost Forecast API
# ==========================================
@router.post("/forecast/cost", response_model=CostForecastResponse)
async def predict_cost(request: CostForecastRequest):
    """
    Predict landed cost per commodity for specified date range.
    
    - **commodity_id**: wheat, sugar, or oil
    - **date_range**: Start and end dates for prediction
    - **market_indicators**: Global price anomaly, shipping index, etc.
    """
    try:
        result = cost_forecast_service.predict(
            commodity_id=request.commodity_id,
            start_date=request.date_range.start_date,
            end_date=request.date_range.end_date,
            market_indicators={
                'global_price_anomaly': request.market_indicators.global_price_anomaly,
                'shipping_index': request.market_indicators.shipping_index,
                'insurance_risk_index': request.market_indicators.insurance_risk_index,
                'supply_chain_stress_index': request.market_indicators.supply_chain_stress_index
            }
        )
        
        return CostForecastResponse(
            status="success",
            data=result,
            metadata=MetadataResponse(generated_at=datetime.utcnow())
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 2. Early Warning API
# ==========================================
@router.post("/alerts/early-warning", response_model=EarlyWarningResponse)
async def detect_warnings(request: EarlyWarningRequest):
    """
    Detect abnormal future cost spikes based on predicted vs historical data.
    
    - **commodity_id**: wheat, sugar, or oil
    - **predicted_cost_series**: List of date/cost pairs
    - **historical_baseline**: 30d and 90d averages
    """
    try:
        thresholds = None
        if request.alert_thresholds:
            thresholds = {
                'medium_pct': request.alert_thresholds.medium_pct,
                'high_pct': request.alert_thresholds.high_pct
            }
        
        result = early_warning_service.analyze(
            commodity_id=request.commodity_id,
            predicted_costs=[
                {'date': item.date, 'cost': item.cost}
                for item in request.predicted_cost_series
            ],
            historical_baseline={
                'avg_cost_30d': request.historical_baseline.avg_cost_30d,
                'avg_cost_90d': request.historical_baseline.avg_cost_90d,
                'std_dev': request.historical_baseline.std_dev
            },
            thresholds=thresholds
        )
        
        return EarlyWarningResponse(status="success", data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 3. Local Production Outlook API
# ==========================================
@router.post("/outlook/local-production", response_model=LocalProductionResponse)
async def analyze_production(request: LocalProductionRequest):
    """
    Classify local agricultural production health based on environmental indicators.
    
    - **region_id**: Region identifier
    - **commodity_id**: wheat, sugar, or oil
    - **environmental_data**: NDVI, rainfall anomaly, temperature
    - **seasonal_factor**: planting, growing, or harvest
    """
    try:
        result = local_production_service.analyze(
            region_id=request.region_id,
            commodity_id=request.commodity_id,
            environmental_data={
                'ndvi_index': request.environmental_data.ndvi_index,
                'rainfall_anomaly': request.environmental_data.rainfall_anomaly,
                'temperature_anomaly': request.environmental_data.temperature_anomaly
            },
            seasonal_factor=request.seasonal_factor,
            reference_date=request.reference_date
        )
        
        return LocalProductionResponse(status="success", data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 4. Competitive Market Health API
# ==========================================
@router.post("/market/competitive-health", response_model=CompetitiveHealthResponse)
async def analyze_market(request: CompetitiveHealthRequest):
    """
    Analyze pricing pressure and margins relative to competition.
    
    - **commodity_id**: wheat, sugar, or oil
    - **pricing_data**: local price, landed cost, competitor index
    - **market_context**: Optional market share and inventory info
    """
    try:
        market_context = None
        if request.market_context:
            market_context = {
                'market_share_pct': request.market_context.market_share_pct,
                'inventory_days': request.market_context.inventory_days
            }
        
        result = competitive_health_service.analyze(
            commodity_id=request.commodity_id,
            pricing_data={
                'local_market_price': request.pricing_data.local_market_price,
                'landed_cost': request.pricing_data.landed_cost,
                'competitor_price_index': request.pricing_data.competitor_price_index
            },
            market_context=market_context
        )
        
        return CompetitiveHealthResponse(status="success", data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 5. Strategic Summary API
# ==========================================
@router.post("/strategy/summary", response_model=StrategicSummaryResponse)
async def generate_summary(request: StrategicSummaryRequest):
    """
    Provide high-level, decision-ready insight for Master Model orchestration.
    
    - **commodity_id**: wheat, sugar, or oil
    - **api_outputs**: Aggregated outputs from all other APIs
    - **business_context**: Inventory, budget, urgency level
    """
    try:
        result = strategic_summary_service.generate(
            commodity_id=request.commodity_id,
            api_outputs={
                'cost_forecast': {
                    'avg_predicted_cost': request.api_outputs.cost_forecast.avg_predicted_cost,
                    'trend_direction': request.api_outputs.cost_forecast.trend_direction,
                    'main_cost_driver': request.api_outputs.cost_forecast.main_cost_driver
                },
                'early_warning': {
                    'supply_alert_level': request.api_outputs.early_warning.supply_alert_level,
                    'expected_increase_pct': request.api_outputs.early_warning.expected_increase_pct
                },
                'local_production': {
                    'production_outlook': request.api_outputs.local_production.production_outlook,
                    'reliability_score': request.api_outputs.local_production.reliability_score
                },
                'competitive_health': {
                    'margin_pressure_level': request.api_outputs.competitive_health.margin_pressure_level,
                    'competitive_position': request.api_outputs.competitive_health.competitive_position
                }
            },
            business_context={
                'current_inventory_days': request.business_context.current_inventory_days,
                'budget_available': request.business_context.budget_available,
                'urgency_level': request.business_context.urgency_level
            }
        )
        
        return StrategicSummaryResponse(
            status="success",
            data=result['data'],
            metadata=result['metadata']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
