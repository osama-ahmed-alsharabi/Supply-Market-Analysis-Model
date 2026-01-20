'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, DollarSign, Shield, TrendingUp, RefreshCw, Loader2 } from 'lucide-react';
import { DashboardContext } from '@/components/dashboard-client-extended';
import {
    PieChart,
    Pie,
    Cell,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface FoodSecurityDashboardProps {
    onClose: () => void;
}

interface KPIs {
    total_demand: number;
    avg_fx: number;
    risk_score: number;
}

interface TableRow {
    product: string;
    price: number;
    demand: number;
    risk: string;
    details: string;
}

interface ChartsData {
    distribution: number[];
    labels: string[];
    scatter: { x: number; y: number; product: string }[];
}

interface DashboardResponse {
    kpis: KPIs;
    charts: ChartsData;
    table: TableRow[];
}

const COLORS = ['#4e54c8', '#e94560', '#0f3460', '#533483', '#16213e'];

export function FoodSecurityDashboard({ onClose }: FoodSecurityDashboardProps) {
    const { t } = React.useContext(DashboardContext);

    const [fxMultiplier, setFxMultiplier] = React.useState(1.0);
    const [isRamadan, setIsRamadan] = React.useState(false);
    const [fuelCrisis, setFuelCrisis] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [data, setData] = React.useState<DashboardResponse | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const runSimulation = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:8000/api/food-security/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fx_multiplier: fxMultiplier,
                    is_ramadan: isRamadan,
                    fuel_crisis: fuelCrisis,
                    governorate: 'Sanaa'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to run simulation');
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            console.error('Simulation error:', err);
            setError(err instanceof Error ? err.message : 'فشل تشغيل المحاكاة');
        } finally {
            setIsLoading(false);
        }
    }, [fxMultiplier, isRamadan, fuelCrisis]);

    // Run simulation on mount
    React.useEffect(() => {
        runSimulation();
    }, []);

    const getRiskStatus = (score: number) => {
        if (score < 50) return { text: 'خطر مرتفع', color: 'text-red-500', bg: 'bg-red-900/50' };
        if (score < 80) return { text: 'حذر', color: 'text-yellow-500', bg: 'bg-yellow-900/50' };
        return { text: 'مستقر', color: 'text-green-400', bg: 'bg-green-900/50' };
    };

    // Prepare pie chart data
    const pieData = data ? data.charts.labels.map((label, idx) => ({
        name: label,
        value: data.charts.distribution[idx]
    })) : [];

    // Prepare scatter chart data
    const scatterData = data ? data.charts.scatter.map(p => ({
        x: p.x,
        y: p.y,
        name: p.product
    })) : [];

    const riskStatus = data ? getRiskStatus(data.kpis.risk_score) : null;

    return (
        <div className="h-full overflow-y-auto bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-200" dir="rtl">
            {/* Header */}
            <header className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-transparent">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">نظام التنبؤ بالأزمات الغذائية</h1>
                        <p className="text-gray-600 dark:text-gray-400">محافظة صنعاء - الجمهورية اليمنية</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-sm font-semibold">النظام نشط</span>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white dark:bg-[#16213e] border-gray-200 dark:border-[#1f4068] text-gray-900 dark:text-gray-200">
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الطلب المتوقع (يومي)</p>
                                <h2 className="text-2xl font-bold mt-1">
                                    {isLoading ? '...' : data ? `${data.kpis.total_demand.toLocaleString()} كجم` : 'جاري الحساب...'}
                                </h2>
                            </div>
                            <div className="bg-blue-900/50 p-3 rounded-lg">
                                <Package className="h-6 w-6 text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-[#16213e] border-gray-200 dark:border-[#1f4068] text-gray-900 dark:text-gray-200">
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">سعر الصرف (ريال/دولار)</p>
                                <h2 className="text-2xl font-bold mt-1 text-yellow-500">
                                    {isLoading ? '...' : data ? data.kpis.avg_fx.toLocaleString() : '550'}
                                </h2>
                            </div>
                            <div className="bg-yellow-900/50 p-3 rounded-lg">
                                <DollarSign className="h-6 w-6 text-yellow-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-[#16213e] border-gray-200 dark:border-[#1f4068] text-gray-900 dark:text-gray-200">
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">مستوى المخاطر</p>
                                <h2 className={`text-2xl font-bold mt-1 ${riskStatus?.color || 'text-green-400'}`}>
                                    {isLoading ? '...' : riskStatus?.text || 'مستقر'}
                                </h2>
                            </div>
                            <div className={`${riskStatus?.bg || 'bg-green-900/50'} p-3 rounded-lg`}>
                                <Shield className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-[#16213e] border-gray-200 dark:border-[#1f4068] text-gray-900 dark:text-gray-200">
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">دقة النموذج</p>
                                <h2 className="text-2xl font-bold mt-1 text-purple-400">90.4%</h2>
                            </div>
                            <div className="bg-purple-900/50 p-3 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-purple-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Simulation Control */}
                    <Card className="bg-white dark:bg-[#16213e] border-gray-200 dark:border-[#1f4068] text-gray-900 dark:text-gray-200">
                        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                            <CardTitle className="text-xl">محاكي السيناريوهات</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div>
                                <Label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">تغير سعر الصرف (FX Multiplier)</Label>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs">0.5x</span>
                                    <Slider
                                        value={[fxMultiplier]}
                                        onValueChange={(v) => setFxMultiplier(v[0])}
                                        min={0.5}
                                        max={3.0}
                                        step={0.1}
                                        className="flex-1"
                                    />
                                    <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded min-w-[40px] text-center">
                                        {fxMultiplier.toFixed(1)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="fuel-crisis"
                                        checked={fuelCrisis}
                                        onCheckedChange={(checked) => setFuelCrisis(checked === true)}
                                    />
                                    <Label htmlFor="fuel-crisis" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                                        أزمة وقود (تأثير على الأسعار والنقل)
                                    </Label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="ramadan"
                                        checked={isRamadan}
                                        onCheckedChange={(checked) => setIsRamadan(checked === true)}
                                    />
                                    <Label htmlFor="ramadan" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                                        موسم رمضان (زيادة الطلب)
                                    </Label>
                                </div>
                            </div>

                            <Button
                                onClick={runSimulation}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-[#4e54c8] to-[#8f94fb] hover:opacity-90 text-white py-3 font-bold"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                        جاري المعالجة...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="ml-2 h-4 w-4" />
                                        تشغيل المحاكاة
                                    </>
                                )}
                            </Button>

                            {error && (
                                <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded text-xs text-gray-600 dark:text-gray-400">
                                <p>ملاحظة: النتائج تعتمد على نموذج LightGBM المدرب على بيانات 2021-2023.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Charts Area */}
                    <Card className="bg-white dark:bg-[#16213e] border-gray-200 dark:border-[#1f4068] text-gray-900 dark:text-gray-200 lg:col-span-2">
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-2">
                                <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">توزيع الطلب حسب المنتج</h4>
                                <div className="h-64 flex items-center justify-center">
                                    {pieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #1f4068' }}
                                                    labelStyle={{ color: '#fff' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-gray-500">جاري التحميل...</div>
                                    )}
                                </div>
                            </div>
                            <div className="p-2">
                                <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">العلاقة بين السعر والطلب</h4>
                                <div className="h-64 flex items-center justify-center">
                                    {scatterData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                                <XAxis
                                                    type="number"
                                                    dataKey="x"
                                                    name="السعر"
                                                    stroke="#888"
                                                    tick={{ fill: '#888' }}
                                                />
                                                <YAxis
                                                    type="number"
                                                    dataKey="y"
                                                    name="الطلب"
                                                    stroke="#888"
                                                    tick={{ fill: '#888' }}
                                                />
                                                <Tooltip
                                                    cursor={{ strokeDasharray: '3 3' }}
                                                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #1f4068' }}
                                                />
                                                <Scatter name="المنتجات" data={scatterData} fill="#e94560" />
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-gray-500">جاري التحميل...</div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Product Table */}
                <Card className="bg-white dark:bg-[#16213e] border-gray-200 dark:border-[#1f4068] text-gray-900 dark:text-gray-200">
                    <CardHeader>
                        <CardTitle className="text-xl">تفاصيل المنتجات (Live Forecast)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                        <th className="py-3 px-4">المنتج</th>
                                        <th className="py-3 px-4 text-center">السعر المتوقع (ريال)</th>
                                        <th className="py-3 px-4 text-center">الطلب المتوقع (كجم/لتر)</th>
                                        <th className="py-3 px-4 text-center">مستوى الخطر</th>
                                        <th className="py-3 px-4 text-left">التفاصيل</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {data?.table.map((row, idx) => (
                                        <tr key={idx} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition">
                                            <td className="py-3 px-4 font-semibold">{row.product}</td>
                                            <td className="py-3 px-4 text-center text-yellow-400">
                                                {row.price.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-center text-blue-400">
                                                {row.demand.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={row.risk === 'High'
                                                        ? 'bg-red-900/50 text-red-400 border-red-500/50'
                                                        : 'bg-green-900/50 text-green-400 border-green-500/50'
                                                    }
                                                >
                                                    {row.risk === 'High' ? 'مرتفع' : 'طبيعي'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-left text-gray-500 text-xs">
                                                {row.details}
                                            </td>
                                        </tr>
                                    ))}
                                    {!data && !isLoading && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-500">
                                                لا توجد بيانات. قم بتشغيل المحاكاة.
                                            </td>
                                        </tr>
                                    )}
                                    {isLoading && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-500">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
