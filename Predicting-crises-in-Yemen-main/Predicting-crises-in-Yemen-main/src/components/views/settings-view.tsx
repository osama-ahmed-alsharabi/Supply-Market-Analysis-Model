'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Bell,
    Shield,
    Sliders,
    Smartphone,
    Save,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardContext } from '@/components/dashboard-client-extended';

export function SettingsView() {
    const { toast } = useToast();
    const { t, language, setLanguage } = React.useContext(DashboardContext);

    // --- State Management for Settings ---
    const [isSaving, setIsSaving] = React.useState(false);

    // Local Settings State
    const [darkMode, setDarkMode] = React.useState(true);
    const [animations, setAnimations] = React.useState(true);
    // compactMode is purely local for now
    const [compactMode, setCompactMode] = React.useState(false);

    // Notifications
    const [emailAlerts, setEmailAlerts] = React.useState(true);
    const [pushNotifs, setPushNotifs] = React.useState(false);
    const [riskThreshold, setRiskThreshold] = React.useState('7.5');

    // Security
    const [twoFactor, setTwoFactor] = React.useState(true);

    // API
    const [apiKey, setApiKey] = React.useState('');
    const [webhookUrl, setWebhookUrl] = React.useState('');

    // Load Initial Settings from LocalStorage (Sync with Global Language)
    React.useEffect(() => {
        const savedSettings = localStorage.getItem('sentinel_settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setDarkMode(parsed.darkMode ?? true);
                setAnimations(parsed.animations ?? true);
                setCompactMode(parsed.compactMode ?? false);
                setEmailAlerts(parsed.emailAlerts ?? true);
                setPushNotifs(parsed.pushNotifs ?? false);
                // Language is already loaded by DashboardClient, but we ensure consistency
            } catch (error) {
                console.error("Failed to parse settings", error);
            }
        }
    }, [language]); // Re-run if language changes externally, though mainly on mount

    // --- EFFECT: Apply Visual Changes ---
    React.useEffect(() => {
        const root = window.document.documentElement;

        // 1. Dark Mode
        if (darkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // 2. Language/Direction
        if (language === 'ar') {
            root.setAttribute('dir', 'rtl');
            root.setAttribute('lang', 'ar');
        } else {
            root.setAttribute('dir', 'ltr');
            root.setAttribute('lang', 'en');
        }

        // 3. Animations
        if (!animations) {
            document.body.style.setProperty('--transition-duration', '0s');
            root.classList.add('disable-animations');
        } else {
            document.body.style.removeProperty('--transition-duration');
            root.classList.remove('disable-animations');
        }

    }, [darkMode, language, animations]);


    const handleSave = () => {
        setIsSaving(true);

        const settingsToSave = {
            darkMode,
            animations,
            compactMode,
            language,
            emailAlerts,
            pushNotifs,
            riskThreshold,
            twoFactor,
            apiKey,
            webhookUrl
        };

        setTimeout(() => {
            localStorage.setItem('sentinel_settings', JSON.stringify(settingsToSave));
            setIsSaving(false);
            toast({
                title: t.save,
                description: language === 'ar'
                    ? "تم تحديث تفضيلات النظام بنجاح."
                    : "Your system preferences have been updated successfully.",
            });
        }, 1000);
    };

    const handleReset = () => {
        const confirmMsg = language === 'ar'
            ? "هل أنت متأكد من استعادة الإعدادات الافتراضية؟"
            : "Are you sure you want to reset settings?";

        if (confirm(confirmMsg)) {
            setDarkMode(true);
            setAnimations(true);
            setCompactMode(false);
            setLanguage('en'); // Default to English
            setEmailAlerts(true);

            localStorage.removeItem('sentinel_settings');

            toast({
                title: t.discard,
                description: language === 'ar' ? "تمت استعادة الإعدادات الافتراضية." : "Settings reset to defaults."
            });
        }
    };

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t.systemSettings}</h2>
                    <p className="text-muted-foreground">{t.settingsDesc}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={handleReset} disabled={isSaving}>{t.discard}</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? (language === 'ar' ? "جاري الحفظ..." : "Saving...") : t.save}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="general">{t.general}</TabsTrigger>
                    <TabsTrigger value="notifications">{t.alerts}</TabsTrigger>
                    <TabsTrigger value="security">{t.security}</TabsTrigger>
                    <TabsTrigger value="api">{t.api}</TabsTrigger>
                </TabsList>

                {/* GENERAL SETTINGS */}
                <TabsContent value="general" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sliders className="h-5 w-5" />
                                {t.displayPrefs}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar' ? "تخصيص المظهر وتوطين الواجهة." : "Customize visual appearance and localization."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Language Selection */}
                            <div className="flex items-center justify-between space-x-2">
                                <Label className="flex flex-col space-y-1">
                                    <span>{t.language}</span>
                                    <span className="font-normal text-xs text-muted-foreground">
                                        {language === 'ar' ? "اختر لغة الواجهة." : "Choose interface language."}
                                    </span>
                                </Label>
                                <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select Language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">🇺🇸 English</SelectItem>
                                        <SelectItem value="ar">🇾🇪 العربية</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator />

                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                                    <span>{t.darkMode}</span>
                                    <span className="font-normal text-xs text-muted-foreground">
                                        {language === 'ar' ? "التبديل بين الوضع الفاتح والداكن." : "Toggle between light and dark themes."}
                                    </span>
                                </Label>
                                <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="animations" className="flex flex-col space-y-1">
                                    <span>{t.animations}</span>
                                    <span className="font-normal text-xs text-muted-foreground">
                                        {language === 'ar' ? "تفعيل حركات الانتقال السلسة." : "Enable smooth transition animations."}
                                    </span>
                                </Label>
                                <Switch id="animations" checked={animations} onCheckedChange={setAnimations} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* NOTIFICATIONS */}
                <TabsContent value="notifications" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                {t.alerts}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar' ? "إعداد قنوات التنبيه." : "Configure notification channels."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="email-alerts" className="flex flex-col space-y-1">
                                    <span>Email Notifications</span>
                                    <span className="font-normal text-xs text-muted-foreground">
                                        {language === 'ar' ? "استلام ملخصات يومية عبر البريد." : "Receive daily summaries via email."}
                                    </span>
                                </Label>
                                <Switch id="email-alerts" checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="push-notifs" className="flex flex-col space-y-1">
                                    <span>Push Notifications</span>
                                    <span className="font-normal text-xs text-muted-foreground">
                                        {language === 'ar' ? "تنبيهات فورية للمخاطر العالية." : "Real-time browser notifications for urgent risks."}
                                    </span>
                                </Label>
                                <Switch id="push-notifs" checked={pushNotifs} onCheckedChange={setPushNotifs} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SECURITY */}
                <TabsContent value="security" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                {t.security}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar' ? "إدارة الوصول والمصادقة." : "Manage access controls and authentication."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="current-role">Current User Role</Label>
                                <Input id="current-role" value="Administrator" disabled readOnly className="bg-muted" />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="2fa" className="flex flex-col space-y-1">
                                    <span>Two-Factor Authentication</span>
                                    <span className="font-normal text-xs text-muted-foreground">
                                        {language === 'ar' ? "تأمين الحساب بمصادقة ثنائية." : "Secure your account with an additional confirmation step."}
                                    </span>
                                </Label>
                                <Switch id="2fa" checked={twoFactor} onCheckedChange={setTwoFactor} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* API */}
                <TabsContent value="api" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                {t.api}
                            </CardTitle>
                            <CardDescription>
                                {language === 'ar' ? "إدارة مفاتيح الربط الخارجي." : "Manage API keys for external data sources."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="api-key">Sentinel API Key</Label>
                                <div className="relative">
                                    <Input
                                        id="api-key"
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {language === 'ar' ? "لا تشارك هذا المفتاح مع أي شخص." : "Keep this key secret. Do not share it in client-side code."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
