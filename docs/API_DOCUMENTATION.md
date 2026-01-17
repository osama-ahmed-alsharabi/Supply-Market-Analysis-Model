# 📚 Supply & Market Analysis API - Complete Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
   - [Cost Forecast API](#1-cost-forecast-api)
   - [Early Warning API](#2-early-warning-api)
   - [Local Production Outlook API](#3-local-production-outlook-api)
   - [Competitive Market Health API](#4-competitive-market-health-api)
   - [Strategic Summary API](#5-strategic-summary-api)
5. [Data Schemas](#data-schemas)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Security & Middleware](#security--middleware)
9. [Project Structure](#project-structure)
10. [Running the API](#running-the-api)

---

## Overview

**Supply & Market Analysis API** is a production-grade REST API system designed for market intelligence and cost forecasting. It integrates with an AI Orchestration System to provide deterministic, machine-readable insights for commodity trading decisions.

### Key Features
- ✅ **5 Production-Ready APIs** - Cost forecasting, early warning, production outlook, competitive health, strategic summary
- ✅ **XGBoost ML Model** - Advanced machine learning with SHAP interpretability
- ✅ **Bearer Token Authentication** - Secure API access
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **Request Logging** - Audit trail for all API calls
- ✅ **Caching** - Performance optimization

### Supported Commodities
| Commodity ID | Description |
|-------------|-------------|
| `wheat` | قمح - Wheat |
| `sugar` | سكر - Sugar |
| `oil` | زيت - Oil |

---

## Quick Start

### 1. Install Dependencies
```bash
cd "f:\All Projects\Haeel Saeed Model"
pip install -r requirements.txt
```

### 2. Start the API Server
```bash
python main.py
```

### 3. Access Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### 4. Test the API
```bash
curl -X GET http://localhost:8000/health
```

---

## Authentication

All API endpoints (except `/health` and `/`) require **Bearer Token** authentication.

### Available Tokens

| Token | Client Type | Rate Limit |
|-------|-------------|------------|
| `sk-haeel-prod-2024` | Production | 100 req/min |
| `sk-haeel-test-2024` | Testing | 200 req/min |
| `sk-haeel-admin-2024` | Admin | 500 req/min |

### Request Header
```http
Authorization: Bearer sk-haeel-prod-2024
Content-Type: application/json
```

### Authentication Errors

**401 Unauthorized - Missing Token**
```json
{
  "detail": {
    "code": "UNAUTHORIZED",
    "message": "Missing authentication token",
    "details": {"hint": "Include 'Authorization: Bearer <token>' header"}
  }
}
```

**401 Unauthorized - Invalid Token**
```json
{
  "detail": {
    "code": "UNAUTHORIZED",
    "message": "Invalid authentication token",
    "details": null
  }
}
```

---

## API Endpoints

### Base URL
```
http://localhost:8000/v1/supply-market
```

---

### 1. Cost Forecast API

**Predict landed cost per commodity for specified date range.**

#### Endpoint
```http
POST /v1/supply-market/forecast/cost
```

#### Request Body
```json
{
  "commodity_id": "wheat",
  "date_range": {
    "start_date": "2026-01-01",
    "end_date": "2026-06-30"
  },
  "market_indicators": {
    "global_price_anomaly": 25.0,
    "shipping_index": 120.0,
    "insurance_risk_index": 0.35,
    "supply_chain_stress_index": 65.0
  }
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `commodity_id` | string | ✅ | One of: `wheat`, `sugar`, `oil` |
| `date_range.start_date` | date | ✅ | Start date (YYYY-MM-DD) |
| `date_range.end_date` | date | ✅ | End date (YYYY-MM-DD) |
| `market_indicators.global_price_anomaly` | float | ✅ | USD/ton deviation |
| `market_indicators.shipping_index` | float | ✅ | 0-200 scale |
| `market_indicators.insurance_risk_index` | float | ✅ | 0.0-1.0 |
| `market_indicators.supply_chain_stress_index` | float | ✅ | 0-100 |

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "commodity_id": "wheat",
    "predictions": [
      {
        "date": "2026-01-01",
        "predicted_landed_cost_usd": 635.50,
        "confidence_score": 0.92,
        "main_cost_driver": "Index_Cost_Shipping"
      },
      {
        "date": "2026-02-01",
        "predicted_landed_cost_usd": 642.80,
        "confidence_score": 0.88,
        "main_cost_driver": "Index_Cost_Shipping"
      }
    ],
    "summary": {
      "avg_cost": 639.15,
      "min_cost": 635.50,
      "max_cost": 642.80,
      "trend_direction": "rising"
    }
  },
  "metadata": {
    "model_version": "xgboost-v2.1",
    "generated_at": "2026-01-17T17:55:00Z"
  }
}
```

#### cURL Example
```bash
curl -X POST "http://localhost:8000/v1/supply-market/forecast/cost" \
  -H "Authorization: Bearer sk-haeel-prod-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "commodity_id": "wheat",
    "date_range": {"start_date": "2026-01-01", "end_date": "2026-06-30"},
    "market_indicators": {
      "global_price_anomaly": 25.0,
      "shipping_index": 120.0,
      "insurance_risk_index": 0.35,
      "supply_chain_stress_index": 65.0
    }
  }'
```

---

### 2. Early Warning API

**Detect abnormal future cost spikes based on predicted vs historical data.**

#### Endpoint
```http
POST /v1/supply-market/alerts/early-warning
```

#### Request Body
```json
{
  "commodity_id": "sugar",
  "predicted_cost_series": [
    {"date": "2026-02-01", "cost": 780.0},
    {"date": "2026-03-01", "cost": 820.0},
    {"date": "2026-04-01", "cost": 890.0}
  ],
  "historical_baseline": {
    "avg_cost_30d": 750.0,
    "avg_cost_90d": 720.0,
    "std_dev": 45.0
  },
  "alert_thresholds": {
    "medium_pct": 10.0,
    "high_pct": 15.0
  }
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `commodity_id` | string | ✅ | One of: `wheat`, `sugar`, `oil` |
| `predicted_cost_series` | array | ✅ | List of date/cost pairs |
| `predicted_cost_series[].date` | date | ✅ | Prediction date |
| `predicted_cost_series[].cost` | float | ✅ | Predicted cost |
| `historical_baseline.avg_cost_30d` | float | ✅ | 30-day average |
| `historical_baseline.avg_cost_90d` | float | ✅ | 90-day average |
| `historical_baseline.std_dev` | float | ✅ | Standard deviation |
| `alert_thresholds.medium_pct` | float | ❌ | Medium threshold (default: 10%) |
| `alert_thresholds.high_pct` | float | ❌ | High threshold (default: 15%) |

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "commodity_id": "sugar",
    "supply_alert_level": "High",
    "expected_increase_percentage": 23.6,
    "trigger_reason": "Severe cost deviation detected - multiple risk factors converging",
    "alert_details": {
      "peak_date": "2026-04-01",
      "peak_cost": 890.0,
      "days_until_peak": 74
    },
    "recommended_action": "Consider immediate procurement"
  }
}
```

#### cURL Example
```bash
curl -X POST "http://localhost:8000/v1/supply-market/alerts/early-warning" \
  -H "Authorization: Bearer sk-haeel-prod-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "commodity_id": "sugar",
    "predicted_cost_series": [
      {"date": "2026-02-01", "cost": 780.0},
      {"date": "2026-03-01", "cost": 820.0},
      {"date": "2026-04-01", "cost": 890.0}
    ],
    "historical_baseline": {"avg_cost_30d": 750.0, "avg_cost_90d": 720.0, "std_dev": 45.0}
  }'
```

---

### 3. Local Production Outlook API

**Classify local agricultural production health based on environmental indicators.**

#### Endpoint
```http
POST /v1/supply-market/outlook/local-production
```

#### Request Body
```json
{
  "region_id": "YEM_SOUTH",
  "commodity_id": "wheat",
  "environmental_data": {
    "ndvi_index": 0.55,
    "rainfall_anomaly": -30.0,
    "temperature_anomaly": 2.5
  },
  "seasonal_factor": "growing",
  "reference_date": "2026-01-17"
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `region_id` | string | ✅ | Region identifier |
| `commodity_id` | string | ✅ | One of: `wheat`, `sugar`, `oil` |
| `environmental_data.ndvi_index` | float | ✅ | Vegetation health 0.0-1.0 |
| `environmental_data.rainfall_anomaly` | float | ✅ | Deviation from normal (mm) |
| `environmental_data.temperature_anomaly` | float | ❌ | Deviation from normal (°C) |
| `seasonal_factor` | string | ✅ | One of: `planting`, `growing`, `harvest` |
| `reference_date` | date | ✅ | Reference date for analysis |

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "region_id": "YEM_SOUTH",
    "commodity_id": "wheat",
    "production_outlook": "Medium",
    "reliability_score": 0.78,
    "impact_factors": [
      {"factor": "ndvi_index", "impact": "neutral", "weight": 0.45},
      {"factor": "rainfall_anomaly", "impact": "positive", "weight": 0.35},
      {"factor": "seasonal_factor", "impact": "positive", "weight": 0.20}
    ],
    "expected_yield_change_pct": 2.4
  }
}
```

#### cURL Example
```bash
curl -X POST "http://localhost:8000/v1/supply-market/outlook/local-production" \
  -H "Authorization: Bearer sk-haeel-prod-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "region_id": "YEM_SOUTH",
    "commodity_id": "wheat",
    "environmental_data": {"ndvi_index": 0.55, "rainfall_anomaly": -30.0},
    "seasonal_factor": "growing",
    "reference_date": "2026-01-17"
  }'
```

---

### 4. Competitive Market Health API

**Analyze pricing pressure and margins relative to competition.**

#### Endpoint
```http
POST /v1/supply-market/market/competitive-health
```

#### Request Body
```json
{
  "commodity_id": "oil",
  "pricing_data": {
    "local_market_price": 1650.0,
    "landed_cost": 1520.0,
    "competitor_price_index": 102.5
  },
  "market_context": {
    "market_share_pct": 35.0,
    "inventory_days": 45
  }
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `commodity_id` | string | ✅ | One of: `wheat`, `sugar`, `oil` |
| `pricing_data.local_market_price` | float | ✅ | USD/ton |
| `pricing_data.landed_cost` | float | ✅ | USD/ton |
| `pricing_data.competitor_price_index` | float | ✅ | Relative index (100 = parity) |
| `market_context.market_share_pct` | float | ❌ | Market share percentage |
| `market_context.inventory_days` | int | ❌ | Days of inventory |

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "commodity_id": "oil",
    "usd_spread_price_market": 130.0,
    "margin_pressure_level": "Low",
    "gross_margin_pct": 7.9,
    "competitive_position": "Advantaged",
    "pricing_recommendation": {
      "action": "maintain_strategy",
      "target_price": 1650.0,
      "rationale": "Current pricing optimal for market conditions"
    }
  }
}
```

#### cURL Example
```bash
curl -X POST "http://localhost:8000/v1/supply-market/market/competitive-health" \
  -H "Authorization: Bearer sk-haeel-prod-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "commodity_id": "oil",
    "pricing_data": {"local_market_price": 1650.0, "landed_cost": 1520.0, "competitor_price_index": 102.5}
  }'
```

---

### 5. Strategic Summary API

**Provide high-level, decision-ready insight for Master Model orchestration.**

#### Endpoint
```http
POST /v1/supply-market/strategy/summary
```

#### Request Body
```json
{
  "commodity_id": "wheat",
  "api_outputs": {
    "cost_forecast": {
      "avg_predicted_cost": 640.0,
      "trend_direction": "rising",
      "main_cost_driver": "Index_Cost_Shipping"
    },
    "early_warning": {
      "supply_alert_level": "Medium",
      "expected_increase_pct": 12.5
    },
    "local_production": {
      "production_outlook": "Medium",
      "reliability_score": 0.78
    },
    "competitive_health": {
      "margin_pressure_level": "Moderate",
      "competitive_position": "Neutral"
    }
  },
  "business_context": {
    "current_inventory_days": 25,
    "budget_available": 500000.0,
    "urgency_level": "medium"
  }
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `commodity_id` | string | ✅ | One of: `wheat`, `sugar`, `oil` |
| `api_outputs.cost_forecast.avg_predicted_cost` | float | ✅ | Average predicted cost |
| `api_outputs.cost_forecast.trend_direction` | string | ✅ | `rising`, `falling`, `stable` |
| `api_outputs.cost_forecast.main_cost_driver` | string | ✅ | Primary cost driver |
| `api_outputs.early_warning.supply_alert_level` | string | ✅ | `Low`, `Medium`, `High` |
| `api_outputs.early_warning.expected_increase_pct` | float | ✅ | Expected percentage increase |
| `api_outputs.local_production.production_outlook` | string | ✅ | `Weak`, `Medium`, `Good` |
| `api_outputs.local_production.reliability_score` | float | ✅ | 0.0-1.0 |
| `api_outputs.competitive_health.margin_pressure_level` | string | ✅ | `Low`, `Moderate`, `High`, `Critical` |
| `api_outputs.competitive_health.competitive_position` | string | ✅ | `Advantaged`, `Neutral`, `Disadvantaged` |
| `business_context.current_inventory_days` | int | ✅ | Current inventory in days |
| `business_context.budget_available` | float | ✅ | Available budget (USD) |
| `business_context.urgency_level` | string | ✅ | `low`, `medium`, `high` |

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "commodity_id": "wheat",
    "dominant_risk_type": "Global",
    "recommendation": "Delay",
    "confidence_level": 0.79,
    "explanation_text": "Costs rising. Low alert level. Wait for better pricing opportunities.",
    "action_items": [
      {
        "priority": 1,
        "action": "Monitor market conditions weekly",
        "deadline": "2026-02-16"
      }
    ],
    "risk_breakdown": {
      "global_risk_score": 0.60,
      "local_risk_score": 0.40,
      "logistic_risk_score": 0.35
    }
  },
  "metadata": {
    "decision_timestamp": "2026-01-17T17:55:00Z",
    "valid_until": "2026-01-18T17:55:00Z",
    "model_confidence": 0.79
  }
}
```

#### cURL Example
```bash
curl -X POST "http://localhost:8000/v1/supply-market/strategy/summary" \
  -H "Authorization: Bearer sk-haeel-prod-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "commodity_id": "wheat",
    "api_outputs": {
      "cost_forecast": {"avg_predicted_cost": 640.0, "trend_direction": "rising", "main_cost_driver": "Index_Cost_Shipping"},
      "early_warning": {"supply_alert_level": "Medium", "expected_increase_pct": 12.5},
      "local_production": {"production_outlook": "Medium", "reliability_score": 0.78},
      "competitive_health": {"margin_pressure_level": "Moderate", "competitive_position": "Neutral"}
    },
    "business_context": {"current_inventory_days": 25, "budget_available": 500000.0, "urgency_level": "medium"}
  }'
```

---

## Data Schemas

### Common Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `success` or `error` |
| `data` | object | Response payload |
| `metadata` | object | Model version, timestamp |

### Trend Direction Values
- `rising` - Upward trend
- `falling` - Downward trend
- `stable` - No significant change

### Alert Levels
- `Low` - Normal conditions
- `Medium` - Moderate concern
- `High` - Immediate attention required

### Production Outlook
- `Weak` - Poor production expected
- `Medium` - Average production expected
- `Good` - Strong production expected

### Margin Pressure Levels
- `Low` - Healthy margins (≥15%)
- `Moderate` - Acceptable margins (10-15%)
- `High` - Compressed margins (5-10%)
- `Critical` - Very low margins (<5%)

### Competitive Position
- `Advantaged` - Better than competitors (index > 105)
- `Neutral` - On par with competitors (95-105)
- `Disadvantaged` - Worse than competitors (index < 95)

### Recommendation Types
- `Buy Now` - Immediate procurement recommended
- `Delay` - Wait for better conditions
- `Diversify Suppliers` - Reduce supply concentration risk

---

## Error Handling

### Error Response Format
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Rate Limit Error (429)
```json
{
  "status": "error",
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Maximum 100 requests per minute.",
    "details": {
      "limit": 100,
      "current": 101,
      "retry_after": 60
    }
  }
}
```

---

## Rate Limiting

### Endpoint-Specific Limits

| Endpoint | Limit (req/min) |
|----------|-----------------|
| `/forecast/cost` | 100 |
| `/alerts/early-warning` | 200 |
| `/outlook/local-production` | 50 |
| `/market/competitive-health` | 100 |
| `/strategy/summary` | 30 |

### Response Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
Retry-After: 60
```

---

## Security & Middleware

### Middleware Stack
1. **CORSMiddleware** - Cross-origin resource sharing
2. **RateLimitMiddleware** - Request rate limiting
3. **RequestLoggingMiddleware** - Audit logging

### Request Logging
All API requests are logged with:
- Timestamp
- HTTP method
- Path
- Status code
- Duration (ms)
- Client IP

---

## Project Structure

```
f:\All Projects\Haeel Saeed Model\
├── api/
│   ├── __init__.py
│   ├── routes/
│   │   ├── __init__.py
│   │   └── api_routes.py          # API endpoint definitions
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── api_schemas.py         # Pydantic request/response models
│   ├── services/
│   │   ├── __init__.py
│   │   └── api_services.py        # Business logic
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── security.py            # Auth, rate limiting, caching
│   └── models/
│       └── __init__.py
├── src/
│   ├── __init__.py
│   ├── data_generator.py          # Synthetic data generation
│   ├── preprocessing.py           # Data preprocessing
│   ├── feature_engineering.py     # Feature creation
│   ├── models.py                  # XGBoost model & SHAP
│   └── utils.py                   # Helper functions
├── data/
│   └── synthetic_supply_market.csv
├── models/
│   └── xgboost_model.joblib       # Trained ML model
├── output/
│   └── predictions.csv
├── docs/
│   └── API_DOCUMENTATION.md       # This file
├── main.py                        # FastAPI application entry point
├── app.py                         # Streamlit dashboard
├── requirements.txt
└── README.md
```

---

## Running the API

### Development Mode
```bash
python main.py
```

### Production Mode (with uvicorn)
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker (if available)
```bash
docker build -t supply-market-api .
docker run -p 8000:8000 supply-market-api
```

---

## Health Check

### Endpoint
```http
GET /health
```

### Response
```json
{
  "status": "healthy",
  "timestamp": "2026-01-17T17:55:00Z",
  "version": "1.0.0"
}
```

---

## Root Endpoint

### Endpoint
```http
GET /
```

### Response
```json
{
  "name": "Supply & Market Analysis API",
  "version": "1.0.0",
  "documentation": {
    "swagger": "/docs",
    "redoc": "/redoc"
  },
  "endpoints": {
    "cost_forecast": "/v1/supply-market/forecast/cost",
    "early_warning": "/v1/supply-market/alerts/early-warning",
    "local_production": "/v1/supply-market/outlook/local-production",
    "competitive_health": "/v1/supply-market/market/competitive-health",
    "strategic_summary": "/v1/supply-market/strategy/summary"
  },
  "authentication": {
    "type": "Bearer Token",
    "header": "Authorization: Bearer <token>",
    "test_tokens": [
      "sk-haeel-prod-2024",
      "sk-haeel-test-2024",
      "sk-haeel-admin-2024"
    ]
  }
}
```

---

## Python SDK Example

```python
import requests

BASE_URL = "http://localhost:8000/v1/supply-market"
HEADERS = {
    "Authorization": "Bearer sk-haeel-prod-2024",
    "Content-Type": "application/json"
}

# Cost Forecast
response = requests.post(
    f"{BASE_URL}/forecast/cost",
    headers=HEADERS,
    json={
        "commodity_id": "wheat",
        "date_range": {"start_date": "2026-01-01", "end_date": "2026-06-30"},
        "market_indicators": {
            "global_price_anomaly": 25.0,
            "shipping_index": 120.0,
            "insurance_risk_index": 0.35,
            "supply_chain_stress_index": 65.0
        }
    }
)

data = response.json()
print(f"Average Cost: ${data['data']['summary']['avg_cost']}")
print(f"Trend: {data['data']['summary']['trend_direction']}")
```

---

## Support

For questions or issues:
1. Review this documentation
2. Check source code in `api/` directory
3. Verify API is running: `GET /health`

---

**Supply & Market Analysis API v1.0.0**  
Built with FastAPI, XGBoost, and SHAP
