import pandas as pd
import numpy as np
import joblib
from datetime import datetime
from service.analytics.preprocessdata import get_methanol_kpi_dataframe
from scipy.optimize import differential_evolution
import json
import os 


print("BioGen Engine: Loading evolutionary model...")
DIR = os.path.dirname(__file__)

BIOGEN_MODEL = joblib.load(os.path.join(DIR, 'symbolic_model_meoh.pkl'))
SCALER_X = joblib.load(os.path.join(DIR, 'symbolic_model_meoh_scaler_X.pkl'))
SCALER_Y = joblib.load(os.path.join(DIR, 'symbolic_model_meoh_scaler_y.pkl'))
print(f"Formula discovered: {BIOGEN_MODEL._program}")

def get_biogen_optimized_feeds_dataframe() -> pd.DataFrame:
    df = get_methanol_kpi_dataframe()
    if df.empty:
        raise ValueError("No data.")
    df = df.dropna(subset=['product_output_ton', 'feed_consumed_o2_ton', 'feed_consumed_ng_ton']).copy()
    df = df[df['product_output_ton'] > 1000].copy()
    results = []
    o2_low, o2_high = df['feed_consumed_o2_ton'].quantile([0.02, 0.98])
    ng_low, ng_high = df['feed_consumed_ng_ton'].quantile([0.02, 0.98])
    bounds = [(o2_low, o2_high), (ng_low, ng_high)]
    print(f"Optimizing feed for {len(df)} days using BioGen...")
    for idx, row in df.iterrows():
        target = row['product_output_ton']
        actual_o2 = row['feed_consumed_o2_ton']
        actual_ng = row['feed_consumed_ng_ton']
        date = row['date']
        def objective(x):
            o2, ng = x
            X_scaled = SCALER_X.transform([[o2, ng]])
            pred_scaled = BIOGEN_MODEL.predict(X_scaled)[0]
            pred_ton = SCALER_Y.inverse_transform([[pred_scaled]])[0][0]
            return abs(pred_ton - target)
        res = differential_evolution(
            objective, bounds,
            seed=42, popsize=10, maxiter=50,
            tol=0.5, workers=1, disp=False
        )
        opt_o2, opt_ng = res.x
        X_opt = SCALER_X.transform([[opt_o2, opt_ng]])
        pred_opt = SCALER_Y.inverse_transform(
            BIOGEN_MODEL.predict(X_opt).reshape(-1, 1)
        ).flatten()[0]
        saved_o2 = actual_o2 - opt_o2
        saved_ng = actual_ng - opt_ng
        total_saved = saved_o2 + saved_ng
        results.append({
            "date": date.strftime('%Y-%m-%d') if hasattr(date, 'strftime') else str(date),
            "actual_production_ton": round(target, 2),
            "actual_o2_ton": round(actual_o2, 2),
            "actual_ng_ton": round(actual_ng, 2),
            "optimal_o2_ton": round(opt_o2, 2),
            "optimal_ng_ton": round(opt_ng, 2),
            "saved_o2_ton": round(saved_o2, 2),
            "saved_ng_ton": round(saved_ng, 2),
            "total_savings_ton": round(total_saved, 2),
            "biogen_predicted_ton": round(pred_opt, 2),
            "optimization_success": res.success
        })
    optimized_df = pd.DataFrame(results)
    optimized_df = optimized_df.sort_values('date')
    print(f"Optimization completed for {len(optimized_df)} days.")
    print(f"Average daily savings: {optimized_df['total_savings_ton'].mean():.2f} ton")


    # return optimized_df
    return json.loads(optimized_df.to_json(orient="records"))