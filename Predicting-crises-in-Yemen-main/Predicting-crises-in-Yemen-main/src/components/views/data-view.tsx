'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Server, Globe, Activity, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardContext } from '@/components/dashboard-client-extended';

type DataSourceState = {
    id: string;
    name: string;
    type: 'Database' | 'API' | 'Stream';
    status: 'Connected' | 'Syncing' | 'Error' | 'Maintenance';
    lastSync: string;
    health: number; // 0-100
};

const initialSources: DataSourceState[] = [
    { id: 'DS-001', name: 'Primary Logistics DB', type: 'Database', status: 'Connected', lastSync: '2 mins ago', health: 98 },
    { id: 'DS-002', name: 'Weather API V3', type: 'API', status: 'Connected', lastSync: '5 mins ago', health: 100 },
    { id: 'DS-003', name: 'Real-time Fleet Stream', type: 'Stream', status: 'Syncing', lastSync: 'Just now', health: 92 },
    { id: 'DS-004', name: 'Supplier Portal Legacy', type: 'Database', status: 'Maintenance', lastSync: '4 hours ago', health: 65 },
];

export function DataSourcesView() {
    const { t, language } = React.useContext(DashboardContext);
    const [sources, setSources] = React.useState<DataSourceState[]>(initialSources);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const { toast } = useToast();

    // Helper for translating status text
    const translateStatus = (status: string) => {
        if (language !== 'ar') return status;
        switch (status) {
            case 'Connected': return 'متصل';
            case 'Syncing': return 'جاري المزامنة';
            case 'Maintenance': return 'صيانة';
            case 'Error': return 'خطأ';
            default: return status;
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        // Simulate network request
        setTimeout(() => {
            const updatedSources = sources.map(source => {
                // Randomly change status lightly to simulate activity
                const random = Math.random();
                let newStatus = source.status;
                let newHealth = source.health;

                if (source.status !== 'Maintenance') {
                    if (random > 0.8) newStatus = 'Syncing';
                    else if (random > 0.95) newStatus = 'Connected';

                    // Fluctuate health slightly
                    newHealth = Math.min(100, Math.max(50, source.health + Math.floor(Math.random() * 5) - 2));
                }

                return {
                    ...source,
                    status: newStatus,
                    lastSync: language === 'ar' ? 'الآن' : 'Just now',
                    health: newHealth
                };
            });

            setSources(updatedSources);
            setIsRefreshing(false);
            toast({
                title: language === 'ar' ? "تم تحديث الاتصالات" : "Connections Refreshed",
                description: language === 'ar' ? "تم تحديث حالات مصادر البيانات." : "Data source statuses have been updated.",
            });
        }, 1500);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Connected': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'Syncing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
            case 'Maintenance': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'Error': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Activity className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t.dataSources}</h2>
                    <p className="text-muted-foreground">{t.dataDesc}</p>
                </div>
                <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing
                        ? (language === 'ar' ? 'جاري الفحص...' : 'Checking Status...')
                        : (language === 'ar' ? 'تحديث الحالة' : 'Refresh Status')}
                </Button>
            </div>

            {/* Status Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {sources.map((source) => (
                    <Card key={source.id} className="border-l-4" style={{
                        borderLeftColor:
                            source.status === 'Connected' ? '#22c55e' :
                                source.status === 'Syncing' ? '#3b82f6' :
                                    source.status === 'Maintenance' ? '#eab308' : '#ef4444'
                    }}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {source.name}
                            </CardTitle>
                            {source.type === 'Database' ? <Database className="h-4 w-4 text-muted-foreground" /> :
                                source.type === 'API' ? <Globe className="h-4 w-4 text-muted-foreground" /> :
                                    <Server className="h-4 w-4 text-muted-foreground" />}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-2">
                                {getStatusIcon(source.status)}
                                <span className="text-lg">{translateStatus(source.status)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {language === 'ar' ? "الصحة" : "Health"}: {source.health}% • {language === 'ar' ? "مزامنة" : "Sync"}: {source.lastSync}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Ingestion Statistics */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{language === 'ar' ? "حجم البيانات المعالجة" : "Ingestion Volume"}</CardTitle>
                        <CardDescription>{language === 'ar' ? "البيانات التي تمت معالجتها خلال 24 ساعة الماضية." : "Data processed over the last 24 hours."}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">
                        <div className="text-center">
                            <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>{language === 'ar' ? "مخطط البيانات الحية (يتطلب مكتبة رسومية)" : "Live Ingestion Chart Placeholder"}</p>
                            <span className="text-xs">(Requires Visualization Library)</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t.connectionLogs}</CardTitle>
                        <CardDescription>{language === 'ar' ? "سجل الاحداث والاخطاء الاخيرة." : "Recent connection events and errors."}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { event: language === 'ar' ? 'اكتملت المزامنة لـ Weather API' : 'Sync completed for Weather API', time: language === 'ar' ? 'منذ دقيقتين' : '2 mins ago', type: 'success' },
                                { event: language === 'ar' ? 'ارتفاع زمن الانتقال في Fleet Stream' : 'Latency spike on Fleet Stream', time: language === 'ar' ? 'منذ 15 دقيقة' : '15 mins ago', type: 'warning' },
                                { event: language === 'ar' ? 'بدأ النسخ الاحتياطي المجدول' : 'Scheduled backup started', time: language === 'ar' ? 'منذ ساعة' : '1 hour ago', type: 'info' },
                            ].map((log, i) => (
                                <div key={i} className="flex items-center text-sm">
                                    <div className={`w-2 h-2 rounded-full mr-2 ${log.type === 'success' ? 'bg-green-500' :
                                        log.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                        }`} />
                                    <span className="flex-1">{log.event}</span>
                                    <span className="text-muted-foreground text-xs">{log.time}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
