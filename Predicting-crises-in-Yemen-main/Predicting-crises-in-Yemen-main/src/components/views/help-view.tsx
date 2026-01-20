'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Book, FileQuestion, MessageCircle, ExternalLink, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardContext } from '@/components/dashboard-client-extended';

export function HelpDocView() {
    const { toast } = useToast();
    const { language, t } = React.useContext(DashboardContext);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate sending
        setTimeout(() => {
            setIsSubmitting(false);
            toast({
                title: language === 'ar' ? "تم إرسال الرسالة" : "Message Sent",
                description: language === 'ar' ? "استلم فريق الدعم استفسارك. تذكرة رقم #9921." : "Support team has received your inquiry. Ticket #9921 created.",
            });
        }, 1200);
    };

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t.helpDocs}</h2>
                    <p className="text-muted-foreground">{language === 'ar' ? "الأدلة، الأسئلة الشائعة، وموارد الدعم." : "Guides, FAQs, and support resources."}</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    {language === 'ar' ? "زيارة قاعدة المعرفة" : "Visit Knowledge Base"}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column: FAQs and Guides */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileQuestion className="h-5 w-5" />
                                {language === 'ar' ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger className="text-start">{language === 'ar' ? "كيف يتم حساب درجة المخاطر؟" : "How is the risk score calculated?"}</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-start">
                                        {language === 'ar'
                                            ? "درجة المخاطر هي مقياس مركب مشتق من مدخلات البيانات في الوقت الفعلي بما في ذلك أنماط الطقس ومؤشرات الاستقرار الجيوسياسي وتاريخ أداء الموردين."
                                            : "The risk score is a composite metric derived from real-time data inputs including weather patterns, geopolitical stability indices, and supplier performance history. Our AI model weighs these factors dynamically."}
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger className="text-start">{language === 'ar' ? "كم مرة يتم تحديث البيانات؟" : "How often is data updated?"}</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-start">
                                        {language === 'ar'
                                            ? "يتم تحديث تيارات البيانات الهامة مثل الطقس وحركة المرور كل 15 دقيقة. يتم تحديث التقارير المالية والاستقرار يومياً الساعة 00:00 بالتوقيت العالمي."
                                            : "Critical data streams like weather and traffic are updated every 15 minutes. Financial and stability reports are refreshed daily at 00:00 UTC."}
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger className="text-start">{language === 'ar' ? "هل يمكنني تصدير البيانات الخام؟" : "Can I export the raw data?"}</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-start">
                                        {language === 'ar'
                                            ? "نعم، انتقل إلى قسم التقارير لتحميل مجموعات بيانات شاملة بتنسيقات CSV أو JSON."
                                            : "Yes, navigate to the Reports section to download comprehensive datasets in CSV or JSON formats."}
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4">
                                    <AccordionTrigger className="text-start">{language === 'ar' ? "ماذا يفعل 'وضع سلسلة التوريد'؟" : "What does 'Supply Chain Mode' do?"}</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-start">
                                        {language === 'ar'
                                            ? "يقوم وضع سلسلة التوريد بتنشيط طبقات تصور متخصصة على الخريطة، تركز على طرق الخدمات اللوجستية وازدحام الموانئ ومواقع البائعين."
                                            : "Supply Chain Mode activates specialized visualization layers on the map, focusing on logistics routes, port congestion, and vendor locations, rather than general regional stability."}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Book className="h-5 w-5" />
                                {language === 'ar' ? "أدلة سريعة" : "Quick Guides"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <Button variant="ghost" className="justify-start h-auto py-3">
                                <div className={`text-${language === 'ar' ? 'right' : 'left'}`}>
                                    <div className="font-semibold">{language === 'ar' ? "البدء مع الوقاية" : "Getting Started with Prevention"}</div>
                                    <div className="text-xs text-muted-foreground">{language === 'ar' ? "قراءة 5 دقائق • أساسيات" : "5 min read • Basics"}</div>
                                </div>
                            </Button>
                            <Button variant="ghost" className="justify-start h-auto py-3">
                                <div className={`text-${language === 'ar' ? 'right' : 'left'}`}>
                                    <div className="font-semibold">{language === 'ar' ? "تفسير قيم SHAP" : "Interpreting SHAP Values"}</div>
                                    <div className="text-xs text-muted-foreground">{language === 'ar' ? "قراءة 10 دقائق • متقدم" : "10 min read • Advanced"}</div>
                                </div>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Contact Support */}
                <div className="space-y-6">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                {language === 'ar' ? "تواصل مع الدعم" : "Contact Support"}
                            </CardTitle>
                            <CardDescription>{language === 'ar' ? "تحتاج مساعدة؟ تواصل مع فريقنا." : "Need personalized assistance? Reach out to our team."}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleContactSubmit} className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{language === 'ar' ? "الموضوع" : "Subject"}</label>
                                    <Input placeholder={language === 'ar' ? "مثال: مشكلة في التكامل" : "e.g., API Integration Issue"} required className="bg-background" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{language === 'ar' ? "الرسالة" : "Message"}</label>
                                    <Textarea
                                        placeholder={language === 'ar' ? "اشرح مشكلتك بالتفصيل..." : "Describe your issue in detail..."}
                                        className="min-h-[120px] bg-background"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting
                                        ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                                        : (language === 'ar' ? 'إرسال الرسالة' : 'Send Message')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{language === 'ar' ? "أرقام مباشرة" : "Direct Lines"}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-full">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{language === 'ar' ? "البريد الإلكتروني" : "Email Support"}</div>
                                    <div className="text-xs text-muted-foreground">support@sentineldashboard.com</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-full">
                                    <Phone className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{language === 'ar' ? "خط الطوارئ" : "Emergency Hotline"}</div>
                                    <div className="text-xs text-muted-foreground">+1 (800) 555-0199</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
