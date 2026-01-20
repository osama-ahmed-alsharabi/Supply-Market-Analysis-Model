export const translations = {
    en: {
        // Sidebar
        dashboard: "Dashboard",
        dashboardOverview: "Dashboard Overview",
        supplyChain: "Supply Chain",
        reports: "Reports",
        dataConnectors: "Data Connectors",
        settings: "Settings",
        helpDocs: "Help & Docs",
        userProfile: "User Profile",
        admin: "Administrator",

        // Common
        loading: "Loading...",
        save: "Save Changes",
        cancel: "Cancel",
        search: "Search...",
        refresh: "Refresh",
        status: "Status",
        date: "Date",

        // Dashboard
        runPrediction: "Run Prediction",
        generating: "Generating...",
        riskAssessment: "Risk Assessment",
        predictionResults: "Prediction Results",

        // Reports
        reportsCenter: "Reports Center",
        reportsDesc: "Access and download generated intelligence reports.",
        generateReport: "Generate New Report",
        totalReports: "Total Reports",
        pdfDocs: "PDF Documents",
        generatedReports: "Generated Reports",
        reportName: "Report Name",
        type: "Type",
        size: "Size",
        action: "Action",
        noReports: "No system reports generated yet",

        // Data Sources
        dataSources: "Data Sources",
        dataDesc: "Manage and monitor external data connections.",
        ingestionVolume: "Ingestion Volume",
        connectionLogs: "Connection Logs",

        // Help
        helpCenter: "Help & Documentation",
        helpDesc: "Guides, FAQs, and support resources.",
        faq: "Frequently Asked Questions",
        contactSupport: "Contact Support",
        subject: "Subject",
        message: "Message",
        send: "Send Message",

        // Settings
        systemSettings: "System Settings",
        settingsDesc: "Manage your dashboard preferences and system configuration.",
        general: "General",
        alerts: "Alerts",
        security: "Security",
        api: "API",
        displayPrefs: "Display Preferences",
        darkMode: "Dark Mode",
        language: "System Language",
        animations: "Enable Animations",
        discard: "Discard"
    },
    ar: {
        // Sidebar
        dashboard: "لوحة القيادة",
        dashboardOverview: "نظرة عامة",
        supplyChain: "سلاسل الإمداد",
        reports: "التقارير",
        dataConnectors: "مصادر البيانات",
        settings: "الإعدادات",
        helpDocs: "المساعدة",
        userProfile: "ملف المستخدم",
        admin: "مشرف النظام",

        // Common
        loading: "جاري التحميل...",
        save: "حفظ التغييرات",
        cancel: "إلغاء",
        search: "بحث...",
        refresh: "تحديث",
        status: "الحالة",
        date: "التاريخ",

        // Dashboard
        runPrediction: "تشغيل التنبؤ",
        generating: "جاري المعالجة...",
        riskAssessment: "تقييم المخاطر",
        predictionResults: "نتائج التنبؤ",

        // Reports
        reportsCenter: "مركز التقارير",
        reportsDesc: "الوصول إلى تقارير الاستخبارات وتحميلها.",
        generateReport: "توليد تقرير جديد",
        totalReports: "إجمالي التقارير",
        pdfDocs: "وثائق PDF",
        generatedReports: "التقارير المولدة",
        reportName: "اسم التقرير",
        type: "النوع",
        size: "الحجم",
        action: "إجراء",
        noReports: "لم يتم إنشاء تقارير بعد",

        // Data Sources
        dataSources: "مصادر البيانات",
        dataDesc: "إدارة ومراقبة اتصالات البيانات الخارجية.",
        ingestionVolume: "حجم البيانات",
        connectionLogs: "سجلات الاتصال",

        // Help
        helpCenter: "المساعدة والوثائق",
        helpDesc: "الأدلة، الأسئلة الشائعة، وموارد الدعم.",
        faq: "الأسئلة الشائعة",
        contactSupport: "اتصل بالدعم",
        subject: "الموضوع",
        message: "الرسالة",
        send: "إرسال الرسالة",

        // Settings
        systemSettings: "إعدادات النظام",
        settingsDesc: "إدارة تفضيلات اللوحة وتكوين النظام.",
        general: "عام",
        alerts: "التنبيهات",
        security: "الأمان",
        api: "الواجهة البرمجية",
        displayPrefs: "تفضيلات العرض",
        darkMode: "الوضع الليلي",
        language: "لغة النظام",
        animations: "تفعيل الحركات",
        discard: "تراجع"
    }
};

export type Language = 'en' | 'ar';
export const useTranslation = (lang: Language) => translations[lang];
