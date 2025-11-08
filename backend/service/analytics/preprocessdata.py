# service/analytics/preprocessdata.py

import pandas as pd
from database.pcdb.rawdata import getAllComplexesList

O2_MMSCM_TO_TON = 1429.0
CH4_SCM_TO_TON = 0.000716

def get_methanol_kpi_dataframe():

    df = getAllComplexesList()
    df = df[df["product_material_name"] == "Methanol"].copy()

    df = df[[
        "measurement_date",
        "parameter_name",
        "measured_value",
        "feed_material_name",
        "product_material_name"
    ]]

    df = df.sort_values("measurement_date").reset_index(drop=True)

    grouped_rows = []
    for i in range(0, len(df), 4):
        subset = df.iloc[i:i+4]
        if subset.empty:
            continue

        date = subset["measurement_date"].iloc[0]

        values = {
            "date": date,
            "feed_consumed_ng": None,
            "feed_consumed_o2": None,
            "feed_fuel": None,
            "product_output": None,
        }

        for _, row in subset.iterrows():
            param = row["parameter_name"]
            feed = row["feed_material_name"]

            if param == "feed_consumed" and feed == "Natural Gas":
                values["feed_consumed_ng"] = row["measured_value"]
            elif param == "feed_consumed" and feed == "Oxygen":
                values["feed_consumed_o2"] = row["measured_value"]
            elif param == "feed_fuel":
                values["feed_fuel"] = row["measured_value"]
            elif param == "product_output":
                values["product_output"] = row["measured_value"]

        grouped_rows.append(values)

    result_df = pd.DataFrame(grouped_rows)


    result_df["feed_consumed_ng_ton"] = result_df["feed_consumed_ng"].astype(float) * CH4_SCM_TO_TON
    result_df["feed_consumed_o2_ton"] = result_df["feed_consumed_o2"].astype(float) * O2_MMSCM_TO_TON
    result_df["feed_fuel_ton"] = result_df["feed_fuel"].astype(float) * CH4_SCM_TO_TON
    result_df["product_output_ton"] = result_df["product_output"].astype(float)

    return result_df

