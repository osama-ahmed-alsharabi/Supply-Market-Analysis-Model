'use client';

import * as React from 'react';
import { runPredictionFlow, getExplanation } from '@/app/actions';
import type { PredictionData } from '@/app/actions';
import { ResultsPanel } from '@/components/results-panel';
import { ChatPanel, type ChatMessage } from '@/components/chat-panel';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/icons';
import { Wand2, Menu, MessageSquare, X } from 'lucide-react';
import { Separator } from './ui/separator';
import { ModelSidebarExtended } from '@/components/model-sidebar-extended';
import { SentinelDashboard } from '@/components/sentinel-dashboard';
import { FoodSecurityDashboard } from '@/components/food-security-dashboard';
import { SupplyMarketAnalysisDashboard } from '@/components/supply-market-analysis-dashboard';
import { SettingsView } from '@/components/views/settings-view';
import { ReportsView } from '@/components/views/reports-view';
import { DataSourcesView } from '@/components/views/data-view';
import { HelpDocView } from '@/components/views/help-view';
import { translations, Language } from '@/lib/translations';

// Define Report Type globally
export type Report = {
    id: string;
    name: string;
    date: string;
    type: 'PDF' | 'CSV' | 'XLSX' | 'JSON';
    size: string;
    status: 'Ready' | 'Processing';
};

// Extended ActiveView to include supply-market
export type ActiveView = 'dashboard' | 'supply-chain' | 'food-security' | 'supply-market' | 'settings' | 'reports' | 'data' | 'help';

export const DashboardContext = React.createContext<{
    showSupplyChain: boolean;
    setShowSupplyChain: (show: boolean) => void;
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
    reports: Report[];
    addReport: (report: Report) => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    t: typeof translations['en'];
}>({
    showSupplyChain: false,
    setShowSupplyChain: () => { },
    activeView: 'dashboard',
    setActiveView: () => { },
    reports: [],
    addReport: () => { },
    language: 'en',
    setLanguage: () => { },
    t: translations['en']
});

export function DashboardClientExtended() {
    const [predictionData, setPredictionData] = React.useState<PredictionData | null>(null);
    const [isLoadingPrediction, setIsLoadingPrediction] = React.useState(false);
    const [isSendingMessage, setIsSendingMessage] = React.useState(false);

    // Mobile Layout States
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [mobileChatOpen, setMobileChatOpen] = React.useState(false);

    // Navigation State
    const [activeView, setActiveView] = React.useState<ActiveView>('dashboard');
    const showSupplyChain = activeView === 'supply-chain';

    // Language State
    const [language, setLanguage] = React.useState<Language>('en');
    const t = translations[language];

    const initialChatMessages: ChatMessage[] = [
        {
            role: 'assistant',
            content: language === 'ar'
                ? "مرحباً! أنا هنا لمساعدتك في فهم نتائج التنبؤ. بمجرد تشغيل التنبؤ، لا تتردد في سؤالي عن التفاصيل."
                : "Hello! I'm here to help you understand the prediction results. Once you run a prediction, feel free to ask me for explanations.",
        }
    ];

    const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(initialChatMessages);

    // Reports State (Centralized)
    const [reports, setReports] = React.useState<Report[]>([]);

    const { toast } = useToast();

    // Load Settings (Language) on Mount
    React.useEffect(() => {
        const savedSettings = localStorage.getItem('sentinel_settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                if (parsed.language) setLanguage(parsed.language);
            } catch (e) {
                console.error("Failed to parse settings for language", e);
            }
        }
    }, []);

    // Update Reports when Language Changes
    React.useEffect(() => {
        setReports([
            { id: 'RPT-2024-042', name: language === 'ar' ? 'تحليل مخاطر سلسلة التوريد العالمية' : 'Global Supply Chain Risk Analysis', date: '2024-01-12', type: 'PDF', size: '2.4 MB', status: 'Ready' },
            { id: 'RPT-2024-041', name: language === 'ar' ? 'تصدير مقاييس المستشعرات الخام' : 'Raw Sensor Metrics Export', date: '2024-01-11', type: 'CSV', size: '45.2 MB', status: 'Ready' },
            { id: 'RPT-2024-039', name: language === 'ar' ? 'الأثر المالي الفصلي' : 'Quarterly Financial Impact', date: '2024-01-10', type: 'XLSX', size: '1.8 MB', status: 'Ready' },
            { id: 'RPT-2024-035', name: language === 'ar' ? 'سجلات النظام والتشخيص' : 'System Logs & Diagnostics', date: '2024-01-08', type: 'JSON', size: '8.5 MB', status: 'Ready' },
            { id: 'RPT-2024-022', name: language === 'ar' ? 'توقعات الأمن الغذائي - EMEA' : 'Food Security Forecast - EMEA', date: '2024-01-05', type: 'PDF', size: '3.1 MB', status: 'Ready' },
            { id: 'RPT-2024-050', name: language === 'ar' ? 'تحليل العرض والسوق' : 'Supply & Market Analysis Report', date: '2024-01-15', type: 'PDF', size: '2.8 MB', status: 'Ready' }
        ]);
        setChatMessages(prev => [initialChatMessages[0], ...prev.slice(1)]);
    }, [language]);


    // Helper to maintain compatibility
    const setShowSupplyChain = (show: boolean) => {
        setActiveView(show ? 'supply-chain' : 'dashboard');
    };

    const addReport = (report: Report) => {
        setReports(prev => [report, ...prev]);
    };

    const handleRunPrediction = async () => {
        setIsLoadingPrediction(true);
        setPredictionData(null);
        setChatMessages(initialChatMessages);

        const result = await runPredictionFlow("initial user data");

        if (result.error || !result.data) {
            toast({
                variant: 'destructive',
                title: t.status + ': Failed',
                description: result.error || 'An unknown error occurred.',
            });
        } else {
            setPredictionData(result.data);

            const newReport: Report = {
                id: `RPT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                name: language === 'ar' ? 'تقييم المخاطر: تحليل عالمي' : 'Risk Assessment: Global Analysis',
                date: new Date().toISOString().split('T')[0],
                type: 'PDF',
                size: '1.4 MB',
                status: 'Ready'
            };
            addReport(newReport);

            toast({
                title: language === 'ar' ? "اكتمل التحليل وتم إنشاء التقرير" : "Analysis Complete & Report Generated",
                description: language === 'ar' ? "تم إنشاء تقرير جديد تلقائياً في قسم التقارير." : "A new report has been automatically created in the Reports section.",
            });
        }
        setIsLoadingPrediction(false);
    };

    const handleSendMessage = async (message: string) => {
        // Allow chat when showing supply chain, supply market, or when prediction data exists
        if (!predictionData && !showSupplyChain && activeView !== 'supply-market') return;

        const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: message }];
        setChatMessages(newMessages);
        setIsSendingMessage(true);

        // Use prediction data or context based on active view
        let context = predictionData?.statistics;
        if (activeView === 'supply-chain') {
            context = JSON.stringify({
                context: 'supply_chain_analysis',
                mode: 'sentinel',
                routes: 10,
                high_risk: 4
            });
        } else if (activeView === 'supply-market') {
            context = JSON.stringify({
                context: 'supply_market_analysis',
                mode: 'cost_forecast',
                commodities: ['wheat', 'sugar', 'oil']
            });
        }

        const result = await getExplanation(message, context || '');

        if (result.error || !result.data) {
            setChatMessages([...newMessages, { role: 'assistant', content: result.error || "Sorry, I couldn't get an explanation." }]);
        } else {
            setChatMessages([...newMessages, { role: 'assistant', content: result.data }]);
        }
        setIsSendingMessage(false);
    };

    // Render content based on active view
    const renderContent = () => {
        switch (activeView) {
            case 'supply-chain':
                return <SentinelDashboard onClose={() => setActiveView('dashboard')} />;
            case 'food-security':
                return <FoodSecurityDashboard onClose={() => setActiveView('dashboard')} />;
            case 'supply-market':
                return <SupplyMarketAnalysisDashboard onClose={() => setActiveView('dashboard')} />;
            case 'settings':
                return <SettingsView />;
            case 'reports':
                return <ReportsView />;
            case 'data':
                return <DataSourcesView />;
            case 'help':
                return <HelpDocView />;
            case 'dashboard':
            default:
                return (
                    <div className="h-full overflow-y-auto p-4 md:p-6">
                        <ResultsPanel data={predictionData} isLoading={isLoadingPrediction} />
                    </div>
                );
        }
    };

    // Get view-specific header text
    const getViewTitle = () => {
        switch (activeView) {
            case 'supply-chain': return t.supplyChain;
            case 'food-security': return 'Food Security';
            case 'supply-market': return language === 'ar' ? 'تحليل العرض والسوق' : 'Supply & Market';
            case 'settings': return t.settings;
            case 'reports': return t.reports;
            case 'data': return t.dataConnectors;
            case 'help': return t.helpDocs;
            default: return '';
        }
    };

    return (
        <DashboardContext.Provider value={{
            showSupplyChain,
            setShowSupplyChain,
            activeView,
            setActiveView,
            reports,
            addReport,
            language,
            setLanguage,
            t
        }}>
            <div className="h-screen max-h-screen overflow-hidden bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-200 flex flex-col">
                {/* HEADER */}
                <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-[#1f4068] bg-white/80 dark:bg-[#16213e]/80 backdrop-blur-sm flex-shrink-0 h-16">
                    <div className="container mx-auto flex h-full items-center justify-between px-4 md:px-6">
                        <div className="flex items-center gap-3">
                            {/* Mobile Menu Toggle */}
                            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                                <Menu className="h-5 w-5" />
                            </Button>

                            <AppLogo className="h-7 w-7 text-primary" />
                            <div className="hidden md:flex items-center gap-1">
                                {activeView !== 'dashboard' && (
                                    <span className="text-sm text-muted-foreground">• {getViewTitle()}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button onClick={handleRunPrediction} disabled={isLoadingPrediction} size="sm" className="hidden md:flex">
                                <Wand2 className="mr-2 h-4 w-4" />
                                {isLoadingPrediction ? t.generating : t.runPrediction}
                            </Button>
                            {/* Mobile Run Pred Button (Icon Only) */}
                            <Button onClick={handleRunPrediction} disabled={isLoadingPrediction} size="icon" className="md:hidden">
                                <Wand2 className="h-4 w-4" />
                            </Button>

                            {/* Mobile Chat Toggle */}
                            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileChatOpen(!mobileChatOpen)}>
                                <MessageSquare className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* MAIN CONTENT: Sidebar + Center + Chat (3-column layout) */}
                <main className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)] relative">

                    {/* LEFT SIDEBAR - Desktop: Visible, Mobile: Hidden/Drawer */}
                    <div className={`
                        absolute inset-y-0 left-0 z-20 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                        ${mobileMenuOpen ? 'translate-x-0 w-64 bg-background border-r shadow-lg' : '-translate-x-full w-0 md:w-auto'}
                    `}>
                        <div className="h-full overflow-hidden">
                            <ModelSidebarExtended />
                        </div>
                        {/* Close button for mobile menu */}
                        {mobileMenuOpen && (
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 md:hidden" onClick={() => setMobileMenuOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Overlay for mobile menu */}
                    {mobileMenuOpen && (
                        <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setMobileMenuOpen(false)} />
                    )}

                    {/* CENTER CONTENT */}
                    <div className="flex-1 overflow-hidden h-full flex flex-col relative w-full">
                        {renderContent()}
                    </div>

                    {/* RIGHT CHAT PANEL - Desktop: Visible, Mobile: Hidden/Drawer */}
                    <div className={`
                        absolute inset-y-0 right-0 z-20 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                        bg-background border-l
                        ${mobileChatOpen ? 'translate-x-0 w-[90%] sm:w-[380px] shadow-lg' : 'translate-x-full w-0 md:w-[380px]'}
                    `}>
                        <div className="h-full overflow-hidden relative">
                            <ChatPanel
                                messages={chatMessages}
                                onSendMessage={handleSendMessage}
                                isSending={isSendingMessage}
                                isChatEnabled={!!predictionData || showSupplyChain || activeView === 'supply-market'}
                            />
                            {/* Close button for mobile chat */}
                            {mobileChatOpen && (
                                <Button variant="ghost" size="icon" className="absolute top-2 left-2 md:hidden" onClick={() => setMobileChatOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                    {/* Overlay for mobile chat */}
                    {mobileChatOpen && (
                        <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setMobileChatOpen(false)} />
                    )}
                </main>
            </div>
        </DashboardContext.Provider>
    );
}
