"""
Pydantic Schemas for Supply & Market Analysis APIs
Integrated into Predicting-crises-in-Yemen project
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date, datetime


# ==========================================
# Common/Shared Schemas
# ==========================================

class MetadataResponse(BaseModel):
    model_version: str = "xgboost-v2.1"
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None


class ErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    error: ErrorDetail


# ==========================================
# 1. Cost Forecast API Schemas
# ==========================================

class DateRange(BaseModel):
    start_date: date
    end_date: date


class MarketIndicators(BaseModel):
    global_price_anomaly: float = Field(..., description="USD/ton")
    shipping_index: float = Field(..., ge=0, le=200, description="0-200 scale")
    insurance_risk_index: float = Field(..., ge=0, le=1, description="0.0-1.0")
    supply_chain_stress_index: float = Field(..., ge=0, le=100, description="0-100")


class CostForecastRequest(BaseModel):
    commodity_id: Literal["wheat", "sugar", "oil"]
    date_range: DateRange
    market_indicators: MarketIndicators


class PredictionItem(BaseModel):
    date: date
    predicted_landed_cost_usd: float
    confidence_score: float = Field(..., ge=0, le=1)
    main_cost_driver: str


class ForecastSummary(BaseModel):
    avg_cost: float
    min_cost: float
    max_cost: float
    trend_direction: Literal["rising", "falling", "stable"]


class CostForecastData(BaseModel):
    commodity_id: str
    predictions: List[PredictionItem]
    summary: ForecastSummary


class CostForecastResponse(BaseModel):
    status: Literal["success"] = "success"
    data: CostForecastData
    metadata: MetadataResponse


# ==========================================
# 2. Early Warning API Schemas
# ==========================================

class CostSeriesItem(BaseModel):
    date: date
    cost: float


class HistoricalBaseline(BaseModel):
    avg_cost_30d: float
    avg_cost_90d: float
    std_dev: float


class AlertThresholds(BaseModel):
    medium_pct: float = 10.0
    high_pct: float = 15.0


class EarlyWarningRequest(BaseModel):
    commodity_id: Literal["wheat", "sugar", "oil"]
    predicted_cost_series: List[CostSeriesItem]
    historical_baseline: HistoricalBaseline
    alert_thresholds: Optional[AlertThresholds] = None


class AlertDetails(BaseModel):
    peak_date: date
    peak_cost: float
    days_until_peak: int


class EarlyWarningData(BaseModel):
    commodity_id: str
    supply_alert_level: Literal["Low", "Medium", "High"]
    expected_increase_percentage: float
    trigger_reason: str
    alert_details: AlertDetails
    recommended_action: str


class EarlyWarningResponse(BaseModel):
    status: Literal["success"] = "success"
    data: EarlyWarningData


# ==========================================
# 3. Local Production Outlook API Schemas
# ==========================================

class EnvironmentalData(BaseModel):
    ndvi_index: float = Field(..., ge=0, le=1, description="Vegetation health 0.0-1.0")
    rainfall_anomaly: float = Field(..., description="Deviation from normal (mm)")
    temperature_anomaly: Optional[float] = Field(None, description="Deviation from normal (°C)")


class LocalProductionRequest(BaseModel):
    region_id: str
    commodity_id: Literal["wheat", "sugar", "oil"]
    environmental_data: EnvironmentalData
    seasonal_factor: Literal["planting", "growing", "harvest"]
    reference_date: date


class ImpactFactor(BaseModel):
    factor: str
    impact: Literal["positive", "negative", "neutral"]
    weight: float = Field(..., ge=0, le=1)


class LocalProductionData(BaseModel):
    region_id: str
    commodity_id: str
    production_outlook: Literal["Weak", "Medium", "Good"]
    reliability_score: float = Field(..., ge=0, le=1)
    impact_factors: List[ImpactFactor]
    expected_yield_change_pct: float


class LocalProductionResponse(BaseModel):
    status: Literal["success"] = "success"
    data: LocalProductionData


# ==========================================
# 4. Competitive Market Health API Schemas
# ==========================================

class PricingData(BaseModel):
    local_market_price: float = Field(..., description="USD/ton")
    landed_cost: float = Field(..., description="USD/ton")
    competitor_price_index: float = Field(..., description="Relative index, 100 = parity")


class MarketContext(BaseModel):
    market_share_pct: Optional[float] = None
    inventory_days: Optional[int] = None


class CompetitiveHealthRequest(BaseModel):
    commodity_id: Literal["wheat", "sugar", "oil"]
    pricing_data: PricingData
    market_context: Optional[MarketContext] = None


class PricingRecommendation(BaseModel):
    action: str
    target_price: float
    rationale: str


class CompetitiveHealthData(BaseModel):
    commodity_id: str
    usd_spread_price_market: float
    margin_pressure_level: Literal["Low", "Moderate", "High", "Critical"]
    gross_margin_pct: float
    competitive_position: Literal["Advantaged", "Neutral", "Disadvantaged"]
    pricing_recommendation: PricingRecommendation


class CompetitiveHealthResponse(BaseModel):
    status: Literal["success"] = "success"
    data: CompetitiveHealthData


# ==========================================
# 5. Strategic Summary API Schemas
# ==========================================

class CostForecastInput(BaseModel):
    avg_predicted_cost: float
    trend_direction: Literal["rising", "falling", "stable"]
    main_cost_driver: str


class EarlyWarningInput(BaseModel):
    supply_alert_level: Literal["Low", "Medium", "High"]
    expected_increase_pct: float


class LocalProductionInput(BaseModel):
    production_outlook: Literal["Weak", "Medium", "Good"]
    reliability_score: float


class CompetitiveHealthInput(BaseModel):
    margin_pressure_level: Literal["Low", "Moderate", "High", "Critical"]
    competitive_position: Literal["Advantaged", "Neutral", "Disadvantaged"]


class ApiOutputs(BaseModel):
    cost_forecast: CostForecastInput
    early_warning: EarlyWarningInput
    local_production: LocalProductionInput
    competitive_health: CompetitiveHealthInput


class BusinessContext(BaseModel):
    current_inventory_days: int
    budget_available: float
    urgency_level: Literal["low", "medium", "high"]


class StrategicSummaryRequest(BaseModel):
    commodity_id: Literal["wheat", "sugar", "oil"]
    api_outputs: ApiOutputs
    business_context: BusinessContext


class ActionItem(BaseModel):
    priority: int
    action: str
    deadline: date


class RiskBreakdown(BaseModel):
    global_risk_score: float = Field(..., ge=0, le=1)
    local_risk_score: float = Field(..., ge=0, le=1)
    logistic_risk_score: float = Field(..., ge=0, le=1)


class StrategicSummaryMetadata(BaseModel):
    decision_timestamp: datetime
    valid_until: datetime
    model_confidence: float


class StrategicSummaryData(BaseModel):
    commodity_id: str
    dominant_risk_type: Literal["Global", "Local", "Logistic"]
    recommendation: Literal["Buy Now", "Delay", "Diversify Suppliers"]
    confidence_level: float = Field(..., ge=0, le=1)
    explanation_text: str = Field(..., max_length=200)
    action_items: List[ActionItem]
    risk_breakdown: RiskBreakdown


class StrategicSummaryResponse(BaseModel):
    status: Literal["success"] = "success"
    data: StrategicSummaryData
    metadata: StrategicSummaryMetadata


# ==========================================
# Simple Dashboard Request/Response for Frontend
# ==========================================

class SupplyMarketDashboardRequest(BaseModel):
    """Request for the combined dashboard data"""
    commodity_id: Literal["wheat", "sugar", "oil"] = "wheat"
    date: Optional[str] = None  # Format: YYYY-MM-DD


class SupplyMarketKPIs(BaseModel):
    """Key Performance Indicators for dashboard"""
    avg_predicted_cost: float
    supply_alert_level: str
    production_outlook: str
    competitive_position: str
    trend_direction: str
    confidence_score: float


class SupplyMarketDashboardResponse(BaseModel):
    """Combined dashboard response"""
    success: bool
    commodity_id: str
    kpis: SupplyMarketKPIs
    cost_predictions: List[dict]
    risk_breakdown: dict
    recommendation: str
    action_items: List[dict]
    error: Optional[str] = None
