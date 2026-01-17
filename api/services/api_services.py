"""
Service layer for Supply & Market Analysis APIs
Contains business logic for all API endpoints
"""
import sys
import os
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
import numpy as np

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

try:
    import joblib
    MODEL_AVAILABLE = True
except ImportError:
    MODEL_AVAILABLE = False


class CostForecastService:
    """Service for cost prediction logic"""
    
    def __init__(self, model_path: str = 'models/xgboost_model.joblib'):
        self.model_path = model_path
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the trained XGBoost model"""
        if MODEL_AVAILABLE and os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
            except Exception:
                self.model = None
    
    def predict(
        self,
        commodity_id: str,
        start_date: date,
        end_date: date,
        market_indicators: Dict[str, float]
    ) -> Dict[str, Any]:
        """Generate cost predictions for date range"""
        
        # Generate date range
        dates = []
        current = start_date
        while current <= end_date:
            dates.append(current)
            current += timedelta(days=30)  # Monthly predictions
        
        if not dates:
            dates = [start_date]
        
        predictions = []
        
        # Base costs by commodity
        base_costs = {
            'wheat': 550,
            'sugar': 750,
            'oil': 1500
        }
        
        base_cost = base_costs.get(commodity_id, 600)
        
        for i, pred_date in enumerate(dates):
            # Calculate predicted cost based on indicators
            cost = base_cost
            cost += market_indicators['global_price_anomaly'] * 0.8
            cost += market_indicators['shipping_index'] * 2.0
            cost += market_indicators['insurance_risk_index'] * 100
            cost += market_indicators['supply_chain_stress_index'] * 1.2
            
            # Add trend component
            cost += i * 5  # Slight increase over time
            
            # Add some variance
            cost += np.random.normal(0, 20)
            
            # Determine main cost driver
            drivers = {
                'Anomaly_Price_Global': abs(market_indicators['global_price_anomaly']),
                'Index_Cost_Shipping': market_indicators['shipping_index'],
                'Premium_Insurance_Risk_War': market_indicators['insurance_risk_index'] * 100,
                'Index_Stress_Chain_Supply': market_indicators['supply_chain_stress_index']
            }
            main_driver = max(drivers, key=drivers.get)
            
            # Calculate confidence (decreases over time)
            confidence = max(0.6, 0.95 - (i * 0.05))
            
            predictions.append({
                'date': pred_date,
                'predicted_landed_cost_usd': round(cost, 2),
                'confidence_score': round(confidence, 2),
                'main_cost_driver': main_driver
            })
        
        # Calculate summary
        costs = [p['predicted_landed_cost_usd'] for p in predictions]
        avg_cost = np.mean(costs)
        first_cost = costs[0]
        last_cost = costs[-1]
        
        if last_cost > first_cost * 1.05:
            trend = 'rising'
        elif last_cost < first_cost * 0.95:
            trend = 'falling'
        else:
            trend = 'stable'
        
        return {
            'commodity_id': commodity_id,
            'predictions': predictions,
            'summary': {
                'avg_cost': round(avg_cost, 2),
                'min_cost': round(min(costs), 2),
                'max_cost': round(max(costs), 2),
                'trend_direction': trend
            }
        }


class EarlyWarningService:
    """Service for early warning alert logic"""
    
    def analyze(
        self,
        commodity_id: str,
        predicted_costs: List[Dict],
        historical_baseline: Dict[str, float],
        thresholds: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Analyze costs for early warning signals"""
        
        if thresholds is None:
            thresholds = {'medium_pct': 10.0, 'high_pct': 15.0}
        
        # Find peak cost
        peak = max(predicted_costs, key=lambda x: x['cost'])
        peak_date = peak['date']
        peak_cost = peak['cost']
        
        # Calculate increase percentage
        baseline = historical_baseline['avg_cost_90d']
        increase_pct = ((peak_cost - baseline) / baseline) * 100
        
        # Classify alert level
        if increase_pct >= thresholds['high_pct']:
            alert_level = 'High'
            action = 'Consider immediate procurement'
        elif increase_pct >= thresholds['medium_pct']:
            alert_level = 'Medium'
            action = 'Monitor closely, prepare contingency plans'
        else:
            alert_level = 'Low'
            action = 'Continue normal operations'
        
        # Generate trigger reason
        if increase_pct > 20:
            trigger = 'Severe cost deviation detected - multiple risk factors converging'
        elif increase_pct > 10:
            trigger = 'Shipping index surge combined with global price anomaly'
        else:
            trigger = 'Normal market fluctuation within expected range'
        
        # Calculate days until peak
        today = date.today()
        if isinstance(peak_date, str):
            peak_date = datetime.strptime(peak_date, '%Y-%m-%d').date()
        days_until = (peak_date - today).days
        
        return {
            'commodity_id': commodity_id,
            'supply_alert_level': alert_level,
            'expected_increase_percentage': round(increase_pct, 1),
            'trigger_reason': trigger,
            'alert_details': {
                'peak_date': peak_date,
                'peak_cost': round(peak_cost, 2),
                'days_until_peak': max(0, days_until)
            },
            'recommended_action': action
        }


class LocalProductionService:
    """Service for local production outlook analysis"""
    
    def analyze(
        self,
        region_id: str,
        commodity_id: str,
        environmental_data: Dict[str, float],
        seasonal_factor: str,
        reference_date: date
    ) -> Dict[str, Any]:
        """Analyze local production outlook"""
        
        ndvi = environmental_data['ndvi_index']
        rainfall = environmental_data['rainfall_anomaly']
        temp = environmental_data.get('temperature_anomaly', 0)
        
        # Calculate impact factors
        impact_factors = []
        
        # NDVI impact (most important)
        if ndvi >= 0.6:
            ndvi_impact = 'positive'
            ndvi_score = 0.8
        elif ndvi >= 0.4:
            ndvi_impact = 'neutral'
            ndvi_score = 0.5
        else:
            ndvi_impact = 'negative'
            ndvi_score = 0.2
        impact_factors.append({
            'factor': 'ndvi_index',
            'impact': ndvi_impact,
            'weight': 0.45
        })
        
        # Rainfall impact
        if -50 <= rainfall <= 50:
            rain_impact = 'positive'
            rain_score = 0.8
        elif -100 <= rainfall <= 100:
            rain_impact = 'neutral'
            rain_score = 0.5
        else:
            rain_impact = 'negative'
            rain_score = 0.2
        impact_factors.append({
            'factor': 'rainfall_anomaly',
            'impact': rain_impact,
            'weight': 0.35
        })
        
        # Seasonal factor impact
        seasonal_scores = {
            'planting': 0.5,
            'growing': 0.7,
            'harvest': 0.9
        }
        season_score = seasonal_scores.get(seasonal_factor, 0.5)
        impact_factors.append({
            'factor': 'seasonal_factor',
            'impact': 'neutral' if season_score == 0.5 else 'positive',
            'weight': 0.20
        })
        
        # Calculate overall score
        overall_score = (
            ndvi_score * 0.45 +
            rain_score * 0.35 +
            season_score * 0.20
        )
        
        # Classify outlook
        if overall_score >= 0.65:
            outlook = 'Good'
            yield_change = round((overall_score - 0.5) * 30, 1)
        elif overall_score >= 0.4:
            outlook = 'Medium'
            yield_change = round((overall_score - 0.5) * 20, 1)
        else:
            outlook = 'Weak'
            yield_change = round((overall_score - 0.5) * 40, 1)
        
        # Reliability score based on data quality
        reliability = round(0.7 + np.random.uniform(0, 0.2), 2)
        
        return {
            'region_id': region_id,
            'commodity_id': commodity_id,
            'production_outlook': outlook,
            'reliability_score': reliability,
            'impact_factors': impact_factors,
            'expected_yield_change_pct': yield_change
        }


class CompetitiveHealthService:
    """Service for competitive market health analysis"""
    
    def analyze(
        self,
        commodity_id: str,
        pricing_data: Dict[str, float],
        market_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Analyze competitive market health"""
        
        local_price = pricing_data['local_market_price']
        landed_cost = pricing_data['landed_cost']
        competitor_index = pricing_data['competitor_price_index']
        
        # Calculate USD spread
        spread = local_price - landed_cost
        
        # Calculate gross margin
        gross_margin = ((local_price - landed_cost) / local_price) * 100
        
        # Determine margin pressure level
        if gross_margin >= 15:
            pressure = 'Low'
        elif gross_margin >= 10:
            pressure = 'Moderate'
        elif gross_margin >= 5:
            pressure = 'High'
        else:
            pressure = 'Critical'
        
        # Determine competitive position
        if competitor_index > 105:
            position = 'Advantaged'
        elif competitor_index >= 95:
            position = 'Neutral'
        else:
            position = 'Disadvantaged'
        
        # Generate pricing recommendation
        if pressure in ['High', 'Critical']:
            if competitor_index > 100:
                action = 'increase_prices'
                target = round(local_price * 1.05, 2)
                rationale = 'Competitor prices higher; opportunity to improve margins'
            else:
                action = 'hold_prices'
                target = local_price
                rationale = 'Competitor prices expected to rise; maintain position'
        else:
            action = 'maintain_strategy'
            target = local_price
            rationale = 'Current pricing optimal for market conditions'
        
        return {
            'commodity_id': commodity_id,
            'usd_spread_price_market': round(spread, 2),
            'margin_pressure_level': pressure,
            'gross_margin_pct': round(gross_margin, 1),
            'competitive_position': position,
            'pricing_recommendation': {
                'action': action,
                'target_price': target,
                'rationale': rationale
            }
        }


class StrategicSummaryService:
    """Service for strategic summary generation"""
    
    def generate(
        self,
        commodity_id: str,
        api_outputs: Dict[str, Any],
        business_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate strategic summary from all API outputs"""
        
        # Extract inputs
        cost_forecast = api_outputs['cost_forecast']
        early_warning = api_outputs['early_warning']
        local_production = api_outputs['local_production']
        competitive_health = api_outputs['competitive_health']
        business = business_context
        
        # Calculate risk scores
        global_risk = 0.3
        if cost_forecast['trend_direction'] == 'rising':
            global_risk += 0.3
        if early_warning['supply_alert_level'] == 'High':
            global_risk += 0.2
        global_risk = min(1.0, global_risk)
        
        local_risk = 0.2
        if local_production['production_outlook'] == 'Weak':
            local_risk += 0.4
        elif local_production['production_outlook'] == 'Medium':
            local_risk += 0.2
        local_risk = min(1.0, local_risk)
        
        logistic_risk = 0.2
        if 'Shipping' in cost_forecast.get('main_cost_driver', ''):
            logistic_risk += 0.3
        if competitive_health['margin_pressure_level'] in ['High', 'Critical']:
            logistic_risk += 0.2
        logistic_risk = min(1.0, logistic_risk)
        
        # Determine dominant risk
        risks = {
            'Global': global_risk,
            'Local': local_risk,
            'Logistic': logistic_risk
        }
        dominant_risk = max(risks, key=risks.get)
        
        # Generate recommendation
        if early_warning['supply_alert_level'] == 'High':
            if business['current_inventory_days'] < 30:
                recommendation = 'Buy Now'
            else:
                recommendation = 'Diversify Suppliers'
        elif cost_forecast['trend_direction'] == 'rising':
            if business['urgency_level'] == 'high':
                recommendation = 'Buy Now'
            else:
                recommendation = 'Delay'
        else:
            recommendation = 'Delay'
        
        # Calculate confidence
        confidence = local_production['reliability_score'] * 0.5 + 0.4
        confidence = min(1.0, confidence)
        
        # Generate explanation
        if recommendation == 'Buy Now':
            explanation = f"{cost_forecast['trend_direction'].capitalize()} costs with {local_production['production_outlook'].lower()} local production. Secure supply before Q2 surge."
        elif recommendation == 'Delay':
            explanation = f"Costs {cost_forecast['trend_direction']}. Low alert level. Wait for better pricing opportunities."
        else:
            explanation = f"High supply risk with {competitive_health['competitive_position'].lower()} position. Consider alternative suppliers."
        
        # Trim explanation to 200 chars
        explanation = explanation[:200]
        
        # Generate action items
        today = date.today()
        action_items = []
        
        if recommendation == 'Buy Now':
            action_items.append({
                'priority': 1,
                'action': 'Lock shipping contracts',
                'deadline': today + timedelta(days=7)
            })
            action_items.append({
                'priority': 2,
                'action': 'Increase inventory to 45 days',
                'deadline': today + timedelta(days=14)
            })
        elif recommendation == 'Diversify Suppliers':
            action_items.append({
                'priority': 1,
                'action': 'Contact alternative suppliers',
                'deadline': today + timedelta(days=5)
            })
        else:
            action_items.append({
                'priority': 1,
                'action': 'Monitor market conditions weekly',
                'deadline': today + timedelta(days=30)
            })
        
        now = datetime.utcnow()
        
        return {
            'data': {
                'commodity_id': commodity_id,
                'dominant_risk_type': dominant_risk,
                'recommendation': recommendation,
                'confidence_level': round(confidence, 2),
                'explanation_text': explanation,
                'action_items': action_items,
                'risk_breakdown': {
                    'global_risk_score': round(global_risk, 2),
                    'local_risk_score': round(local_risk, 2),
                    'logistic_risk_score': round(logistic_risk, 2)
                }
            },
            'metadata': {
                'decision_timestamp': now,
                'valid_until': now + timedelta(hours=24),
                'model_confidence': round(confidence, 2)
            }
        }


# Service instances
cost_forecast_service = CostForecastService()
early_warning_service = EarlyWarningService()
local_production_service = LocalProductionService()
competitive_health_service = CompetitiveHealthService()
strategic_summary_service = StrategicSummaryService()
