/**
 * البيانات النموذجية للعرض - بالعربية
 */
const SAMPLE_DATA = {
    commodities: [
        {
            id: 'wheat',
            name: 'القمح',
            icon: '🌾',
            price: 640.50,
            trend: 'rising',
            change: 2.4,
            alertLevel: 'Medium',
            lastUpdate: '2026-01-18'
        },
        {
            id: 'sugar',
            name: 'السكر',
            icon: '🍚',
            price: 780.30,
            trend: 'stable',
            change: -1.2,
            alertLevel: 'Low',
            lastUpdate: '2026-01-18'
        },
        {
            id: 'oil',
            name: 'الزيت',
            icon: '🛢️',
            price: 1520.75,
            trend: 'rising',
            change: 3.8,
            alertLevel: 'High',
            lastUpdate: '2026-01-18'
        }
    ],
    alerts: [
        {
            id: 1,
            level: 'high',
            commodity: 'الزيت',
            title: 'ارتفاع كبير متوقع في الأسعار',
            message: 'من المتوقع ارتفاع أسعار الزيت بنسبة 18.5% خلال الـ 30 يوماً القادمة',
            time: 'منذ ساعتين'
        },
        {
            id: 2,
            level: 'medium',
            commodity: 'القمح',
            title: 'ضغط متوسط على سلسلة التوريد',
            message: 'ارتفاع تكاليف الشحن بسبب التحديات اللوجستية العالمية',
            time: 'منذ 5 ساعات'
        },
        {
            id: 3,
            level: 'low',
            commodity: 'السكر',
            title: 'ظروف سوق مستقرة',
            message: 'سوق السكر يظهر اتجاهات مستقرة مع تقلبات منخفضة',
            time: 'منذ يوم واحد'
        }
    ]
};

/**
 * تهيئة لوحة التحكم
 */
async function initDashboard() {
    try {
        showLoading('جاري تحميل البيانات...');

        await checkAPIHealth();
        await loadDashboardData();

        initializePriceTrendsChart();
        initializeRiskDistributionChart();
        updateLastUpdateTime();

        hideLoading();
    } catch (error) {
        console.error('خطأ في تهيئة لوحة التحكم:', error);
        hideLoading();
        showAlert('فشل تحميل بيانات لوحة التحكم. استخدام البيانات النموذجية.', 'warning');
        loadSampleData();
    }
}

/**
 * تحميل البيانات النموذجية
 */
function loadSampleData() {
    document.getElementById('wheatPrice').textContent = formatCurrency(SAMPLE_DATA.commodities[0].price);
    document.getElementById('sugarPrice').textContent = formatCurrency(SAMPLE_DATA.commodities[1].price);
    document.getElementById('oilPrice').textContent = formatCurrency(SAMPLE_DATA.commodities[2].price);
    document.getElementById('activeAlerts').textContent = SAMPLE_DATA.alerts.filter(a => a.level !== 'low').length;

    renderCommodityCards();
    renderAlerts();
}

/**
 * عرض بطاقات السلع
 */
function renderCommodityCards() {
    const container = document.getElementById('commodityGrid');

    container.innerHTML = SAMPLE_DATA.commodities.map(commodity => `
        <div class="commodity-card slide-up">
            <div class="commodity-header">
                <h3 class="commodity-name">${commodity.name}</h3>
                <span class="commodity-icon">${commodity.icon}</span>
            </div>
            <div class="commodity-price">${formatCurrency(commodity.price)}</div>
            <div class="commodity-meta">
                <span class="badge ${getTrendBadgeClass(commodity.trend)}">
                    <i class="fas fa-arrow-${commodity.trend === 'rising' ? 'up' : commodity.trend === 'falling' ? 'down' : 'right'}"></i>
                    ${commodity.trend === 'rising' ? 'صاعد' : commodity.trend === 'falling' ? 'هابط' : 'مستقر'}
                </span>
                <span class="badge ${getAlertBadgeClass(commodity.alertLevel)}">
                    تنبيه ${commodity.alertLevel === 'High' ? 'عالي' : commodity.alertLevel === 'Medium' ? 'متوسط' : 'منخفض'}
                </span>
            </div>
            <div class="commodity-trend" style="margin-top: 1rem;">
                <span style="color: ${commodity.change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                    <i class="fas fa-arrow-${commodity.change >= 0 ? 'up' : 'down'}"></i>
                    ${Math.abs(commodity.change)}%
                </span>
                <span style="color: var(--text-muted); font-size: 0.875rem;">مقارنة بالشهر الماضي</span>
            </div>
            <div style="margin-top: 1rem;">
                <a href="pages/forecast.html?commodity=${commodity.id}" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-chart-line"></i>
                    عرض التنبؤ
                </a>
            </div>
        </div>
    `).join('');
}

/**
 * عرض التنبيهات
 */
function renderAlerts() {
    const container = document.getElementById('alertsContainer');

    if (SAMPLE_DATA.alerts.length === 0) {
        container.innerHTML = `
            <div class="card text-center">
                <p class="text-muted">لا توجد تنبيهات نشطة</p>
            </div>
        `;
        return;
    }

    container.innerHTML = SAMPLE_DATA.alerts.map(alert => `
        <div class="alert-item ${alert.level}">
            <div class="alert-icon">
                <i class="fas fa-${alert.level === 'high' ? 'triangle-exclamation' : alert.level === 'medium' ? 'circle-exclamation' : 'circle-info'}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">
                    ${alert.commodity}: ${alert.title}
                </div>
                <div class="alert-message">${alert.message}</div>
                <div class="alert-time">
                    <i class="fas fa-clock"></i>
                    ${alert.time}
                </div>
            </div>
            <span class="badge ${getAlertBadgeClass(alert.level === 'high' ? 'High' : alert.level === 'medium' ? 'Medium' : 'Low')}">
                ${alert.level === 'high' ? 'عالي' : alert.level === 'medium' ? 'متوسط' : 'منخفض'}
            </span>
        </div>
    `).join('');
}

/**
 * تهيئة رسم اتجاهات الأسعار
 */
function initializePriceTrendsChart() {
    const ctx = document.getElementById('priceTrendsChart');

    const labels = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }));
    }

    const generateTrend = (base, volatility) => {
        const data = [];
        let current = base;
        for (let i = 0; i < 30; i++) {
            current += (Math.random() - 0.5) * volatility;
            data.push(current.toFixed(2));
        }
        return data;
    };

    priceTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'القمح',
                    data: generateTrend(620, 15),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'السكر',
                    data: generateTrend(760, 20),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'الزيت',
                    data: generateTrend(1480, 40),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        padding: 15,
                        font: { size: 12, family: 'Cairo' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    borderWidth: 1,
                    rtl: true
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45, font: { family: 'Cairo' } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: {
                        color: '#94a3b8',
                        callback: value => '$' + value
                    }
                }
            }
        }
    });
}

/**
 * تهيئة رسم توزيع المخاطر
 */
function initializeRiskDistributionChart() {
    const ctx = document.getElementById('riskDistributionChart');

    riskDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['المخاطر العالمية', 'المخاطر المحلية', 'المخاطر اللوجستية', 'مخاطر منخفضة'],
            datasets: [{
                data: [35, 25, 20, 20],
                backgroundColor: ['#ef4444', '#f59e0b', '#6366f1', '#10b981'],
                borderColor: '#0f172a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        padding: 15,
                        font: { size: 12, family: 'Cairo' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    borderWidth: 1,
                    rtl: true,
                    callbacks: {
                        label: ctx => ctx.label + ': ' + ctx.parsed + '%'
                    }
                }
            }
        }
    });
}

/**
 * تحديث وقت آخر تحديث
 */
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('lastUpdate').innerHTML = `
        <i class="fas fa-clock"></i>
        آخر تحديث: ${timeString}
    `;
}

/**
 * تحديث لوحة التحكم
 */
async function refreshDashboard() {
    try {
        showLoading('جاري التحديث...');
        await loadDashboardData();
        updateLastUpdateTime();
        hideLoading();
        showAlert('تم تحديث لوحة التحكم بنجاح!', 'success');
    } catch (error) {
        console.error('خطأ في التحديث:', error);
        hideLoading();
        showAlert('فشل تحديث لوحة التحكم', 'danger');
    }
}

async function checkAPIHealth() {
    try {
        const health = await apiClient.healthCheck();
        console.log('حالة الـ API:', health);
        return true;
    } catch (error) {
        console.error('فشل فحص صحة API:', error);
        throw error;
    }
}

async function loadDashboardData() {
    loadSampleData();
}

// تهيئة لوحة التحكم عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initDashboard);

// تحديث تلقائي كل دقيقة
setInterval(updateLastUpdateTime, 60000);
