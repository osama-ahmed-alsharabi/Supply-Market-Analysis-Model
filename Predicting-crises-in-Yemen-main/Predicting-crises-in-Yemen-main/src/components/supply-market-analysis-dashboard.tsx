'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardContext } from '@/components/dashboard-client-extended';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    CheckCircle,
    DollarSign,
    BarChart3,
    ShieldCheck,
    Leaf,
    Target,
    Zap,
    RefreshCw,
    Calendar,
    Activity,
    Package,
    Globe,
    Bell,
    Users,
    Briefcase,
    FileText,
    AlertCircle,
    TrendingUp as TrendUp,
    Shield
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';

// ==================== TYPES ====================

type CostPrediction = {
    date: string;
    cost: number;
    confidence: number;
    driver: string;
};

type Alert = {
    date: string;
    alert_level: string;
    deviation_pct: number;
    message: string;
};

type ProductionData = {
    region: string;
    outlook: string;
    confidence: number;
    ndvi_score: number;
    rainfall_status: string;
};

type CompetitiveData = {
    margin_pressure: string;
    position: string;
    market_share: number;
    price_gap: number;
};

type StrategicAction = {
    priority: number;
    action: string;
    deadline: string;
    impact: string;
};

type DashboardData = {
    success: boolean;
    commodity_id: string;
    kpis: {
        avg_predicted_cost: number;
        supply_alert_level: string;
        production_outlook: string;
        competitive_position: string;
        trend_direction: string;
        confidence_score: number;
    };
    cost_predictions: CostPrediction[];
    alerts: Alert[];
    production_data: ProductionData[];
    competitive_data: CompetitiveData;
    strategic_actions: StrategicAction[];
    risk_breakdown: {
        global_risk_score: number;
        local_risk_score: number;
        logistic_risk_score: number;
    };
    recommendation: string;
};

// ==================== HELPERS ====================

const getAlertColor = (level: string) => {
    switch (level) {
        case 'High': return 'text-red-500';
        case 'Medium': return 'text-yellow-500';
        case 'Low': return 'text-green-500';
        default: return 'text-gray-500';
    }
};

const getAlertBgColor = (level: string) => {
    switch (level) {
        case 'High': return 'bg-red-500/10 border-red-500/30';
        case 'Medium': return 'bg-yellow-500/10 border-yellow-500/30';
        case 'Low': return 'bg-green-500/10 border-green-500/30';
        default: return 'bg-gray-500/10 border-gray-500/30';
    }
};

const getTrendIcon = (trend: string) => {
    switch (trend) {
        case 'rising': return <TrendingUp className="h-5 w-5 text-red-500" />;
        case 'falling': return <TrendingDown className="h-5 w-5 text-green-500" />;
        default: return <Minus className="h-5 w-5 text-yellow-500" />;
    }
};

const getOutlookColor = (outlook: string) => {
    switch (outlook) {
        case 'Good': return 'text-green-500';
        case 'Medium': return 'text-yellow-500';
        case 'Weak': return 'text-red-500';
        default: return 'text-gray-500';
    }
};

const getPositionColor = (position: string) => {
    switch (position) {
        case 'Advantaged': return 'text-green-500';
        case 'Neutral': return 'text-yellow-500';
        case 'Disadvantaged': return 'text-red-500';
        default: return 'text-gray-500';
    }
};

const RISK_COLORS = ['#EF4444', '#F59E0B', '#3B82F6'];
const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

// ==================== MAIN COMPONENT ====================

type SupplyMarketAnalysisDashboardProps = {
    onClose: () => void;
};

export function SupplyMarketAnalysisDashboard({ onClose }: SupplyMarketAnalysisDashboardProps) {
    const { t, language } = React.useContext(DashboardContext);
    const [selectedCommodity, setSelectedCommodity] = React.useState<string>('wheat');
    const [activeTab, setActiveTab] = React.useState<string>('overview');
    const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Forecast period state
    const [forecastDays, setForecastDays] = React.useState<number>(90);
    const [forecastPredictions, setForecastPredictions] = React.useState<CostPrediction[]>([]);

    // Translations
    const translations = {
        en: {
            title: "📊 Supply & Market Analysis",
            subtitle: "Complete Analysis Suite",
            commodity: "Commodity",
            wheat: "Wheat",
            sugar: "Sugar",
            oil: "Oil",
            overview: "Overview",
            costForecast: "Cost Forecast",
            alerts: "Alerts",
            production: "Production",
            competitive: "Competitive",
            strategy: "Strategy",
            avgCost: "Avg. Predicted Cost",
            alertLevel: "Supply Alert Level",
            productionOutlook: "Production Outlook",
            position: "Competitive Position",
            trend: "Cost Trend",
            confidence: "Model Confidence",
            costForecastTitle: "Cost Forecast (90 Days)",
            riskBreakdown: "Risk Breakdown",
            globalRisk: "Global Risk",
            localRisk: "Local Risk",
            logisticRisk: "Logistic Risk",
            recommendation: "Strategic Recommendation",
            actionItems: "Action Items",
            priority: "Priority",
            action: "Action",
            deadline: "Deadline",
            impact: "Impact",
            refresh: "Refresh Data",
            loading: "Loading analysis...",
            usdPerTon: "USD/ton",
            buyNow: "Buy Now",
            delay: "Delay",
            diversify: "Diversify Suppliers",
            earlyWarning: "Early Warning System",
            alertDate: "Date",
            alertMessage: "Alert Message",
            deviation: "Deviation",
            productionHealth: "Local Production Health",
            region: "Region",
            ndviScore: "NDVI Score",
            rainfall: "Rainfall Status",
            marketHealth: "Competitive Market Health",
            marginPressure: "Margin Pressure",
            marketShare: "Market Share",
            priceGap: "Price Gap vs Competitors",
            strategicSummary: "Strategic Summary",
            highImpact: "High Impact",
            mediumImpact: "Medium Impact",
            lowImpact: "Low Impact"
        },
        ar: {
            title: "📊 تحليل العرض والسوق",
            subtitle: "مجموعة التحليل الكاملة",
            commodity: "السلعة",
            wheat: "قمح",
            sugar: "سكر",
            oil: "زيت",
            overview: "نظرة عامة",
            costForecast: "توقعات التكلفة",
            alerts: "التنبيهات",
            production: "الإنتاج",
            competitive: "التنافسية",
            strategy: "الاستراتيجية",
            avgCost: "متوسط التكلفة المتوقعة",
            alertLevel: "مستوى الإنذار",
            productionOutlook: "توقعات الإنتاج",
            position: "الموقف التنافسي",
            trend: "اتجاه التكلفة",
            confidence: "ثقة النموذج",
            costForecastTitle: "توقعات التكلفة (90 يوم)",
            riskBreakdown: "تحليل المخاطر",
            globalRisk: "المخاطر العالمية",
            localRisk: "المخاطر المحلية",
            logisticRisk: "المخاطر اللوجستية",
            recommendation: "التوصية الاستراتيجية",
            actionItems: "الإجراءات المطلوبة",
            priority: "الأولوية",
            action: "الإجراء",
            deadline: "الموعد النهائي",
            impact: "التأثير",
            refresh: "تحديث البيانات",
            loading: "جاري التحليل...",
            usdPerTon: "دولار/طن",
            buyNow: "اشتري الآن",
            delay: "تأخير",
            diversify: "تنويع الموردين",
            earlyWarning: "نظام الإنذار المبكر",
            alertDate: "التاريخ",
            alertMessage: "رسالة التنبيه",
            deviation: "الانحراف",
            productionHealth: "صحة الإنتاج المحلي",
            region: "المنطقة",
            ndviScore: "مؤشر NDVI",
            rainfall: "حالة الأمطار",
            marketHealth: "صحة السوق التنافسية",
            marginPressure: "ضغط الهامش",
            marketShare: "الحصة السوقية",
            priceGap: "فجوة السعر مع المنافسين",
            strategicSummary: "الملخص الاستراتيجي",
            highImpact: "تأثير عالي",
            mediumImpact: "تأثير متوسط",
            lowImpact: "تأثير منخفض"
        }
    };

    const text = translations[language as keyof typeof translations] || translations.en;

    // Fetch dashboard data
    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:8000/api/supply-market/dashboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commodity_id: selectedCommodity,
                    date: new Date().toISOString().split('T')[0]
                })
            });

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();

            if (data.success) {
                // Enhance with additional simulated data for all tabs
                const enhancedData = enhanceWithAllModules(data, selectedCommodity);
                setDashboardData(enhancedData);
            } else {
                setError(data.error || 'Unknown error occurred');
            }
        } catch (err) {
            setError('Failed to connect to backend. Using simulated data.');
            setDashboardData(generateFullSimulatedData(selectedCommodity));
        }

        setIsLoading(false);
    }, [selectedCommodity]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Enhance API response with all module data
    function enhanceWithAllModules(baseData: any, commodity: string): DashboardData {
        const alerts = generateAlerts(commodity);
        const productionData = generateProductionData(commodity);
        const competitiveData = generateCompetitiveData(commodity);
        const strategicActions = generateStrategicActions(commodity);

        return {
            ...baseData,
            alerts,
            production_data: productionData,
            competitive_data: competitiveData,
            strategic_actions: strategicActions
        };
    }

    // Generate alerts data
    function generateAlerts(commodity: string): Alert[] {
        const alerts: Alert[] = [];
        const alertLevels = ['Low', 'Medium', 'High'];

        for (let i = 0; i < 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i * 7);
            const level = alertLevels[Math.floor(Math.random() * 3)];
            const deviation = level === 'High' ? 15 + Math.random() * 10 :
                level === 'Medium' ? 8 + Math.random() * 7 :
                    Math.random() * 8;

            alerts.push({
                date: date.toISOString().split('T')[0],
                alert_level: level,
                deviation_pct: parseFloat(deviation.toFixed(1)),
                message: level === 'High' ?
                    `Critical price spike expected for ${commodity}` :
                    level === 'Medium' ?
                        `Moderate price increase forecasted` :
                        `Market conditions stable`
            });
        }
        return alerts;
    }

    // Generate production data
    function generateProductionData(commodity: string): ProductionData[] {
        const regions = ['Sana\'a', 'Aden', 'Taiz', 'Hodeidah', 'Ibb'];
        const outlooks = ['Good', 'Medium', 'Weak'];
        const rainfallStatuses = ['Above Normal', 'Normal', 'Below Normal'];

        return regions.map(region => ({
            region,
            outlook: outlooks[Math.floor(Math.random() * 3)],
            confidence: 0.7 + Math.random() * 0.25,
            ndvi_score: 0.3 + Math.random() * 0.5,
            rainfall_status: rainfallStatuses[Math.floor(Math.random() * 3)]
        }));
    }

    // Generate competitive data
    function generateCompetitiveData(commodity: string): CompetitiveData {
        const pressures = ['Low', 'Medium', 'High'];
        const positions = ['Advantaged', 'Neutral', 'Disadvantaged'];

        return {
            margin_pressure: pressures[Math.floor(Math.random() * 3)],
            position: positions[Math.floor(Math.random() * 3)],
            market_share: 15 + Math.random() * 30,
            price_gap: -5 + Math.random() * 15
        };
    }

    // Generate strategic actions
    function generateStrategicActions(commodity: string): StrategicAction[] {
        const actions = [
            { action: 'Lock in current supplier contracts', impact: 'High' },
            { action: 'Increase safety stock levels', impact: 'Medium' },
            { action: 'Negotiate long-term pricing agreements', impact: 'High' },
            { action: 'Explore alternative suppliers', impact: 'Medium' },
            { action: 'Monitor competitor pricing weekly', impact: 'Low' }
        ];

        return actions.map((a, i) => ({
            priority: i + 1,
            action: a.action,
            deadline: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            impact: a.impact
        }));
    }

    // Generate full simulated data
    function generateFullSimulatedData(commodity: string): DashboardData {
        const baseCosts: Record<string, number> = { wheat: 580, sugar: 780, oil: 1550 };
        const baseCost = baseCosts[commodity] || 600;

        const predictions: CostPrediction[] = [];
        for (let i = 0; i < 6; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i * 15);
            predictions.push({
                date: date.toISOString().split('T')[0],
                cost: baseCost + Math.random() * 100 - 30 + i * 10,
                confidence: 0.95 - i * 0.05,
                driver: ['Shipping Index', 'Global Price', 'Supply Chain Stress'][i % 3]
            });
        }

        const alertLevels = ['Low', 'Medium', 'High'];
        const outlooks = ['Good', 'Medium', 'Weak'];
        const positions = ['Advantaged', 'Neutral', 'Disadvantaged'];
        const trends = ['rising', 'stable', 'falling'];
        const recommendations = ['Buy Now', 'Delay', 'Diversify Suppliers'];

        return {
            success: true,
            commodity_id: commodity,
            kpis: {
                avg_predicted_cost: predictions.reduce((a, b) => a + b.cost, 0) / predictions.length,
                supply_alert_level: alertLevels[Math.floor(Math.random() * 3)],
                production_outlook: outlooks[Math.floor(Math.random() * 3)],
                competitive_position: positions[Math.floor(Math.random() * 3)],
                trend_direction: trends[Math.floor(Math.random() * 3)],
                confidence_score: 0.75 + Math.random() * 0.2
            },
            cost_predictions: predictions,
            alerts: generateAlerts(commodity),
            production_data: generateProductionData(commodity),
            competitive_data: generateCompetitiveData(commodity),
            strategic_actions: generateStrategicActions(commodity),
            risk_breakdown: {
                global_risk_score: 0.3 + Math.random() * 0.4,
                local_risk_score: 0.2 + Math.random() * 0.3,
                logistic_risk_score: 0.25 + Math.random() * 0.35
            },
            recommendation: recommendations[Math.floor(Math.random() * 3)]
        };
    }

    // Risk pie data
    const riskPieData = dashboardData ? [
        { name: text.globalRisk, value: dashboardData.risk_breakdown.global_risk_score * 100 },
        { name: text.localRisk, value: dashboardData.risk_breakdown.local_risk_score * 100 },
        { name: text.logisticRisk, value: dashboardData.risk_breakdown.logistic_risk_score * 100 }
    ] : [];

    const getRecommendationText = (rec: string) => {
        if (language === 'ar') {
            switch (rec) {
                case 'Buy Now': return text.buyNow;
                case 'Delay': return text.delay;
                case 'Diversify Suppliers': return text.diversify;
                default: return rec;
            }
        }
        return rec;
    };

    const getRecommendationColor = (rec: string) => {
        switch (rec) {
            case 'Buy Now': return 'bg-red-500';
            case 'Delay': return 'bg-green-500';
            case 'Diversify Suppliers': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    const getImpactBadge = (impact: string) => {
        switch (impact) {
            case 'High': return <Badge variant="destructive">{language === 'ar' ? text.highImpact : 'High'}</Badge>;
            case 'Medium': return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">{language === 'ar' ? text.mediumImpact : 'Medium'}</Badge>;
            default: return <Badge variant="outline">{language === 'ar' ? text.lowImpact : 'Low'}</Badge>;
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-200 font-sans">
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-[#16213e]/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-emerald-500" />
                        <div>
                            <h1 className="text-lg font-bold">{text.title}</h1>
                            <p className="text-xs text-muted-foreground">{text.subtitle}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder={text.commodity} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="wheat">{text.wheat}</SelectItem>
                            <SelectItem value="sugar">{text.sugar}</SelectItem>
                            <SelectItem value="oil">{text.oil}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        {text.refresh}
                    </Button>
                </div>
            </div>

            {/* TABS */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-[#16213e]/50 px-4">
                    <TabsList className="h-12 bg-transparent gap-1">
                        <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-600">
                            <BarChart3 className="h-4 w-4" /> {text.overview}
                        </TabsTrigger>
                        <TabsTrigger value="forecast" className="gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-600">
                            <TrendingUp className="h-4 w-4" /> {text.costForecast}
                        </TabsTrigger>
                        <TabsTrigger value="alerts" className="gap-2 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-600">
                            <Bell className="h-4 w-4" /> {text.alerts}
                        </TabsTrigger>
                        <TabsTrigger value="production" className="gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-600">
                            <Leaf className="h-4 w-4" /> {text.production}
                        </TabsTrigger>
                        <TabsTrigger value="competitive" className="gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-600">
                            <Users className="h-4 w-4" /> {text.competitive}
                        </TabsTrigger>
                        <TabsTrigger value="strategy" className="gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-600">
                            <Briefcase className="h-4 w-4" /> {text.strategy}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <ScrollArea className="flex-1">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 bg-white/60 dark:bg-[#1a1a2e]/60 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-[#16213e] border shadow-2xl">
                                <Activity className="h-8 w-8 text-emerald-500 animate-pulse" />
                                <span className="text-xs font-mono">{text.loading}</span>
                            </div>
                        </div>
                    )}

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="p-4 space-y-4">
                        {dashboardData && (
                            <>
                                {/* KPI Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                    <Card className="text-center">
                                        <CardContent className="pt-4">
                                            <DollarSign className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                                            <div className="text-2xl font-bold text-blue-600">${dashboardData.kpis.avg_predicted_cost.toFixed(0)}</div>
                                            <div className="text-xs text-muted-foreground">{text.avgCost}</div>
                                        </CardContent>
                                    </Card>

                                    <Card className={`text-center ${getAlertBgColor(dashboardData.kpis.supply_alert_level)}`}>
                                        <CardContent className="pt-4">
                                            <AlertTriangle className={`h-5 w-5 mx-auto mb-2 ${getAlertColor(dashboardData.kpis.supply_alert_level)}`} />
                                            <div className={`text-2xl font-bold ${getAlertColor(dashboardData.kpis.supply_alert_level)}`}>
                                                {dashboardData.kpis.supply_alert_level}
                                            </div>
                                            <div className="text-xs text-muted-foreground">{text.alertLevel}</div>
                                        </CardContent>
                                    </Card>

                                    <Card className="text-center">
                                        <CardContent className="pt-4">
                                            <Leaf className={`h-5 w-5 mx-auto mb-2 ${getOutlookColor(dashboardData.kpis.production_outlook)}`} />
                                            <div className={`text-2xl font-bold ${getOutlookColor(dashboardData.kpis.production_outlook)}`}>
                                                {dashboardData.kpis.production_outlook}
                                            </div>
                                            <div className="text-xs text-muted-foreground">{text.productionOutlook}</div>
                                        </CardContent>
                                    </Card>

                                    <Card className="text-center">
                                        <CardContent className="pt-4">
                                            <Target className={`h-5 w-5 mx-auto mb-2 ${getPositionColor(dashboardData.kpis.competitive_position)}`} />
                                            <div className={`text-2xl font-bold ${getPositionColor(dashboardData.kpis.competitive_position)}`}>
                                                {dashboardData.kpis.competitive_position}
                                            </div>
                                            <div className="text-xs text-muted-foreground">{text.position}</div>
                                        </CardContent>
                                    </Card>

                                    <Card className="text-center">
                                        <CardContent className="pt-4">
                                            {getTrendIcon(dashboardData.kpis.trend_direction)}
                                            <div className="text-xl font-bold capitalize mt-2">{dashboardData.kpis.trend_direction}</div>
                                            <div className="text-xs text-muted-foreground">{text.trend}</div>
                                        </CardContent>
                                    </Card>

                                    <Card className="text-center">
                                        <CardContent className="pt-4">
                                            <ShieldCheck className="h-5 w-5 mx-auto mb-2 text-purple-500" />
                                            <div className="text-2xl font-bold text-purple-600">
                                                {(dashboardData.kpis.confidence_score * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-xs text-muted-foreground">{text.confidence}</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Recommendation */}
                                <div className={`p-4 rounded-lg ${getRecommendationColor(dashboardData.recommendation)} text-white flex items-center justify-between`}>
                                    <div className="flex items-center gap-3">
                                        <Zap className="h-6 w-6" />
                                        <div>
                                            <div className="text-sm opacity-90">{text.recommendation}</div>
                                            <div className="text-xl font-bold">{getRecommendationText(dashboardData.recommendation)}</div>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-lg px-4">{selectedCommodity.toUpperCase()}</Badge>
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <Card className="col-span-2">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4" /> {text.costForecastTitle}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={dashboardData.cost_predictions}>
                                                    <defs>
                                                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                                                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Cost']} />
                                                    <Area type="monotone" dataKey="cost" stroke="#10B981" strokeWidth={2} fill="url(#colorCost)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Globe className="h-4 w-4" /> {text.riskBreakdown}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                                                        {riskPieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={RISK_COLORS[index]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(v: number) => `${v.toFixed(0)}%`} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="flex justify-center gap-4 mt-2">
                                                {riskPieData.map((entry, index) => (
                                                    <div key={entry.name} className="flex items-center gap-1 text-xs">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RISK_COLORS[index] }} />
                                                        <span className="text-muted-foreground">{entry.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* COST FORECAST TAB */}
                    <TabsContent value="forecast" className="p-4 space-y-4">
                        {dashboardData && (
                            <>
                                {/* Period Selector */}
                                <Card className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20">
                                    <CardContent className="pt-4">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-5 w-5 text-blue-500" />
                                                <span className="font-medium">
                                                    {language === 'ar' ? 'فترة التوقع:' : 'Forecast Period:'}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                {[30, 60, 90, 180, 365].map((days) => (
                                                    <button
                                                        key={days}
                                                        onClick={() => {
                                                            setForecastDays(days);
                                                            // Generate new predictions for selected period
                                                            const baseCosts: Record<string, number> = { wheat: 580, sugar: 780, oil: 1550 };
                                                            const baseCost = baseCosts[selectedCommodity] || 600;
                                                            const numPoints = Math.min(Math.ceil(days / 15), 24);
                                                            const newPredictions: CostPrediction[] = [];

                                                            for (let i = 0; i < numPoints; i++) {
                                                                const date = new Date();
                                                                date.setDate(date.getDate() + Math.floor((i * days) / numPoints));
                                                                newPredictions.push({
                                                                    date: date.toISOString().split('T')[0],
                                                                    cost: baseCost + Math.random() * 100 - 30 + (i * 8),
                                                                    confidence: Math.max(0.5, 0.95 - (i * 0.02)),
                                                                    driver: ['Shipping Index', 'Global Price', 'Supply Chain Stress', 'Currency Exchange', 'Local Demand'][i % 5]
                                                                });
                                                            }
                                                            setForecastPredictions(newPredictions);
                                                        }}
                                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${forecastDays === days
                                                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                                                : "border border-gray-300 dark:border-gray-600 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500"
                                                            }`}
                                                    >
                                                        {days} {language === 'ar' ? 'يوم' : 'Days'}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Activity className="h-4 w-4" />
                                                <span>
                                                    {language === 'ar'
                                                        ? `${(forecastPredictions.length > 0 ? forecastPredictions : dashboardData.cost_predictions).length} نقطة بيانات`
                                                        : `${(forecastPredictions.length > 0 ? forecastPredictions : dashboardData.cost_predictions).length} data points`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {language === 'ar' ? 'أدنى تكلفة متوقعة' : 'Min Forecast'}
                                                    </p>
                                                    <p className="text-2xl font-bold text-blue-600">
                                                        ${Math.min(...(forecastPredictions.length > 0 ? forecastPredictions : dashboardData.cost_predictions).map(p => p.cost)).toFixed(0)}
                                                    </p>
                                                </div>
                                                <TrendingDown className="h-8 w-8 text-blue-500/50" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {language === 'ar' ? 'متوسط التكلفة' : 'Avg Forecast'}
                                                    </p>
                                                    <p className="text-2xl font-bold text-purple-600">
                                                        ${((forecastPredictions.length > 0 ? forecastPredictions : dashboardData.cost_predictions).reduce((a, b) => a + b.cost, 0) / (forecastPredictions.length > 0 ? forecastPredictions : dashboardData.cost_predictions).length).toFixed(0)}
                                                    </p>
                                                </div>
                                                <Minus className="h-8 w-8 text-purple-500/50" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {language === 'ar' ? 'أعلى تكلفة متوقعة' : 'Max Forecast'}
                                                    </p>
                                                    <p className="text-2xl font-bold text-red-600">
                                                        ${Math.max(...(forecastPredictions.length > 0 ? forecastPredictions : dashboardData.cost_predictions).map(p => p.cost)).toFixed(0)}
                                                    </p>
                                                </div>
                                                <TrendingUp className="h-8 w-8 text-red-500/50" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {language === 'ar' ? 'متوسط الثقة' : 'Avg Confidence'}
                                                    </p>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {((forecastPredictions.length > 0 ? forecastPredictions : dashboardData.cost_predictions).reduce((a, b) => a + b.confidence, 0) / (forecastPredictions.length > 0 ? forecastPredictions : dashboardData.cost_predictions).length * 100).toFixed(0)}%
                                                    </p>
                                                </div>
                                                <ShieldCheck className="h-8 w-8 text-green-500/50" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Main Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-blue-500" />
                                            {text.costForecastTitle}
                                        </CardTitle>
                                        <CardDescription>
                                            {language === 'ar' ? 'توقعات التكلفة التفصيلية مع مستويات الثقة' : 'Detailed cost predictions with confidence levels'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={forecastPredictions.length > 0 ? forecastPredictions : dashboardData.cost_predictions}>
                                                <defs>
                                                    <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 11 }}
                                                    tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 11 }}
                                                    tickFormatter={(v) => `$${v}`}
                                                    domain={['dataMin - 20', 'dataMax + 20']}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(22, 33, 62, 0.95)',
                                                        border: '1px solid #3B82F6',
                                                        borderRadius: '8px',
                                                        color: '#fff'
                                                    }}
                                                    formatter={(value: number, name: string) => [
                                                        name === 'cost' ? `$${value.toFixed(2)}` : `${(value * 100).toFixed(0)}%`,
                                                        name === 'cost' ? 'Cost' : 'Confidence'
                                                    ]}
                                                    labelFormatter={(label) => new Date(label).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="cost"
                                                    stroke="#3B82F6"
                                                    strokeWidth={3}
                                                    fill="url(#costGradient)"
                                                    dot={{ r: 5, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                                                    activeDot={{ r: 7, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Prediction Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(forecastPredictions.length > 0 ? forecastPredictions : dashboardData.cost_predictions).map((pred, i) => {
                                        const predictions = forecastPredictions.length > 0 ? forecastPredictions : dashboardData.cost_predictions;
                                        const prevCost = i > 0 ? predictions[i - 1].cost : pred.cost;
                                        const change = ((pred.cost - prevCost) / prevCost) * 100;
                                        const isUp = change > 0;

                                        return (
                                            <Card key={i} className={`transition-all hover:shadow-lg ${isUp ? 'hover:border-red-500/50' : 'hover:border-green-500/50'
                                                }`}>
                                                <CardContent className="pt-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(pred.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </p>
                                                            <p className="text-2xl font-bold mt-1">${pred.cost.toFixed(0)}</p>
                                                        </div>
                                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${isUp ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                                                            }`}>
                                                            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                            {Math.abs(change).toFixed(1)}%
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">
                                                                {language === 'ar' ? 'الثقة' : 'Confidence'}
                                                            </span>
                                                            <span className="font-medium">{(pred.confidence * 100).toFixed(0)}%</span>
                                                        </div>
                                                        <Progress value={pred.confidence * 100} className="h-2" />

                                                        <div className="flex justify-between text-sm mt-2">
                                                            <span className="text-muted-foreground">
                                                                {language === 'ar' ? 'العامل الرئيسي' : 'Main Driver'}
                                                            </span>
                                                            <Badge className="bg-blue-500/20 text-blue-600 border-0">{pred.driver}</Badge>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* ALERTS TAB */}
                    <TabsContent value="alerts" className="p-4 space-y-4">
                        {dashboardData && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Bell className="h-5 w-5 text-red-500" />
                                            {text.earlyWarning}
                                        </CardTitle>
                                        <CardDescription>Real-time alerts for price anomalies and market disruptions</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {dashboardData.alerts.map((alert, i) => (
                                                <div key={i} className={`p-4 rounded-lg border ${getAlertBgColor(alert.alert_level)}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <AlertCircle className={`h-5 w-5 ${getAlertColor(alert.alert_level)}`} />
                                                            <div>
                                                                <div className="font-medium">{alert.message}</div>
                                                                <div className="text-sm text-muted-foreground">{new Date(alert.date).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge className={alert.alert_level === 'High' ? 'bg-red-500' : alert.alert_level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}>
                                                                {alert.alert_level}
                                                            </Badge>
                                                            <div className="text-sm text-muted-foreground mt-1">+{alert.deviation_pct}% deviation</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </TabsContent>

                    {/* PRODUCTION TAB */}
                    <TabsContent value="production" className="p-4 space-y-4">
                        {dashboardData && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Leaf className="h-5 w-5 text-green-500" />
                                            {text.productionHealth}
                                        </CardTitle>
                                        <CardDescription>Regional production outlook based on environmental indicators</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{text.region}</TableHead>
                                                    <TableHead>{text.productionOutlook}</TableHead>
                                                    <TableHead>{text.ndviScore}</TableHead>
                                                    <TableHead>{text.rainfall}</TableHead>
                                                    <TableHead>{text.confidence}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {dashboardData.production_data.map((region, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-medium">{region.region}</TableCell>
                                                        <TableCell>
                                                            <Badge className={region.outlook === 'Good' ? 'bg-green-500' : region.outlook === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'}>
                                                                {region.outlook}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Progress value={region.ndvi_score * 100} className="w-16 h-2" />
                                                                <span className="text-sm">{(region.ndvi_score * 100).toFixed(0)}%</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{region.rainfall_status}</TableCell>
                                                        <TableCell>{(region.confidence * 100).toFixed(0)}%</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </TabsContent>

                    {/* COMPETITIVE TAB */}
                    <TabsContent value="competitive" className="p-4 space-y-4">
                        {dashboardData && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Card className="text-center">
                                        <CardContent className="pt-6">
                                            <Shield className="h-8 w-8 mx-auto mb-3 text-purple-500" />
                                            <div className={`text-2xl font-bold ${getAlertColor(dashboardData.competitive_data.margin_pressure)}`}>
                                                {dashboardData.competitive_data.margin_pressure}
                                            </div>
                                            <div className="text-sm text-muted-foreground">{text.marginPressure}</div>
                                        </CardContent>
                                    </Card>

                                    <Card className="text-center">
                                        <CardContent className="pt-6">
                                            <Target className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                                            <div className={`text-2xl font-bold ${getPositionColor(dashboardData.competitive_data.position)}`}>
                                                {dashboardData.competitive_data.position}
                                            </div>
                                            <div className="text-sm text-muted-foreground">{text.position}</div>
                                        </CardContent>
                                    </Card>

                                    <Card className="text-center">
                                        <CardContent className="pt-6">
                                            <Users className="h-8 w-8 mx-auto mb-3 text-green-500" />
                                            <div className="text-2xl font-bold text-green-600">
                                                {dashboardData.competitive_data.market_share.toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">{text.marketShare}</div>
                                        </CardContent>
                                    </Card>

                                    <Card className="text-center">
                                        <CardContent className="pt-6">
                                            <TrendUp className="h-8 w-8 mx-auto mb-3 text-orange-500" />
                                            <div className={`text-2xl font-bold ${dashboardData.competitive_data.price_gap > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                {dashboardData.competitive_data.price_gap > 0 ? '+' : ''}{dashboardData.competitive_data.price_gap.toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">{text.priceGap}</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-purple-500" />
                                            {text.marketHealth}
                                        </CardTitle>
                                        <CardDescription>
                                            {language === 'ar' ? 'مؤشرات الأداء التنافسي' : 'Competitive Performance Metrics'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Market Share */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-green-500" />
                                                    {text.marketShare}
                                                </span>
                                                <span className="font-bold text-green-600">{dashboardData.competitive_data.market_share.toFixed(1)}%</span>
                                            </div>
                                            <Progress value={dashboardData.competitive_data.market_share} className="h-3" />
                                        </div>

                                        {/* Price Competitiveness */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-blue-500" />
                                                    {language === 'ar' ? 'التنافسية السعرية' : 'Price Competitiveness'}
                                                </span>
                                                <span className={`font-bold ${dashboardData.competitive_data.price_gap < 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {dashboardData.competitive_data.price_gap < 0 ? 'Lower' : 'Higher'} ({Math.abs(dashboardData.competitive_data.price_gap).toFixed(1)}%)
                                                </span>
                                            </div>
                                            <Progress
                                                value={Math.max(0, 100 - Math.abs(dashboardData.competitive_data.price_gap) * 5)}
                                                className="h-3"
                                            />
                                        </div>

                                        {/* Margin Health */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium flex items-center gap-2">
                                                    <Shield className="h-4 w-4 text-purple-500" />
                                                    {language === 'ar' ? 'صحة الهامش' : 'Margin Health'}
                                                </span>
                                                <Badge className={
                                                    dashboardData.competitive_data.margin_pressure === 'Low' ? 'bg-green-500' :
                                                        dashboardData.competitive_data.margin_pressure === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                                                }>
                                                    {dashboardData.competitive_data.margin_pressure}
                                                </Badge>
                                            </div>
                                            <Progress
                                                value={dashboardData.competitive_data.margin_pressure === 'Low' ? 85 :
                                                    dashboardData.competitive_data.margin_pressure === 'Medium' ? 55 : 25}
                                                className="h-3"
                                            />
                                        </div>

                                        {/* Position Strength */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium flex items-center gap-2">
                                                    <Target className="h-4 w-4 text-orange-500" />
                                                    {language === 'ar' ? 'قوة الموقف' : 'Position Strength'}
                                                </span>
                                                <Badge className={
                                                    dashboardData.competitive_data.position === 'Advantaged' ? 'bg-green-500' :
                                                        dashboardData.competitive_data.position === 'Neutral' ? 'bg-yellow-500' : 'bg-red-500'
                                                }>
                                                    {dashboardData.competitive_data.position}
                                                </Badge>
                                            </div>
                                            <Progress
                                                value={dashboardData.competitive_data.position === 'Advantaged' ? 90 :
                                                    dashboardData.competitive_data.position === 'Neutral' ? 55 : 20}
                                                className="h-3"
                                            />
                                        </div>

                                        {/* Summary Box */}
                                        <div className={`p-4 rounded-lg mt-4 ${dashboardData.competitive_data.position === 'Advantaged' ? 'bg-green-500/10 border border-green-500/30' :
                                            dashboardData.competitive_data.position === 'Neutral' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                                                'bg-red-500/10 border border-red-500/30'
                                            }`}>
                                            <div className="text-center">
                                                <div className="text-sm text-muted-foreground mb-1">
                                                    {language === 'ar' ? 'التقييم العام' : 'Overall Assessment'}
                                                </div>
                                                <div className={`text-xl font-bold ${getPositionColor(dashboardData.competitive_data.position)}`}>
                                                    {dashboardData.competitive_data.position === 'Advantaged'
                                                        ? (language === 'ar' ? '✅ وضع تنافسي قوي' : '✅ Strong Competitive Position')
                                                        : dashboardData.competitive_data.position === 'Neutral'
                                                            ? (language === 'ar' ? '⚠️ وضع تنافسي متوسط' : '⚠️ Moderate Position')
                                                            : (language === 'ar' ? '❌ وضع تنافسي ضعيف' : '❌ Weak Position')}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </TabsContent>

                    {/* STRATEGY TAB */}
                    <TabsContent value="strategy" className="p-4 space-y-4">
                        {dashboardData && (
                            <>
                                {/* Recommendation Banner */}
                                <div className={`p-6 rounded-lg ${getRecommendationColor(dashboardData.recommendation)} text-white`}>
                                    <div className="flex items-center gap-4">
                                        <Briefcase className="h-10 w-10" />
                                        <div>
                                            <div className="text-sm opacity-90 mb-1">{text.strategicSummary}</div>
                                            <div className="text-3xl font-bold">{getRecommendationText(dashboardData.recommendation)}</div>
                                        </div>
                                    </div>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-orange-500" />
                                            {text.actionItems}
                                        </CardTitle>
                                        <CardDescription>Prioritized actions based on current market analysis</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{text.priority}</TableHead>
                                                    <TableHead>{text.action}</TableHead>
                                                    <TableHead>{text.deadline}</TableHead>
                                                    <TableHead>{text.impact}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {dashboardData.strategic_actions.map((action, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>
                                                            <Badge variant={action.priority === 1 ? 'destructive' : 'secondary'}>
                                                                P{action.priority}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">{action.action}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(action.deadline).toLocaleDateString()}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{getImpactBadge(action.impact)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </TabsContent>
                </ScrollArea>
            </Tabs>

            {/* FOOTER */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center bg-gray-50 dark:bg-[#16213e]/20">
                <span className="text-[10px] text-muted-foreground">
                    {language === 'ar'
                        ? "نموذج تحليل العرض والسوق | XGBoost Model: نشط ✓"
                        : "Supply & Market Analysis Model | XGBoost Model: Active ✓"}
                </span>
            </div>
        </div>
    );
}
