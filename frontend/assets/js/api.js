/**
 * وحدة الاتصال بـ API - معرّب
 * يتعامل مع جميع الاتصالات مع خادم FastAPI
 */

// إعدادات API
const API_CONFIG = {
    baseUrl: 'http://localhost:8000',
    apiVersion: 'v1',
    endpoints: {
        costForecast: '/v1/supply-market/forecast/cost',
        earlyWarning: '/v1/supply-market/alerts/early-warning',
        localProduction: '/v1/supply-market/outlook/local-production',
        competitiveHealth: '/v1/supply-market/market/competitive-health',
        strategicSummary: '/v1/supply-market/strategy/summary',
        health: '/health'
    }
};

// رمز المصادقة
const AUTH_TOKEN = 'sk-haeel-prod-2024';

/**
 * فئة عميل API
 */
class APIClient {
    constructor(token = AUTH_TOKEN) {
        this.token = token;
        this.baseUrl = API_CONFIG.baseUrl;
    }

    getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'فشل الطلب');
            }

            return data;
        } catch (error) {
            console.error('خطأ في طلب API:', error);
            throw error;
        }
    }

    async healthCheck() {
        return this.request(API_CONFIG.endpoints.health);
    }

    async getCostForecast(data) {
        return this.request(API_CONFIG.endpoints.costForecast, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getEarlyWarning(data) {
        return this.request(API_CONFIG.endpoints.earlyWarning, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getLocalProduction(data) {
        return this.request(API_CONFIG.endpoints.localProduction, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getCompetitiveHealth(data) {
        return this.request(API_CONFIG.endpoints.competitiveHealth, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getStrategicSummary(data) {
        return this.request(API_CONFIG.endpoints.strategicSummary, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

// إنشاء نسخة عامة من العميل
const apiClient = new APIClient();

/**
 * الدوال المساعدة
 */

function showLoading(message = 'جاري التحميل...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
        <div style="text-align: center;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem; color: var(--text-secondary);">${message}</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatPercentage(value) {
    return `${value.toFixed(2)}%`;
}

function getCommodityName(commodityId) {
    const names = {
        'wheat': 'القمح',
        'sugar': 'السكر',
        'oil': 'الزيت'
    };
    return names[commodityId] || commodityId;
}

function getAlertBadgeClass(level) {
    const classes = {
        'Low': 'badge-success',
        'Medium': 'badge-warning',
        'High': 'badge-danger'
    };
    return classes[level] || 'badge-primary';
}

function getTrendBadgeClass(trend) {
    const classes = {
        'rising': 'badge-danger',
        'falling': 'badge-success',
        'stable': 'badge-primary'
    };
    return classes[trend] || 'badge-primary';
}

// تصدير للاستخدام في وحدات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APIClient,
        apiClient,
        showLoading,
        hideLoading,
        showAlert,
        formatDate,
        formatCurrency,
        formatPercentage,
        getCommodityName,
        getAlertBadgeClass,
        getTrendBadgeClass
    };
}
