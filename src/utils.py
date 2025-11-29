"""
Utility Functions - الدوال المساعدة
==============================================
دوال مساعدة للتقييم والتصور والحفظ
Helper functions for evaluation, visualization, and saving
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import warnings
warnings.filterwarnings('ignore')

# إعداد النمط - Set style
sns.set_style('whitegrid')
plt.rcParams['figure.figsize'] = (12, 6)
plt.rcParams['font.size'] = 10


def calculate_metrics(y_true, y_pred):
    """
    حساب مؤشرات الأداء - Calculate performance metrics
    
    Parameters:
    -----------
    y_true : array-like
        القيم الحقيقية - True values
    y_pred : array-like
        القيم المتوقعة - Predicted values
        
    Returns:
    --------
    dict
        قاموس يحتوي على جميع المؤشرات - Dictionary with all metrics
    """
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    
    # MAPE - Mean Absolute Percentage Error
    # نتجنب القسمة على صفر - Avoid division by zero
    mask = y_true != 0
    mape = np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
    
    return {
        'RMSE': rmse,
        'MAE': mae,
        'R2': r2,
        'MAPE': mape
    }


def print_metrics(metrics, title="Model Performance"):
    """
    طباعة المؤشرات بشكل منسق - Print metrics in formatted way
    
    Parameters:
    -----------
    metrics : dict
        المؤشرات - Metrics
    title : str
        العنوان - Title
    """
    print("\n" + "=" * 60)
    print(f"{title} - أداء النموذج")
    print("=" * 60)
    print(f"RMSE (Root Mean Squared Error): {metrics['RMSE']:.2f}")
    print(f"MAE (Mean Absolute Error):      {metrics['MAE']:.2f}")
    print(f"MAPE (Mean Absolute % Error):   {metrics['MAPE']:.2f}%")
    print(f"R² Score:                        {metrics['R2']:.4f}")
    print("=" * 60)


def plot_predictions(y_true, y_pred, title="Predictions vs Actual"):
    """
    رسم التوقعات مقابل القيم الحقيقية - Plot predictions vs actual
    
    Parameters:
    -----------
    y_true : array-like
        القيم الحقيقية - True values
    y_pred : array-like
        القيم المتوقعة - Predicted values
    title : str
        العنوان - Title
        
    Returns:
    --------
    matplotlib.figure.Figure
    """
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Scatter plot
    axes[0].scatter(y_true, y_pred, alpha=0.5, s=20)
    axes[0].plot([y_true.min(), y_true.max()], 
                 [y_true.min(), y_true.max()], 
                 'r--', lw=2, label='Perfect Prediction')
    axes[0].set_xlabel('القيم الحقيقية - Actual Values')
    axes[0].set_ylabel('القيم المتوقعة - Predicted Values')
    axes[0].set_title(f'{title}\nالتوقعات مقابل القيم الفعلية')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    
    # Residuals plot
    residuals = y_true - y_pred
    axes[1].scatter(y_pred, residuals, alpha=0.5, s=20)
    axes[1].axhline(y=0, color='r', linestyle='--', lw=2)
    axes[1].set_xlabel('القيم المتوقعة - Predicted Values')
    axes[1].set_ylabel('الأخطاء - Residuals')
    axes[1].set_title('توزيع الأخطاء - Residual Distribution')
    axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    return fig


def plot_feature_importance(importance_df, top_n=15, title="Feature Importance"):
    """
    رسم أهمية الميزات - Plot feature importance
    
    Parameters:
    -----------
    importance_df : pd.DataFrame
        جدول بأعمدة 'feature' و 'importance'
    top_n : int
        عدد الميزات الأكثر أهمية - Number of top features
    title : str
        العنوان - Title
        
    Returns:
    --------
    matplotlib.figure.Figure
    """
    # ترتيب حسب الأهمية - Sort by importance
    importance_df = importance_df.sort_values('importance', ascending=True).tail(top_n)
    
    fig, ax = plt.subplots(figsize=(10, 8))
    
    bars = ax.barh(range(len(importance_df)), importance_df['importance'])
    
    # تلوين الأعمدة - Color bars
    colors = plt.cm.viridis(np.linspace(0.3, 0.9, len(bars)))
    for bar, color in zip(bars, colors):
        bar.set_color(color)
    
    ax.set_yticks(range(len(importance_df)))
    ax.set_yticklabels(importance_df['feature'])
    ax.set_xlabel('الأهمية - Importance')
    ax.set_title(f'{title}\nأهمية الميزات')
    ax.grid(True, alpha=0.3, axis='x')
    
    plt.tight_layout()
    return fig


def plot_time_series(df, date_col='Date', value_col='Predicted_Landed_Cost', 
                     group_col='ID_Commodity', title="Time Series"):
    """
    رسم السلسلة الزمنية - Plot time series
    
    Parameters:
    -----------
    df : pd.DataFrame
        البيانات - Data
    date_col : str
        عمود التاريخ - Date column
    value_col : str
        عمود القيم - Value column
    group_col : str
        عمود التجميع - Grouping column
    title : str
        العنوان - Title
        
    Returns:
    --------
    matplotlib.figure.Figure
    """
    fig, ax = plt.subplots(figsize=(14, 6))
    
    # رسم لكل مجموعة - Plot for each group
    for group in df[group_col].unique():
        group_data = df[df[group_col] == group].sort_values(date_col)
        ax.plot(pd.to_datetime(group_data[date_col]), 
               group_data[value_col], 
               label=group, 
               alpha=0.7,
               linewidth=2)
    
    ax.set_xlabel('التاريخ - Date')
    ax.set_ylabel(value_col)
    ax.set_title(f'{title}\n{value_col} عبر الزمن')
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    return fig


def export_predictions(df, predictions, output_path='output/predictions.csv'):
    """
    تصدير التوقعات - Export predictions
    
    Parameters:
    -----------
    df : pd.DataFrame
        البيانات الأصلية - Original data
    predictions : dict
        القاموس يحتوي على: 'predicted_cost', 'alert_level', 'driver_cost_key'
    output_path : str
        مسار الحفظ - Save path
    """
    output_df = pd.DataFrame({
        'Date': df['Date'],
        'ID_Commodity': df['ID_Commodity'],
        'Predicted_Landed_Cost': predictions['predicted_cost'],
        'Supply_Alert_Level': predictions['alert_level'],
        'Driver_Cost_Key': predictions['driver_cost_key']
    })
    
    output_df.to_csv(output_path, index=False, encoding='utf-8-sig')
    print(f"\n✓ تم تصدير التوقعات إلى: {output_path}")
    print(f"  Predictions exported to: {output_path}")
    print(f"  عدد الصفوف - Rows: {len(output_df):,}")
    
    return output_df


def classify_alert_level(predicted_costs, commodity_groups, threshold_med=10, threshold_high=20):
    """
    تصنيف مستوى الإنذار - Classify alert level
    
    Parameters:
    -----------
    predicted_costs : array-like
        التكاليف المتوقعة - Predicted costs
    commodity_groups : array-like
        مجموعات السلع - Commodity groups
    threshold_med : float
        عتبة المتوسط (نسبة مئوية) - Medium threshold (percentage)
    threshold_high : float
        عتبة مرتفع (نسبة مئوية) - High threshold (percentage)
        
    Returns:
    --------
    array
        مستويات الإنذار - Alert levels
    """
    df_temp = pd.DataFrame({
        'cost': predicted_costs,
        'commodity': commodity_groups
    })
    
    # حساب المتوسط لكل سلعة - Calculate mean for each commodity
    avg_cost = df_temp.groupby('commodity')['cost'].transform('mean')
    
    # النسبة المئوية للزيادة - Percentage increase
    pct_increase = (df_temp['cost'] - avg_cost) / avg_cost * 100
    
    # التصنيف - Classification
    alert_levels = pd.cut(
        pct_increase,
        bins=[-np.inf, threshold_med, threshold_high, np.inf],
        labels=['Low', 'Med', 'High']
    )
    
    return alert_levels.values


def validate_data(df, required_columns):
    """
    التحقق من صحة البيانات - Validate data
    
    Parameters:
    -----------
    df : pd.DataFrame
        البيانات - Data
    required_columns : list
        الأعمدة المطلوبة - Required columns
        
    Returns:
    --------
    bool, str
        نجح التحقق؟ ورسالة - Success? and message
    """
    missing_cols = [col for col in required_columns if col not in df.columns]
    
    if missing_cols:
        return False, f"أعمدة مفقودة - Missing columns: {missing_cols}"
    
    # التحقق من القيم المفقودة - Check for missing values
    missing_counts = df[required_columns].isna().sum()
    if missing_counts.sum() > 0:
        print("\n⚠ تحذير - Warning: قيم مفقودة في - Missing values in:")
        for col, count in missing_counts[missing_counts > 0].items():
            print(f"  - {col}: {count} ({count/len(df)*100:.1f}%)")
    
    return True, "✓ البيانات صالحة - Data is valid"


def save_figure(fig, filename, dpi=300):
    """
    حفظ الرسم - Save figure
    
    Parameters:
    -----------
    fig : matplotlib.figure.Figure
        الرسم - Figure
    filename : str
        اسم الملف - Filename
    dpi : int
        الدقة - Resolution
    """
    fig.savefig(filename, dpi=dpi, bbox_inches='tight')
    print(f"✓ تم حفظ الرسم: {filename}")


if __name__ == "__main__":
    # اختبار الدوال المساعدة - Test utility functions
    print("=" * 60)
    print("اختبار الدوال المساعدة - Testing Utility Functions")
    print("=" * 60)
    
    # إنشاء بيانات اختبارية - Create sample data
    np.random.seed(42)
    y_true = np.random.randn(100) * 100 + 500
    y_pred = y_true + np.random.randn(100) * 20
    
    # حساب المؤشرات - Calculate metrics
    metrics = calculate_metrics(y_true, y_pred)
    print_metrics(metrics, "Test Model")
    
    # اختبار التصنيف - Test classification
    costs = np.array([500, 550, 600, 650, 700])
    commodities = np.array(['wheat', 'wheat', 'sugar', 'sugar', 'oil'])
    alerts = classify_alert_level(costs, commodities)
    print(f"\n✓ مستويات الإنذار - Alert levels: {alerts}")
