"""
وحدة التحليل الذكي
تحليل وتوصيات استراتيجية باستخدام ChatGPT
"""

import openai
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
import json


class AIAnalyzer:
    """محلل الذكاء الاصطناعي للتوصيات الاستراتيجية"""
    
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"
        
    def _create_system_prompt(self) -> str:
        """إنشاء برومبت النظام"""
        return """أنت خبير استراتيجي متخصص في تحليل سلاسل الإمداد والأسواق العالمية للسلع الأساسية (القمح، السكر، الزيت).

مهمتك:
1. تحليل بيانات التنبؤات والإنذارات المقدمة
2. تقديم توصيات استراتيجية لاتخاذ القرار قبل وقوع الأزمات
3. تحديد المخاطر المحتملة وتصنيفها حسب الأولوية
4. اقتراح خطط عمل وقائية ملموسة

قواعد الاستجابة:
- استخدم لغة مهنية واضحة
- قدم توصيات قابلة للتنفيذ
- اذكر الأولويات بوضوح (عالي/متوسط/منخفض)
- استخدم الأرقام والنسب لدعم تحليلك
- قدم جدول زمني للتنفيذ حيث أمكن

أنت تعمل لصالح مجموعة هائل سعيد، إحدى أكبر الشركات التجارية في اليمن والمنطقة.

التنسيق المطلوب للاستجابة:
1. **ملخص تنفيذي** (فقرة واحدة)
2. **تحليل المخاطر** (قائمة مرقمة)
3. **التوصيات الاستراتيجية** (قائمة مرقمة مع الأولوية)
4. **خطة العمل** (جدول زمني)
5. **مؤشرات المتابعة** (KPIs)"""

    def _prepare_data_summary(self, predictions_df: pd.DataFrame) -> str:
        """
        تحضير ملخص البيانات للتحليل
        Prepare data summary for analysis
        """
        summary = []
        
        # إحصائيات عامة
        total_records = len(predictions_df)
        
        # تحليل حسب السلعة
        commodities = predictions_df.groupby('ID_Commodity').agg({
            'Predicted_Landed_Cost': ['mean', 'min', 'max', 'std'],
            'Supply_Alert_Level': lambda x: x.value_counts().to_dict()
        }).round(2)
        
        summary.append(f"📊 إجمالي السجلات: {total_records}")
        summary.append(f"\n📈 تحليل التكاليف حسب السلعة:")
        
        for commodity in predictions_df['ID_Commodity'].unique():
            commodity_data = predictions_df[predictions_df['ID_Commodity'] == commodity]
            avg_cost = commodity_data['Predicted_Landed_Cost'].mean()
            max_cost = commodity_data['Predicted_Landed_Cost'].max()
            min_cost = commodity_data['Predicted_Landed_Cost'].min()
            
            # حساب توزيع الإنذارات
            alert_dist = commodity_data['Supply_Alert_Level'].value_counts()
            high_alerts = alert_dist.get('High', 0)
            med_alerts = alert_dist.get('Med', 0)
            low_alerts = alert_dist.get('Low', 0)
            
            summary.append(f"\n{commodity.upper()}:")
            summary.append(f"  • متوسط التكلفة: ${avg_cost:,.0f}/طن")
            summary.append(f"  • نطاق التكاليف: ${min_cost:,.0f} - ${max_cost:,.0f}")
            summary.append(f"  • إنذارات عالية: {high_alerts} ({high_alerts/len(commodity_data)*100:.1f}%)")
            summary.append(f"  • إنذارات متوسطة: {med_alerts}")
            summary.append(f"  • إنذارات منخفضة: {low_alerts}")
        
        # تحليل الإنذارات العالية
        high_alert_records = predictions_df[predictions_df['Supply_Alert_Level'] == 'High']
        if len(high_alert_records) > 0:
            summary.append(f"\n🚨 سجلات الإنذار العالي ({len(high_alert_records)}):")
            for _, row in high_alert_records.head(5).iterrows():
                summary.append(f"  • {row['Date']} - {row['ID_Commodity']}: ${row['Predicted_Landed_Cost']:,.0f}")
        
        # العوامل الرئيسية
        if 'Driver_Cost_Key' in predictions_df.columns:
            top_drivers = predictions_df['Driver_Cost_Key'].value_counts().head(3)
            summary.append(f"\n🔑 أهم العوامل المؤثرة:")
            for driver, count in top_drivers.items():
                summary.append(f"  • {driver}: {count} مرة")
        
        return "\n".join(summary)
    
    def analyze_predictions(self, predictions_df: pd.DataFrame, 
                           commodity_filter: Optional[str] = None) -> Dict:
        """
        تحليل التنبؤات وتقديم توصيات
        Analyze predictions and provide recommendations
        
        Parameters:
        -----------
        predictions_df : pd.DataFrame
            بيانات التنبؤات
        commodity_filter : str, optional
            فلترة حسب سلعة محددة
            
        Returns:
        --------
        Dict
            التحليل والتوصيات
        """
        # تطبيق الفلتر إذا وجد
        if commodity_filter:
            predictions_df = predictions_df[
                predictions_df['ID_Commodity'] == commodity_filter
            ]
        
        # تحضير الملخص
        data_summary = self._prepare_data_summary(predictions_df)
        
        # إنشاء المحادثة
        messages = [
            {"role": "system", "content": self._create_system_prompt()},
            {"role": "user", "content": f"""قم بتحليل البيانات التالية وتقديم توصيات استراتيجية:

{data_summary}

المطلوب:
1. تحليل شامل للوضع الحالي
2. تحديد المخاطر المحتملة خلال الفترة القادمة
3. توصيات استراتيجية للشراء والتخزين
4. خطة عمل وقائية لتجنب الأزمات
5. مؤشرات أداء للمتابعة"""}
        ]
        
        try:
            # استدعاء API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=2000,
                temperature=0.7
            )
            
            analysis_text = response.choices[0].message.content
            
            return {
                "success": True,
                "analysis": analysis_text,
                "data_summary": data_summary,
                "tokens_used": response.usage.total_tokens if response.usage else 0
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "data_summary": data_summary
            }
    
    def get_quick_recommendations(self, predictions_df: pd.DataFrame) -> Dict:
        """
        توصيات سريعة بناءً على البيانات
        Quick recommendations based on data
        """
        recommendations = []
        priority_actions = []
        
        # تحليل الإنذارات العالية
        high_alerts = predictions_df[predictions_df['Supply_Alert_Level'] == 'High']
        high_ratio = len(high_alerts) / len(predictions_df) * 100 if len(predictions_df) > 0 else 0
        
        if high_ratio > 30:
            recommendations.append({
                "type": "critical",
                "title": "⚠️ مستوى خطر مرتفع",
                "description": f"{high_ratio:.1f}% من التوقعات تشير لإنذارات عالية",
                "action": "يجب اتخاذ إجراءات فورية للتحوط"
            })
            priority_actions.append("زيادة المخزون الاستراتيجي")
            priority_actions.append("التفاوض على عقود طويلة الأجل")
        
        # تحليل كل سلعة
        for commodity in predictions_df['ID_Commodity'].unique():
            commodity_data = predictions_df[predictions_df['ID_Commodity'] == commodity]
            avg_cost = commodity_data['Predicted_Landed_Cost'].mean()
            max_cost = commodity_data['Predicted_Landed_Cost'].max()
            
            # حساب التقلب
            if len(commodity_data) > 1:
                volatility = commodity_data['Predicted_Landed_Cost'].std() / avg_cost * 100
                
                if volatility > 20:
                    recommendations.append({
                        "type": "warning",
                        "title": f"📊 تقلب عالي في {commodity}",
                        "description": f"نسبة التقلب: {volatility:.1f}%",
                        "action": f"التحوط بعقود آجلة لـ {commodity}"
                    })
            
            # فحص الإنذارات العالية للسلعة
            high_alerts_commodity = commodity_data[commodity_data['Supply_Alert_Level'] == 'High']
            if len(high_alerts_commodity) > 0:
                recommendations.append({
                    "type": "alert",
                    "title": f"🚨 إنذار لـ {commodity.upper()}",
                    "description": f"{len(high_alerts_commodity)} إنذار عالي في الفترة",
                    "action": "مراجعة خطة الشراء"
                })
        
        return {
            "recommendations": recommendations,
            "priority_actions": priority_actions,
            "summary": {
                "total_predictions": len(predictions_df),
                "high_alerts": len(high_alerts),
                "high_ratio": high_ratio
            }
        }
    
    def generate_crisis_prevention_plan(self, predictions_df: pd.DataFrame) -> str:
        """
        توليد خطة منع الأزمات
        Generate crisis prevention plan
        """
        data_summary = self._prepare_data_summary(predictions_df)
        
        messages = [
            {"role": "system", "content": self._create_system_prompt()},
            {"role": "user", "content": f"""بناءً على البيانات التالية، قم بإعداد خطة شاملة لمنع الأزمات:

{data_summary}

المطلوب:
1. تحديد السيناريوهات المحتملة (أفضل - متوسط - أسوأ)
2. خطة طوارئ لكل سيناريو
3. إجراءات وقائية فورية
4. مؤشرات إنذار مبكر
5. توزيع المسؤوليات

أعد خطة منع أزمات شاملة وقابلة للتنفيذ."""}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=2500,
                temperature=0.6
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"خطأ في توليد الخطة: {str(e)}"


def create_ai_analyzer(api_key: str) -> AIAnalyzer:
    """
    إنشاء محلل AI
    Create AI analyzer instance
    """
    return AIAnalyzer(api_key)


if __name__ == "__main__":
    print("=" * 60)
    print("وحدة التحليل الذكي - AI Analyzer Module")
    print("=" * 60)
    print("\n[OK] Module loaded successfully")
    print("  استخدم create_ai_analyzer(api_key) لإنشاء محلل")
