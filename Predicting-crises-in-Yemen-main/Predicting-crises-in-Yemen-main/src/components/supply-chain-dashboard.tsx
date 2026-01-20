'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
    Truck,
    AlertTriangle,
    MapPin,
    Route as RouteIcon,
    Mountain,
    Waves,
    Sun,
    TrendingUp,
    TrendingDown,
    Activity
} from 'lucide-react';

// Route data type
type RouteData = {
    route_id: string;
    name: string;
    start_city: string;
    end_city: string;
    length_km: number;
    terrain_type: string;
    road_type: string;
    vulnerability_factor: number;
};

// Routes configuration
const routesData: RouteData[] = [
    { route_id: "R01", name: "Hodeidah → Sana'a", start_city: "Hodeidah", end_city: "Sana'a", length_km: 226, terrain_type: "mountain", road_type: "highway", vulnerability_factor: 0.65 },
    { route_id: "R02", name: "Dhamar → Sana'a", start_city: "Dhamar", end_city: "Sana'a", length_km: 95, terrain_type: "mountain", road_type: "highway", vulnerability_factor: 0.45 },
    { route_id: "R03", name: "Ibb → Sana'a", start_city: "Ibb", end_city: "Sana'a", length_km: 178, terrain_type: "mixed", road_type: "highway", vulnerability_factor: 0.55 },
    { route_id: "R04", name: "Amran → Sana'a", start_city: "Amran", end_city: "Sana'a", length_km: 50, terrain_type: "valley", road_type: "highway", vulnerability_factor: 0.50 },
    { route_id: "R05", name: "Saadah → Sana'a", start_city: "Saadah", end_city: "Sana'a", length_km: 242, terrain_type: "desert", road_type: "highway", vulnerability_factor: 0.80 },
    { route_id: "R06", name: "Marib → Sana'a", start_city: "Marib", end_city: "Sana'a", length_km: 173, terrain_type: "desert", road_type: "highway", vulnerability_factor: 0.85 },
    { route_id: "R07", name: "Al-Jawf → Sana'a", start_city: "Al-Jawf", end_city: "Sana'a", length_km: 200, terrain_type: "desert", road_type: "secondary", vulnerability_factor: 0.75 },
    { route_id: "R08", name: "Hajjah → Sana'a", start_city: "Hajjah", end_city: "Sana'a", length_km: 127, terrain_type: "mountain", road_type: "secondary", vulnerability_factor: 0.70 },
    { route_id: "R09", name: "Taiz → Sana'a", start_city: "Taiz", end_city: "Sana'a", length_km: 256, terrain_type: "mixed", road_type: "highway", vulnerability_factor: 0.60 },
    { route_id: "R10", name: "Al-Bayda → Sana'a", start_city: "Al-Bayda", end_city: "Sana'a", length_km: 267, terrain_type: "mixed", road_type: "secondary", vulnerability_factor: 0.72 },
];

// Terrain icons
const terrainIcons: Record<string, React.ReactNode> = {
    mountain: <Mountain className="h-4 w-4" />,
    desert: <Sun className="h-4 w-4" />,
    valley: <Waves className="h-4 w-4" />,
    mixed: <Activity className="h-4 w-4" />,
};

// Risk level helpers
const getRiskLevel = (vulnerability: number): { label: string; color: string; bgColor: string } => {
    if (vulnerability >= 0.75) return { label: 'High Risk', color: 'text-red-500', bgColor: 'bg-red-500/10 border-red-500/30' };
    if (vulnerability >= 0.55) return { label: 'Medium Risk', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10 border-yellow-500/30' };
    return { label: 'Low Risk', color: 'text-green-500', bgColor: 'bg-green-500/10 border-green-500/30' };
};

type SupplyChainDashboardProps = {
    onClose?: () => void;
};

export function SupplyChainDashboard({ onClose }: SupplyChainDashboardProps) {
    const [selectedRoute, setSelectedRoute] = React.useState<RouteData | null>(null);

    // Calculate statistics
    const avgVulnerability = routesData.reduce((acc, r) => acc + r.vulnerability_factor, 0) / routesData.length;
    const highRiskRoutes = routesData.filter(r => r.vulnerability_factor >= 0.75).length;
    const totalDistance = routesData.reduce((acc, r) => acc + r.length_km, 0);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Supply Chain Dashboard</h2>
                        <p className="text-xs text-muted-foreground">Yemen Route Risk Analysis</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 p-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Routes</p>
                                <p className="text-2xl font-bold">{routesData.length}</p>
                            </div>
                            <RouteIcon className="h-8 w-8 text-primary/50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-red-500/5 border-red-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">High Risk Routes</p>
                                <p className="text-2xl font-bold text-red-500">{highRiskRoutes}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500/50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-yellow-500/5 border-yellow-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Avg. Vulnerability</p>
                                <p className="text-2xl font-bold text-yellow-500">{(avgVulnerability * 100).toFixed(0)}%</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-yellow-500/50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Routes List */}
            <ScrollArea className="flex-1 px-4">
                <div className="space-y-3 pb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Supply Routes to Sana'a
                    </h3>

                    {routesData.map((route) => {
                        const risk = getRiskLevel(route.vulnerability_factor);
                        const isSelected = selectedRoute?.route_id === route.route_id;

                        return (
                            <Card
                                key={route.route_id}
                                className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''
                                    } ${risk.bgColor}`}
                                onClick={() => setSelectedRoute(isSelected ? null : route)}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px]">
                                                {route.route_id}
                                            </Badge>
                                            <span className="font-medium text-sm">{route.name}</span>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={`text-[10px] ${risk.color}`}
                                        >
                                            {risk.label}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            {terrainIcons[route.terrain_type]}
                                            <span className="capitalize">{route.terrain_type}</span>
                                        </div>
                                        <div>{route.length_km} km</div>
                                        <div className="capitalize">{route.road_type}</div>
                                        <div className={risk.color}>
                                            {(route.vulnerability_factor * 100).toFixed(0)}% risk
                                        </div>
                                    </div>

                                    {/* Risk Progress Bar */}
                                    <div className="mt-2">
                                        <Progress
                                            value={route.vulnerability_factor * 100}
                                            className="h-1.5"
                                        />
                                    </div>

                                    {/* Expanded Details */}
                                    {isSelected && (
                                        <div className="mt-3 pt-3 border-t space-y-2 text-xs">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className="text-muted-foreground">Start:</span>{' '}
                                                    <span className="font-medium">{route.start_city}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">End:</span>{' '}
                                                    <span className="font-medium">{route.end_city}</span>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-muted/50 rounded text-muted-foreground">
                                                <strong>Risk Factors:</strong> Terrain difficulty, road conditions,
                                                security concerns, weather vulnerability
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </ScrollArea>

            {/* Footer Summary */}
            <div className="p-4 border-t bg-muted/20">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total Network Distance: {totalDistance.toLocaleString()} km</span>
                    <span>LightGBM Model: Active ✓</span>
                </div>
            </div>
        </div>
    );
}
