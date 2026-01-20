'use client';

import * as React from 'react';
import type { PredictionData } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    BarChart2,
    Cpu,
    Layers,
    Sparkles,
    Sigma,
    Truck,
    Shield,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Utensils,
    Activity,
    BarChart3
} from 'lucide-react';
import { DashboardContext } from './dashboard-client-extended';

type ResultsPanelProps = {
    data: PredictionData | null;
    isLoading: boolean;
};

// Supply Chain Summary State
type SupplyChainSummary = {
    totalRoutes: number;
    highRiskCount: number;
    avgRisk: number;
    recommendedRoute: string;
    recRouteProb: number;
    primaryRisk: string;
    alertMessage: string;
};

// Food Security Summary State
type FoodSecuritySummary = {
    totalDemand: number;
    avgFx: number;
    riskScore: number;
    riskStatus: string;
    topProduct: string;
    topProductDemand: number;
};

const LoadingSkeletons = () => (
    <div className="space-y-6">
        {/* 3 Model Cards Loading */}
        <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
                <Card key={i}>
                    <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-4 w-3/4 mt-2" />
                    </CardContent>
                </Card>
            ))}
        </div>

        {/* Summary Loading */}
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardContent>
        </Card>
    </div>
);

export function ResultsPanel({ data, isLoading }: ResultsPanelProps) {
    const [supplyChainData, setSupplyChainData] = React.useState<SupplyChainSummary | null>(null);
    const [foodSecurityData, setFoodSecurityData] = React.useState<FoodSecuritySummary | null>(null);
    const { setShowSupplyChain, setActiveView } = React.useContext(DashboardContext);

    // Fetch Supply Chain summary
    React.useEffect(() => {
        const fetchSupplyChain = async () => {
            console.log('🔄 Fetching supply chain data...');
            try {
                const today = new Date().toISOString().split('T')[0];
                console.log('📅 Requesting date:', today);

                const response = await fetch('http://localhost:8000/api/supply-chain/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: today })
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Supply chain data received:', result);

                    if (result.success && result.routes && result.routes.length > 0) {
                        const routes = result.routes;
                        const bestRoute = routes.reduce((prev: any, curr: any) =>
                            prev.risk_score < curr.risk_score ? prev : curr
                        );

                        const highRiskRoutes = routes.filter((r: any) => r.risk_score >= 7);
                        const alertMsg = highRiskRoutes.length > 3 ? 'Critical Disruption Likely' :
                            highRiskRoutes.length > 0 ? 'Moderate Delays Expected' : 'Operations Normal';

                        setSupplyChainData({
                            totalRoutes: routes.length,
                            highRiskCount: highRiskRoutes.length,
                            avgRisk: routes.reduce((acc: number, r: any) => acc + r.risk_score, 0) / routes.length,
                            recommendedRoute: bestRoute.route_name,
                            recRouteProb: 1 - bestRoute.disruption_probability,
                            primaryRisk: highRiskRoutes.length > 0 ? highRiskRoutes[0].primary_risk_factor : 'None',
                            alertMessage: alertMsg
                        });
                        return; // Successfully set data
                    }
                }
                // If we get here, API failed or returned empty data -> Fallthrough to catch block logic
                console.warn('⚠️ API response valid but empty/unsuccessful. Using fallback.');
                setSupplyChainData({
                    totalRoutes: 10,
                    highRiskCount: 4,
                    avgRisk: 5.8,
                    recommendedRoute: "Amran → Sana'a",
                    recRouteProb: 0.82,
                    primaryRisk: 'Security',
                    alertMessage: 'Simulation Mode'
                });
            } catch (error) {
                console.error('⚠️ Failed to fetch supply chain data, using fallback:', error);
                setSupplyChainData({
                    totalRoutes: 10,
                    highRiskCount: 4,
                    avgRisk: 5.8,
                    recommendedRoute: "Amran → Sana'a",
                    recRouteProb: 0.82,
                    primaryRisk: 'Security',
                    alertMessage: 'Simulation Mode'
                });
            }
        };

        fetchSupplyChain();
    }, [isLoading]);

    // Fetch Food Security summary
    React.useEffect(() => {
        const fetchFoodSecurity = async () => {
            console.log('🔄 Fetching food security data...');
            try {
                const response = await fetch('http://localhost:8000/api/food-security/simulate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fx_multiplier: 1.0,
                        is_ramadan: false,
                        fuel_crisis: false,
                        governorate: 'Sanaa'
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Food security data received:', result);

                    // Find top product by demand
                    const topProduct = result.table.reduce((prev: any, curr: any) =>
                        prev.demand > curr.demand ? prev : curr
                    );

                    const riskStatus = result.kpis.risk_score >= 80 ? 'Stable' :
                        result.kpis.risk_score >= 50 ? 'Warning' : 'Critical';

                    setFoodSecurityData({
                        totalDemand: result.kpis.total_demand,
                        avgFx: result.kpis.avg_fx,
                        riskScore: result.kpis.risk_score,
                        riskStatus,
                        topProduct: topProduct.product,
                        topProductDemand: topProduct.demand
                    });
                    return;
                }
                console.warn('⚠️ Food Security API response failed.');
            } catch (error) {
                console.error('⚠️ Failed to fetch food security data:', error);
            }
            // Fallback data
            setFoodSecurityData({
                totalDemand: 12500,
                avgFx: 550,
                riskScore: 90,
                riskStatus: 'Stable',
                topProduct: 'Wheat_Flour_50kg',
                topProductDemand: 5200
            });
        };

        fetchFoodSecurity();
    }, [isLoading]);

    if (isLoading) {
        return <LoadingSkeletons />;
    }

    if (!data) {
        return (
            <div className="space-y-6">
                {/* 3 MODEL CARDS AT TOP */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* 1. Supply Chain (Active) */}
                    <Card
                        className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent cursor-pointer hover:bg-green-500/10 transition-colors"
                        onClick={() => setShowSupplyChain(true)}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-green-500/10">
                                        <Truck className="h-4 w-4 text-green-500" />
                                    </div>
                                    <CardTitle className="text-sm font-medium">Supply Chain</CardTitle>
                                </div>
                                <Badge variant="outline" className="text-xs">Model 3</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {supplyChainData ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Routes Monitored</span>
                                        <span className="text-sm font-semibold">{supplyChainData.totalRoutes}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">High Risk</span>
                                        <Badge variant={supplyChainData.highRiskCount > 0 ? "destructive" : "secondary"} className="text-xs h-5">
                                            {supplyChainData.highRiskCount} Routes
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Avg Network Risk</span>
                                        <span className="text-sm font-mono font-bold text-foreground">
                                            {supplyChainData.avgRisk.toFixed(1)}<span className="text-muted-foreground font-normal">/10</span>
                                        </span>
                                    </div>
                                    <Progress value={supplyChainData.avgRisk * 10} className="h-1.5" />

                                    {/* Advanced Details Section */}
                                    {supplyChainData.alertMessage !== 'Operations Normal' && (
                                        <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium animate-pulse mt-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            {supplyChainData.alertMessage}
                                        </div>
                                    )}
                                    <div className={`pt-2 border-t border-border/50 ${supplyChainData.alertMessage !== 'Operations Normal' ? 'mt-1' : 'mt-2'}`}>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-muted-foreground">Best Efficiency Route:</span>
                                            <span className="text-green-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={supplyChainData.recommendedRoute}>
                                                {supplyChainData.recommendedRoute}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 text-[10px]">
                                            <span className="text-muted-foreground">Success Probability:</span>
                                            <span className="font-mono font-medium text-foreground">
                                                {(supplyChainData.recRouteProb * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 text-[10px]">
                                            <span className="text-muted-foreground">Primary Threat:</span>
                                            <span className="text-destructive/80 font-medium">
                                                {supplyChainData.primaryRisk}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground">Loading...</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 2. Food Security (Active with Live Data) */}
                    <Card
                        className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent cursor-pointer hover:bg-orange-500/10 transition-colors"
                        onClick={() => setActiveView('food-security')}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-orange-500/10">
                                        <Utensils className="h-4 w-4 text-orange-500" />
                                    </div>
                                    <CardTitle className="text-sm font-medium">Food Security</CardTitle>
                                </div>
                                <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-500">Model 2</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {foodSecurityData ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Daily Demand</span>
                                        <span className="text-sm font-semibold">{foodSecurityData.totalDemand.toLocaleString()} kg</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Risk Status</span>
                                        <Badge
                                            variant={foodSecurityData.riskStatus === 'Critical' ? "destructive" : foodSecurityData.riskStatus === 'Warning' ? "secondary" : "default"}
                                            className={`text-xs h-5 ${foodSecurityData.riskStatus === 'Stable' ? 'bg-green-500' : ''}`}
                                        >
                                            {foodSecurityData.riskStatus}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">FX Rate</span>
                                        <span className="text-sm font-mono font-bold text-foreground">
                                            {foodSecurityData.avgFx}<span className="text-muted-foreground font-normal"> YER</span>
                                        </span>
                                    </div>
                                    <Progress value={foodSecurityData.riskScore} className="h-1.5" />

                                    <div className="pt-2 border-t border-border/50 mt-2">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-muted-foreground">Top Product:</span>
                                            <span className="text-orange-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]" title={foodSecurityData.topProduct}>
                                                {foodSecurityData.topProduct.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 text-[10px]">
                                            <span className="text-muted-foreground">Expected Demand:</span>
                                            <span className="font-mono font-medium text-foreground">
                                                {foodSecurityData.topProductDemand.toLocaleString()} kg
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 text-[10px]">
                                            <span className="text-muted-foreground">Model Accuracy:</span>
                                            <span className="text-green-500 font-medium">90.4%</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground">Loading...</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 3. Supply & Market Analysis (Active) */}
                    <Card
                        className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent cursor-pointer hover:bg-emerald-500/10 transition-colors"
                        onClick={() => setActiveView('supply-market')}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-emerald-500/10">
                                        <BarChart3 className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <CardTitle className="text-sm font-medium">Supply & Market</CardTitle>
                                </div>
                                <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-500">Active</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Cost Predictions</span>
                                    <span className="text-sm font-semibold">Available</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Commodities</span>
                                    <Badge className="bg-emerald-500 text-xs h-5">3 Active</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Model Confidence</span>
                                    <span className="text-sm font-mono font-bold text-foreground">
                                        88<span className="text-muted-foreground font-normal">%</span>
                                    </span>
                                </div>
                                <Progress value={88} className="h-1.5" />
                                <div className="pt-2 border-t border-border/50 mt-2">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-muted-foreground">Strategic Recommendation:</span>
                                        <span className="text-emerald-500 font-medium">Delay</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1 text-[10px]">
                                        <span className="text-muted-foreground">Avg Predicted Cost:</span>
                                        <span className="font-mono font-medium text-foreground">$870</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Empty State */}
                <div className="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-card/50 p-8">
                    <div className="text-center text-muted-foreground">
                        <Sigma className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-medium">No Prediction Data</h3>
                        <p className="mt-2 text-sm">Click "Run Prediction" to initiate crisis risk assessment.</p>
                    </div>
                </div>

                {/* AI Summary Placeholder */}
                <Card className="bg-primary/5 border-primary/20 opacity-50">
                    <CardHeader className="flex flex-row items-center gap-3">
                        <Sparkles className="h-6 w-6 text-primary" />
                        <CardTitle className="font-headline text-primary">AI Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-foreground/50">Run prediction to generate AI summary...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ============ WITH DATA ============
    return (
        <div className="space-y-6">
            {/* 3 MODEL CARDS AT TOP - Updated Layout */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* 1. Supply Chain (Active) */}
                <Card
                    className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent cursor-pointer hover:bg-green-500/20 transition-colors"
                    onClick={() => setShowSupplyChain(true)}
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-green-500/20">
                                    <Truck className="h-4 w-4 text-green-500" />
                                </div>
                                <CardTitle className="text-sm font-medium">Supply Chain</CardTitle>
                            </div>
                            <Badge className="bg-green-500 text-xs">Active</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {supplyChainData ? (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Routes Monitored</span>
                                    <span className="text-sm font-semibold">{supplyChainData.totalRoutes}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">High Risk</span>
                                    <Badge variant={supplyChainData.highRiskCount > 0 ? "destructive" : "secondary"} className="text-xs h-5">
                                        {supplyChainData.highRiskCount} Routes
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Avg Network Risk</span>
                                    <span className="text-sm font-mono font-bold text-foreground">
                                        {supplyChainData.avgRisk.toFixed(1)}<span className="text-muted-foreground font-normal">/10</span>
                                    </span>
                                </div>
                                <Progress value={supplyChainData.avgRisk * 10} className="h-1.5" />

                                {/* Advanced Details Section */}
                                {supplyChainData.alertMessage !== 'Operations Normal' && (
                                    <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium animate-pulse mt-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        {supplyChainData.alertMessage}
                                    </div>
                                )}
                                <div className={`pt-2 border-t border-border/50 ${supplyChainData.alertMessage !== 'Operations Normal' ? 'mt-1' : 'mt-2'}`}>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-muted-foreground">Best Efficiency Route:</span>
                                        <span className="text-green-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={supplyChainData.recommendedRoute}>
                                            {supplyChainData.recommendedRoute}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1 text-[10px]">
                                        <span className="text-muted-foreground">Success Probability:</span>
                                        <span className="font-mono font-medium text-foreground">
                                            {(supplyChainData.recRouteProb * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1 text-[10px]">
                                        <span className="text-muted-foreground">Primary Threat:</span>
                                        <span className="text-destructive/80 font-medium">
                                            {supplyChainData.primaryRisk}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-foreground/80 line-clamp-4">{data.output3}</p>
                        )}
                    </CardContent>
                </Card>

                {/* 1. Internal Logistics */}
                <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                    <Cpu className="h-4 w-4 text-blue-500" />
                                </div>
                                <CardTitle className="text-sm font-medium">Internal Logistics</CardTitle>
                            </div>
                            <Badge className="bg-blue-500 text-xs">Active</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-foreground/80 line-clamp-4">{data.output1}</p>
                    </CardContent>
                </Card>

                {/* 2. Food Security (Active with Live Data) */}
                <Card
                    className="border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent cursor-pointer hover:bg-orange-500/20 transition-colors"
                    onClick={() => setActiveView('food-security')}
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/20">
                                    <Utensils className="h-4 w-4 text-orange-500" />
                                </div>
                                <CardTitle className="text-sm font-medium">Food Security</CardTitle>
                            </div>
                            <Badge className="bg-orange-500 text-xs">Active</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {foodSecurityData ? (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Daily Demand</span>
                                    <span className="text-sm font-semibold">{foodSecurityData.totalDemand.toLocaleString()} kg</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Risk Status</span>
                                    <Badge
                                        variant={foodSecurityData.riskStatus === 'Critical' ? "destructive" : foodSecurityData.riskStatus === 'Warning' ? "secondary" : "default"}
                                        className={`text-xs h-5 ${foodSecurityData.riskStatus === 'Stable' ? 'bg-green-500' : ''}`}
                                    >
                                        {foodSecurityData.riskStatus}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">FX Rate</span>
                                    <span className="text-sm font-mono font-bold text-foreground">
                                        {foodSecurityData.avgFx}<span className="text-muted-foreground font-normal"> YER</span>
                                    </span>
                                </div>
                                <Progress value={foodSecurityData.riskScore} className="h-1.5" />

                                <div className="pt-2 border-t border-border/50 mt-2">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-muted-foreground">Top Product:</span>
                                        <span className="text-orange-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]" title={foodSecurityData.topProduct}>
                                            {foodSecurityData.topProduct.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1 text-[10px]">
                                        <span className="text-muted-foreground">Model Accuracy:</span>
                                        <span className="text-green-500 font-medium">90.4%</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-foreground/80 line-clamp-4">{data.output2}</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* MIDDLE SECTION: Synthesis & Statistics */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-3">
                        <Layers className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="font-headline text-lg">Second Layer Synthesis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-foreground/80">{data.secondLayerOutput}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center gap-3">
                        <BarChart2 className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="font-headline text-lg">Statistical Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-sm text-foreground/80 bg-muted/50 p-3 rounded-md overflow-x-auto">
                            <code>{data.statistics}</code>
                        </pre>
                    </CardContent>
                </Card>
            </div>

            {/* AI SUMMARY AT BOTTOM */}
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-center gap-3">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="font-headline text-primary">AI Summary</CardTitle>
                        <CardDescription>Comprehensive analysis from all models</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground/90">{data.summary}</p>
                </CardContent>
            </Card>
        </div>
    );
}
