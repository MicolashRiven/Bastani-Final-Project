import pandas as pd
import numpy as np
from preprocessdata import get_methanol_kpi_dataframe


ENERGY_INTENSITY_MIN = 1.36
ENERGY_INTENSITY_MAX = 4.29
YIELD_LOW = 0.70
YIELD_HIGH = 0.94
M_CH4 = 16.04
M_O2 = 32.00
M_MEOH = 32.04


def calculate_methanol_kpi() -> pd.DataFrame:
   
    df = get_methanol_kpi_dataframe()


    df = df.copy()
    df["feed_ng"] = df["feed_consumed_ng_ton"].fillna(0)
    df["feed_o2"] = df["feed_consumed_o2_ton"].fillna(0)
    df["fuel"]    = df["feed_fuel_ton"].fillna(0)
    df["product"] = df["product_output_ton"].fillna(0)


    date_range = pd.date_range(start=df["date"].min(), end=df["date"].max(), freq="D")
    full_df = pd.DataFrame({"date": date_range})
    full_df = full_df.merge(df[["date", "feed_ng", "feed_o2", "fuel", "product"]], on="date", how="left")
    full_df.fillna({"feed_ng": 0, "feed_o2": 0, "fuel": 0, "product": 0}, inplace=True)


    f_total = full_df["feed_ng"] + full_df["feed_o2"]
    p_total = full_df["product"]


    yld = np.where(f_total == 0, 0.0, np.where(p_total == 0, 0.0, p_total / f_total))


    flag = np.select(
        [
            (f_total == 0) & (p_total == 0),
            (f_total > 0) & (p_total == 0),
            (f_total == 0) & (p_total > 0),
            yld < YIELD_LOW,
            yld > YIELD_HIGH
        ],
        [
            "No Report (No Data)",
            "Missing Product (Feed reported but no product)",
            "Missing Feed",
            "Out of range (Below 70%)",
            "Out of range (Above 94%)"
        ],
        default="OK"
    )


    ratio_ch4 = np.where(p_total == 0, None, full_df["feed_ng"] / p_total)
    ratio_o2  = np.where(p_total == 0, None, full_df["feed_o2"] / p_total)
    energy_int = np.where(p_total == 0, None, (full_df["fuel"] * 50000) / (p_total * 1000))
    energy_flag = np.where(energy_int < ENERGY_INTENSITY_MIN, "LOW",
                           np.where(energy_int > ENERGY_INTENSITY_MAX, "HIGH", "OK"))

    n_ch4 = full_df["feed_ng"] / M_CH4
    n_o2  = full_df["feed_o2"] / M_O2
    n_limiting = np.minimum(n_ch4, n_o2 * 2)
    limiting = np.where(n_ch4 < n_o2 * 2, "CH4", "O2")
    theoretical = n_limiting * M_MEOH

    n_excess = np.where(n_ch4 < n_o2 * 2,
                        n_o2 / 2 - n_ch4,
                        n_ch4 - n_o2 * 2)
    deviation_ton = n_excess * M_CH4
    deviation_pct = np.where(theoretical == 0, None, (deviation_ton / theoretical) * 100)
    efficiency = np.where(theoretical == 0, None, (p_total / theoretical) * 100)

    result = pd.DataFrame({
        "Date": full_df["date"].dt.strftime("%Y-%m-%d"),
        "Yield Methanol": [f"{y*100:.2f}%" if y > 0 else "Null" for y in yld],
        "Flag Methanol": flag.tolist(),
        "Ratio CH4 Methanol": [round(x, 3) if x is not None else None for x in ratio_ch4],
        "Ratio O2 Methanol": [round(x, 3) if x is not None else None for x in ratio_o2],
        "Energy Intensity Methanol": [round(x, 2) if x is not None else None for x in energy_int],
        "Energy Flag Methanol": energy_flag.tolist(),
        "Limiting Reagent Methanol": limiting.tolist(),
        "Theoretical Prod Ton Methanol": [round(x, 1) if x > 0 else None for x in theoretical],
        "Reagent Deviation Methanol": [round(x, 1) if abs(x) > 0.01 else 0 for x in deviation_ton],
        "Reagent Deviation Ratio Methanol": [f"{x:.2f}%" if x is not None else "Null" for x in deviation_pct],
        "Efficiency Methanol": [f"{x:.2f}%" if x is not None else "Null" for x in efficiency],
        "Reagent Flag Methanol": np.where(n_excess > 0, "Excess", "Deficient").tolist(),
    })

    return result