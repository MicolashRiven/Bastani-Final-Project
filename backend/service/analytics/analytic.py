





"""""""""""""""""""""""
import pandas as pd
from database.pcdb.rawdata import getAllComplexesList
from core.config_loader import load_all_license_constants, load_unit_conversions


def load_initial_analysis_data():
    df_measure = getAllComplexesList()
    df_measure = df_measure.dropna(subset=["complex_id", "material_id", "measured_value"])
    df_measure["measurement_date"] = pd.to_datetime(df_measure["measurement_date"])

    df_measure = df_measure[
        [
            "measurement_id",
            "measurement_date",
            "complex_id",
            "complex_name",
            "material_id",
            "material_name",
            "line_number",
            "parameter_id",
            "parameter_name",
            "measured_value",
            "units_symbol",
        ]
    ]

    df_constants = load_all_license_constants()
    df_conversions = load_unit_conversions()


    df_selected = select_first_day_rows(df_measure)

    return {
        "measurement_data": df_selected,
        "license_constants": df_constants,
        "unit_conversions": df_conversions,
    }


def select_first_day_rows(df_measure: pd.DataFrame) -> pd.DataFrame:
    


    df_day1 = df_measure.head(15)


    selection_rules = {
        ("CH3OH", 1): 4,
        ("NH3", 1): 3,
        ("CH3OH", (2, 1)): 4,
        ("CH3OH", (2, 2)): 4,
    }

    selected_rows = []

    for key, n_rows in selection_rules.items():
        material, complex_info = key

        if isinstance(complex_info, tuple):
            complex_id, line_number = complex_info
            df_sub = df_day1[
                (df_day1["complex_id"] == complex_id)
                & (df_day1["material_name"] == material)
                & (df_day1["line_number"] == line_number)
            ]
        else:
            complex_id = complex_info
            df_sub = df_day1[
                (df_day1["complex_id"] == complex_id)
                & (df_day1["material_name"] == material)
            ]

        selected_rows.append(df_sub.head(n_rows))

    return pd.concat(selected_rows, ignore_index=True)
"""""""""""""""""""""""
