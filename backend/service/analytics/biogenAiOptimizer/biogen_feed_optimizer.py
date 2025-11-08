import pandas as pd
import numpy as np
import joblib
from scipy.optimize import minimize
import json
import os

from service.analytics.preprocessdata import get_methanol_kpi_dataframe

# مسیر جاری فایل
DIR = os.path.dirname(__file__)

# بارگذاری مدل و scalerها
BIOGEN_MODEL = joblib.load(os.path.join(DIR, 'symbolic_model_meoh.pkl'))
SCALER_X = joblib.load(os.path.join(DIR, 'symbolic_model_meoh_scaler_X.pkl'))
SCALER_Y = joblib.load(os.path.join(DIR, 'symbolic_model_meoh_scaler_y.pkl'))
BOUNDS = joblib.load(os.path.join(DIR, 'symbolic_model_meoh_bounds.pkl'))

# bounds روی X_scaled
lowers = np.array(BOUNDS['min'], dtype=float).flatten()
uppers = np.array(BOUNDS['max'], dtype=float).flatten()
bounds_scaled = [(l, u) for l, u in zip(lowers, uppers)]

# محدوده ratio و yield برای Methanol
RATIO_CH4_MIN, RATIO_CH4_MAX = 0.50, 0.65
RATIO_O2_MIN, RATIO_O2_MAX = 0.50, 0.60
OVERALL_YIELD_MIN, OVERALL_YIELD_MAX = 0.70, 0.94

# ===============================
# تابع optimization اصلی
# ===============================
def get_biogen_optimized_feeds_dataframe():
    df = get_methanol_kpi_dataframe()

    # حذف ردیف‌هایی که NaN یا صفر دارند
    df = df.dropna(subset=['product_output_ton', 'feed_consumed_o2_ton', 'feed_consumed_ng_ton'])
    df = df[(df['product_output_ton'] > 0) & (df['feed_consumed_o2_ton'] > 0) & (df['feed_consumed_ng_ton'] > 0)].copy()

    results = []

    for _, row in df.iterrows():
        target = row['product_output_ton']
        actual_o2 = row['feed_consumed_o2_ton']
        actual_ng = row['feed_consumed_ng_ton']
        date = row['date']

        # نقطه شروع optimization: میانگین bounds
        x0_scaled = np.array([ (l+u)/2 for l,u in bounds_scaled ])

        # تابع هدف با penalties
        def objective(x_scaled):
            x_scaled = np.atleast_2d(x_scaled)
            pred_scaled = BIOGEN_MODEL.predict(x_scaled)[0]
            pred_orig = SCALER_Y.inverse_transform([[pred_scaled]])[0,0]
            feeds = SCALER_X.inverse_transform(x_scaled)[0]

            ratio_CH4 = feeds[1] / pred_orig if pred_orig > 0 else 0
            ratio_O2 = feeds[0] / pred_orig if pred_orig > 0 else 0
            overall_yield = pred_orig / feeds.sum() if feeds.sum() > 0 else 0

            penalty = 0
            if not (RATIO_CH4_MIN <= ratio_CH4 <= RATIO_CH4_MAX):
                penalty += 10 * abs(ratio_CH4 - (RATIO_CH4_MIN + RATIO_CH4_MAX)/2)
            if not (RATIO_O2_MIN <= ratio_O2 <= RATIO_O2_MAX):
                penalty += 10 * abs(ratio_O2 - (RATIO_O2_MIN + RATIO_O2_MAX)/2)
            if not (OVERALL_YIELD_MIN <= overall_yield <= OVERALL_YIELD_MAX):
                penalty += 10 * abs(overall_yield - (OVERALL_YIELD_MIN + OVERALL_YIELD_MAX)/2)

            return (pred_scaled - SCALER_Y.transform([[target]])[0,0])**2 + penalty

        # optimization با L-BFGS-B روی X_scaled
        res = minimize(objective, x0_scaled, method='L-BFGS-B', bounds=bounds_scaled)

        # تبدیل به مقیاس اصلی
        opt_feeds = SCALER_X.inverse_transform(res.x.reshape(1,-1))[0]
        opt_o2, opt_ng = np.maximum(0.0, opt_feeds)
        pred_final = SCALER_Y.inverse_transform(BIOGEN_MODEL.predict(res.x.reshape(1,-1)).reshape(-1,1))[0,0]

        saved_o2 = actual_o2 - opt_o2
        saved_ng = actual_ng - opt_ng

        results.append({
            "date": date.strftime('%Y-%m-%d') if hasattr(date,'strftime') else str(date),
            "actual_production_ton": round(target,2),
            "actual_o2_ton": round(actual_o2,2),
            "actual_ng_ton": round(actual_ng,2),
            "optimal_o2_ton": round(opt_o2,2),
            "optimal_ng_ton": round(opt_ng,2),
            "saved_o2_ton": round(saved_o2,2),
            "saved_ng_ton": round(saved_ng,2),
            "total_savings_ton": round(saved_o2 + saved_ng,2),
            "biogen_predicted_ton": round(pred_final,2),
            "optimization_success": res.success,
            "final_error_ton": round(abs(pred_final - target),2)
        })

    result_df = pd.DataFrame(results).sort_values('date')
    return json.loads(result_df.to_json(orient="records", force_ascii=False))
