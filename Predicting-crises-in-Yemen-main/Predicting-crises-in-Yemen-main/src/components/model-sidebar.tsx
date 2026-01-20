'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Server, Clock, Truck, Radio, Utensils, Activity, Settings, FileText, Database, HelpCircle, LayoutDashboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardContext, ActiveView } from '@/components/dashboard-client';

type ModelDetail = {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'warning' | 'error';
    accuracy: string;
    last_updated: string;
    details: {
        input_parameters: string[];
        analysis_steps: string[];
        key_findings: string;
    };
};

export function ModelSidebar() {
    const [isOpen, setIsOpen] = React.useState(true);
    const [models, setModels] = React.useState<ModelDetail[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Get context from DashboardClient (including translation 't')
    const { activeView, setActiveView, t } = React.useContext(DashboardContext);

    React.useEffect(() => {
        const fetchModels = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/models');
                if (!response.ok) {
                    throw new Error('Failed to fetch model data');
                }
                const data = await response.json();
                setModels(data);
            } catch (err) {
                console.error("Error fetching models:", err);
                setError("Could not load model data. Ensure backend is running.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchModels();
    }, []);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div
            className={cn(
                "relative flex flex-col border-r border-gray-200 dark:border-[#1f4068] bg-gray-50 dark:bg-[#16213e]/50 transition-all duration-300 ease-in-out h-full",
                isOpen ? "w-80" : "w-14"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#1f4068] h-14">
                {isOpen && (
                    <div className="flex items-center gap-2 font-semibold text-sm">
                        <Server className="h-4 w-4" />
                        <span>{t.admin}</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-auto"
                    onClick={toggleSidebar}
                >
                    {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
            </div>

            <ScrollArea className="flex-1">
                {isOpen && (
                    <div className="p-4 space-y-4">
                        {/* ========== DASHBOARD HOME BUTTON ========== */}
                        <Button
                            variant={activeView === 'dashboard' ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-3 h-10 mb-2 font-semibold",
                                activeView === 'dashboard' ? "bg-muted text-primary" : "text-muted-foreground hover:text-primary"
                            )}
                            onClick={() => setActiveView('dashboard')}
                        >
                            <div className={cn("p-1 rounded", activeView === 'dashboard' && "bg-background shadow-sm")}>
                                <LayoutDashboard className="h-5 w-5" />
                            </div>
                            <span>{t.dashboardOverview}</span>
                        </Button>

                        <div className="border-b mb-4" />

                        {/* ========== SUPPLY CHAIN BUTTON ========== */}
                        <Button
                            variant={activeView === 'supply-chain' ? "default" : "outline"}
                            className={cn(
                                "w-full justify-start gap-3 h-14 transition-all mb-3",
                                activeView === 'supply-chain'
                                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0"
                                    : "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:bg-primary/20"
                            )}
                            onClick={() => setActiveView(activeView === 'supply-chain' ? 'dashboard' : 'supply-chain')}
                        >
                            <div className={cn(
                                "p-2 rounded-lg",
                                activeView === 'supply-chain' ? "bg-white/20" : "bg-primary/20"
                            )}>
                                <Truck className={cn("h-5 w-5", activeView === 'supply-chain' ? "text-white" : "text-primary")} />
                            </div>
                            <div className="text-left">
                                <div className={cn("font-semibold text-sm", activeView === 'supply-chain' && "text-white")}>
                                    📡 {t.supplyChain}
                                </div>
                                <div className={cn("text-[10px]", activeView === 'supply-chain' ? "text-white/70" : "text-muted-foreground")}>
                                    {activeView === 'supply-chain' ? t.status + ": Active" : "SENTINEL V4.0 Radar"}
                                </div>
                            </div>
                            {activeView === 'supply-chain' && (
                                <Radio className="h-4 w-4 text-white ml-auto animate-pulse" />
                            )}
                        </Button>

                        {/* ========== FOOD SECURITY BUTTON (Identical Design) ========== */}
                        <Button
                            variant={activeView === 'food-security' ? "default" : "outline"}
                            className={cn(
                                "w-full justify-start gap-3 h-14 transition-all mb-3",
                                activeView === 'food-security'
                                    ? "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 border-0"
                                    : "bg-gradient-to-r from-orange-500/10 to-orange-500/5 border-orange-500/30 hover:bg-orange-500/20"
                            )}
                            onClick={() => setActiveView(activeView === 'food-security' ? 'dashboard' : 'food-security')}
                        >
                            <div className={cn(
                                "p-2 rounded-lg",
                                activeView === 'food-security' ? "bg-white/20" : "bg-orange-500/20"
                            )}>
                                <Utensils className={cn("h-5 w-5", activeView === 'food-security' ? "text-white" : "text-orange-500")} />
                            </div>
                            <div className="text-left">
                                <div className={cn("font-semibold text-sm", activeView === 'food-security' && "text-white")}>
                                    🥣 Food Security
                                </div>
                                <div className={cn("text-[10px]", activeView === 'food-security' ? "text-white/70" : "text-muted-foreground")}>
                                    {activeView === 'food-security' ? t.status + ": Active" : "Crisis Prediction Module"}
                                </div>
                            </div>
                            {activeView === 'food-security' && (
                                <Radio className="h-4 w-4 text-white ml-auto animate-pulse" />
                            )}
                        </Button>

                        {/* ========== GENERAL FACTORS BUTTON (Identical Design) ========== */}
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3 h-14 transition-all bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-blue-500/30 hover:bg-blue-500/20 text-foreground"
                        >
                            <div className="p-2 rounded-lg bg-blue-500/20">
                                <Activity className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-sm">
                                    📊 General Factors
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                    Socio-Economic Index
                                </div>
                            </div>
                        </Button>

                        <div className="border-t my-3" />

                        {/* SYSTEM & UTILITIES SECTION */}
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1 mb-2">
                            {t.systemSettings}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <Button
                                variant={activeView === 'settings' ? "default" : "outline"}
                                className={cn("h-20 flex flex-col gap-2 border-muted-foreground/20", activeView !== 'settings' && "hover:bg-muted/50")}
                                title={t.settings}
                                onClick={() => setActiveView('settings')}
                            >
                                <Settings className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{t.settings}</span>
                            </Button>
                            <Button
                                variant={activeView === 'reports' ? "default" : "outline"}
                                className={cn("h-20 flex flex-col gap-2 border-muted-foreground/20", activeView !== 'reports' && "hover:bg-muted/50")}
                                title={t.reports}
                                onClick={() => setActiveView('reports')}
                            >
                                <FileText className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{t.reports}</span>
                            </Button>
                            <Button
                                variant={activeView === 'data' ? "default" : "outline"}
                                className={cn("h-20 flex flex-col gap-2 border-muted-foreground/20", activeView !== 'data' && "hover:bg-muted/50")}
                                title={t.dataConnectors}
                                onClick={() => setActiveView('data')}
                            >
                                <Database className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{t.dataConnectors}</span>
                            </Button>
                            <Button
                                variant={activeView === 'help' ? "default" : "outline"}
                                className={cn("h-20 flex flex-col gap-2 border-muted-foreground/20", activeView !== 'help' && "hover:bg-muted/50")}
                                title={t.helpDocs}
                                onClick={() => setActiveView('help')}
                            >
                                <HelpCircle className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{t.helpDocs}</span>
                            </Button>
                        </div>

                        <div className="border-t my-3" />

                        {/* Section Title */}
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
                            Active Models
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="text-sm text-center text-muted-foreground p-4">
                                {t.loading}
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="text-xs text-center text-destructive p-4 border border-destructive/20 rounded-md bg-destructive/10">
                                {error}
                            </div>
                        )}

                        {/* Models List */}
                        {!isLoading && !error && models.map((model) => (
                            <Card key={model.id} className="overflow-hidden border-muted-foreground/20 shadow-sm">
                                <CardHeader className="p-3 bg-muted/30">
                                    <div className="flex items-center justify-between mb-1">
                                        <Badge
                                            variant={model.status === 'active' ? 'default' : 'destructive'}
                                            className="text-[10px] px-1.5 py-0 h-5"
                                        >
                                            {model.status.toUpperCase()}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {model.last_updated}
                                        </span>
                                    </div>
                                    <CardTitle className="text-sm font-medium leading-tight">
                                        {model.name}
                                    </CardTitle>
                                    <CardDescription className="text-[10px] mt-1">
                                        {model.type}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-3 text-xs space-y-3">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span>Accuracy</span>
                                        <span className="font-mono font-medium text-foreground">{model.accuracy}</span>
                                    </div>

                                    <div>
                                        <div className="font-semibold mb-1 text-primary/80">Input Params</div>
                                        <ul className="list-disc list-inside text-muted-foreground pl-1">
                                            {model.details.input_parameters.slice(0, 2).map((param, i) => (
                                                <li key={i}>{param}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <div className="font-semibold mb-1 text-primary/80">Analysis Steps</div>
                                        <div className="space-y-1 text-muted-foreground">
                                            {model.details.analysis_steps.map((step, i) => (
                                                <div key={i} className="flex gap-2 items-start">
                                                    <span className="text-muted-foreground/50">{i + 1}.</span>
                                                    <span className="leading-tight">{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Collapsed state - show icons only */}
                {!isOpen && (
                    <div className="p-2 space-y-2">
                        <Button
                            variant={activeView === 'supply-chain' ? "default" : "ghost"}
                            size="icon"
                            className="w-10 h-10"
                            onClick={() => setActiveView(activeView === 'supply-chain' ? 'dashboard' : 'supply-chain')}
                            title={t.supplyChain}
                        >
                            <Truck className="h-5 w-5" />
                        </Button>
                        <Button
                            variant={activeView === 'food-security' ? "default" : "ghost"}
                            size="icon"
                            className={cn("w-10 h-10", activeView === 'food-security' && "bg-orange-600 hover:bg-orange-700")}
                            onClick={() => setActiveView(activeView === 'food-security' ? 'dashboard' : 'food-security')}
                            title="Food Security"
                        >
                            <Utensils className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-10 h-10"
                            title="General Factors"
                        >
                            <Activity className="h-5 w-5" />
                        </Button>
                        <div className="border-t my-2" />
                        <Button
                            variant={activeView === 'settings' ? "default" : "ghost"}
                            size="icon"
                            className="w-10 h-10"
                            onClick={() => setActiveView('settings')}
                            title={t.settings}
                        >
                            <Settings className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
