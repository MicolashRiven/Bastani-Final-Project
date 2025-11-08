import pandas as pd
import numpy as np
import joblib
import os
from service.analytics.preprocessdata import get_methanol_kpi_dataframe
from scipy.optimize import differential_evolution
import json

DIR = os.path.dirname(__file__)

BIOGEN_MODEL = joblib.load(os.path.join(DIR, 'symbolic_model_meoh.pkl'))
SCALER_X = joblib.load(os.path.join(DIR, 'symbolic_model_meoh_scaler_X.pkl'))
SCALER_Y = joblib.load(os.path.join(DIR, 'symbolic_model_meoh_scaler_y.pkl'))
BOUNDS = joblib.load(os.path.join(DIR, 'symbolic_model_meoh_bounds.pkl'))

lowers = np.array(BOUNDS['min'], dtype=float).flatten()
uppers = np.array(BOUNDS['max'], dtype=float).flatten()
bounds = [(min(l, u), max(l, u)) for l, u in zip(lowers, uppers)]
is_scaled = all(abs(b[0]) < 10 and abs(b[1]) < 10 for b in bounds)

def get_biogen_optimized_feeds_dataframe():
    df = get_methanol_kpi_dataframe()
    df = df.dropna(subset=['product_output_ton', 'feed_consumed_o2_ton', 'feed_consumed_ng_ton'])
    df = df[df['product_output_ton'] > 1000].copy()

    results = []

    for _, row in df.iterrows():
        target = row['product_output_ton']
        actual_o2 = row['feed_consumed_o2_ton']
        actual_ng = row['feed_consumed_ng_ton']
        date = row['date']

        def objective(x):
            x_arr = np.array(x).reshape(1, -1)
            x_in = SCALER_X.transform(x_arr) if not is_scaled else x_arr
            pred = SCALER_Y.inverse_transform(BIOGEN_MODEL.predict(x_in).reshape(-1, 1))[0, 0]
            return (pred - target) ** 2

        res = differential_evolution(
            objective,
            bounds,
            seed=42,
            popsize=20,
            maxiter=120,
            tol=1.0,
            atol=10.0,
            strategy='best1bin',
            mutation=(0.5, 1.5),
            recombination=0.9,
            workers=1,
            polish=True
        )

        opt = SCALER_X.inverse_transform([res.x])[0] if is_scaled else res.x
        opt_o2, opt_ng = np.maximum(0.0, opt)

        pred_final = SCALER_Y.inverse_transform(
            BIOGEN_MODEL.predict(SCALER_X.transform([[opt_o2, opt_ng]])).reshape(-1, 1)
        )[0, 0]

        saved_o2 = actual_o2 - opt_o2
        saved_ng = actual_ng - opt_ng

        results.append({
            "date": date.strftime('%Y-%m-%d') if hasattr(date, 'strftime') else str(date),
            "actual_production_ton": round(target, 2),
            "actual_o2_ton": round(actual_o2, 2),
            "actual_ng_ton": round(actual_ng, 2),
            "optimal_o2_ton": round(opt_o2, 2),
            "optimal_ng_ton": round(opt_ng, 2),
            "saved_o2_ton": round(saved_o2, 2),
            "saved_ng_ton": round(saved_ng, 2),
            "total_savings_ton": round(saved_o2 + saved_ng, 2),
            "biogen_predicted_ton": round(pred_final, 2),
            "optimization_success": res.success,
            "final_error_ton": round(abs(pred_final - target), 2)
        })

    result_df = pd.DataFrame(results).sort_values('date')
    return json.loads(result_df.to_json(orient="records", force_ascii=False))