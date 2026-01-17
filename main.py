"""
Supply & Market Analysis Model - REST API Server
FastAPI application serving 5 production-grade APIs
"""
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import uvicorn

from api.routes.api_routes import (
    forecast_router,
    alerts_router,
    outlook_router,
    market_router,
    strategy_router
)
from api.middleware.security import (
    RateLimitMiddleware,
    RequestLoggingMiddleware,
    verify_token
)


# Create FastAPI application
app = FastAPI(
    title="Supply & Market Analysis API",
    description="""
    ## 🌍 Supply & Market Analysis Model API
    
    Production-grade REST APIs for market intelligence and cost forecasting.

    ### Available APIs:
    
    1. **Cost Forecast API** - Predict landed cost per commodity
    2. **Early Warning API** - Detect abnormal cost spikes
    3. **Local Production Outlook API** - Classify production health
    4. **Competitive Market Health API** - Analyze pricing pressure
    5. **Strategic Summary API** - Decision-ready insights
    
    ### Authentication
    All endpoints require Bearer token authentication:
    ```
    Authorization: Bearer sk-haeel-prod-2024
    ```
    
    ### Available Test Tokens:
    - `sk-haeel-prod-2024` - Production (100 req/min)
    - `sk-haeel-test-2024` - Testing (200 req/min)
    - `sk-haeel-admin-2024` - Admin (500 req/min)
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# Add Middleware (order matters - first added = last executed)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error": {
                "code": "INTERNAL_ERROR",
                "message": str(exc),
                "details": None
            }
        }
    )


# Health check endpoint (no auth required)
@app.get("/health", tags=["Health"])
async def health_check():
    """Check API server health status"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


# Root endpoint (no auth required)
@app.get("/", tags=["Root"])
async def root():
    """API root endpoint with documentation links"""
    return {
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


# Include routers with version prefix and authentication
app.include_router(
    forecast_router, 
    prefix="/v1/supply-market",
    dependencies=[Depends(verify_token)]
)
app.include_router(
    alerts_router, 
    prefix="/v1/supply-market",
    dependencies=[Depends(verify_token)]
)
app.include_router(
    outlook_router, 
    prefix="/v1/supply-market",
    dependencies=[Depends(verify_token)]
)
app.include_router(
    market_router, 
    prefix="/v1/supply-market",
    dependencies=[Depends(verify_token)]
)
app.include_router(
    strategy_router, 
    prefix="/v1/supply-market",
    dependencies=[Depends(verify_token)]
)


if __name__ == "__main__":
    print("=" * 60)
    print("Supply & Market Analysis API Server")
    print("=" * 60)
    print("\nStarting server at http://localhost:8000")
    print("API Docs: http://localhost:8000/docs")
    print("\nTest tokens:")
    print("  - sk-haeel-prod-2024 (Production)")
    print("  - sk-haeel-test-2024 (Testing)")
    print("  - sk-haeel-admin-2024 (Admin)")
    print("=" * 60)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )

