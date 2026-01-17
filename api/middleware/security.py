"""
Security Middleware for Supply & Market Analysis API
Includes: Authentication, Rate Limiting, Caching
"""
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from datetime import datetime, timedelta
from typing import Dict, Optional
import hashlib
import time
import json


# ==========================================
# Configuration
# ==========================================

class APIConfig:
    """API Configuration - In production, load from environment variables"""
    
    # Valid API tokens (in production, use database or secure vault)
    VALID_TOKENS = {
        "sk-haeel-prod-2024": {"name": "Production Client", "rate_limit": 100},
        "sk-haeel-test-2024": {"name": "Test Client", "rate_limit": 200},
        "sk-haeel-admin-2024": {"name": "Admin Client", "rate_limit": 500},
    }
    
    # Rate limits per endpoint (requests per minute)
    RATE_LIMITS = {
        "/v1/supply-market/forecast/cost": 100,
        "/v1/supply-market/alerts/early-warning": 200,
        "/v1/supply-market/outlook/local-production": 50,
        "/v1/supply-market/market/competitive-health": 100,
        "/v1/supply-market/strategy/summary": 30,
    }
    
    # Cache TTL in seconds
    CACHE_TTL = {
        "/v1/supply-market/forecast/cost": 3600,  # 1 hour
        "/v1/supply-market/outlook/local-production": 21600,  # 6 hours
        "/v1/supply-market/strategy/summary": 86400,  # 24 hours
    }


# ==========================================
# In-Memory Storage (Use Redis in production)
# ==========================================

class InMemoryStore:
    """Simple in-memory store for rate limiting and caching"""
    
    def __init__(self):
        self.rate_limit_buckets: Dict[str, Dict] = {}
        self.cache: Dict[str, Dict] = {}
    
    def get_rate_limit_bucket(self, key: str) -> Dict:
        """Get or create rate limit bucket for a key"""
        now = time.time()
        
        if key not in self.rate_limit_buckets:
            self.rate_limit_buckets[key] = {
                "count": 0,
                "window_start": now
            }
        
        bucket = self.rate_limit_buckets[key]
        
        # Reset if window expired (1 minute)
        if now - bucket["window_start"] > 60:
            bucket["count"] = 0
            bucket["window_start"] = now
        
        return bucket
    
    def increment_rate_limit(self, key: str) -> int:
        """Increment rate limit counter and return current count"""
        bucket = self.get_rate_limit_bucket(key)
        bucket["count"] += 1
        return bucket["count"]
    
    def get_cache(self, key: str) -> Optional[Dict]:
        """Get cached response if not expired"""
        if key in self.cache:
            entry = self.cache[key]
            if time.time() < entry["expires_at"]:
                return entry["data"]
            else:
                del self.cache[key]
        return None
    
    def set_cache(self, key: str, data: Dict, ttl: int):
        """Cache response with TTL"""
        self.cache[key] = {
            "data": data,
            "expires_at": time.time() + ttl
        }
    
    def clear_expired(self):
        """Clear expired entries"""
        now = time.time()
        
        # Clear expired cache
        expired_keys = [
            k for k, v in self.cache.items() 
            if now >= v["expires_at"]
        ]
        for k in expired_keys:
            del self.cache[k]


# Global store instance
store = InMemoryStore()


# ==========================================
# Authentication
# ==========================================

security = HTTPBearer(auto_error=False)


async def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict:
    """
    Verify Bearer token and return client info
    """
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Missing authentication token",
                "details": {"hint": "Include 'Authorization: Bearer <token>' header"}
            }
        )
    
    token = credentials.credentials
    
    if token not in APIConfig.VALID_TOKENS:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Invalid authentication token",
                "details": None
            }
        )
    
    return APIConfig.VALID_TOKENS[token]


# ==========================================
# Rate Limiting Middleware
# ==========================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware that tracks requests per client per endpoint
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for non-API routes
        if not request.url.path.startswith("/v1/"):
            return await call_next(request)
        
        # Get client identifier (token or IP)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            client_id = auth_header[7:][:16]  # First 16 chars of token
        else:
            client_id = request.client.host if request.client else "unknown"
        
        # Get rate limit for this endpoint
        endpoint = request.url.path
        rate_limit = APIConfig.RATE_LIMITS.get(endpoint, 100)
        
        # Create bucket key
        bucket_key = f"{client_id}:{endpoint}"
        
        # Check rate limit
        current_count = store.increment_rate_limit(bucket_key)
        
        if current_count > rate_limit:
            return JSONResponse(
                status_code=429,
                content={
                    "status": "error",
                    "error": {
                        "code": "RATE_LIMITED",
                        "message": f"Rate limit exceeded. Maximum {rate_limit} requests per minute.",
                        "details": {
                            "limit": rate_limit,
                            "current": current_count,
                            "retry_after": 60
                        }
                    }
                },
                headers={"Retry-After": "60"}
            )
        
        # Add rate limit headers to response
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(rate_limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, rate_limit - current_count))
        
        return response


# ==========================================
# Caching Middleware
# ==========================================

class CachingMiddleware(BaseHTTPMiddleware):
    """
    Response caching middleware for GET-like POST requests
    """
    
    async def dispatch(self, request: Request, call_next):
        # Only cache specific endpoints
        endpoint = request.url.path
        ttl = APIConfig.CACHE_TTL.get(endpoint)
        
        if ttl is None or request.method != "POST":
            return await call_next(request)
        
        # Generate cache key from request body
        try:
            body = await request.body()
            cache_key = f"{endpoint}:{hashlib.md5(body).hexdigest()}"
            
            # Check cache
            cached = store.get_cache(cache_key)
            if cached:
                return JSONResponse(
                    content=cached,
                    headers={"X-Cache": "HIT"}
                )
        except Exception:
            return await call_next(request)
        
        # Get response
        response = await call_next(request)
        
        # Cache successful responses
        # Note: In production, use a more sophisticated approach
        # This is simplified for demonstration
        
        return response


# ==========================================
# Request Logging Middleware
# ==========================================

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Log all API requests for audit trail
    """
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log request (in production, send to logging service)
        if request.url.path.startswith("/v1/"):
            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round(duration * 1000, 2),
                "client_ip": request.client.host if request.client else "unknown"
            }
            # Print to console (replace with proper logging in production)
            print(f"[API] {log_entry['method']} {log_entry['path']} - {log_entry['status_code']} ({log_entry['duration_ms']}ms)")
        
        return response
