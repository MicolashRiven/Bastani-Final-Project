import yaml
import pandas as pd
from pathlib import Path

CONFIG_PATH = Path(__file__).resolve().parent / "config.yaml"

def load_all_license_constants():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    all_constants = []
    for lic in data["licenses"]:
        const = lic["constants"]
        const["license_name"] = lic["name"]
        all_constants.append(const)
    return pd.DataFrame(all_constants)



def load_unit_conversions():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    conversions = []
    for conv_type, materials in data.get("unit_conversions", {}).items():
        for material, factor in materials.items():
            conversions.append({
                "conversion_type": conv_type,  
                "material": material,          
                "factor": factor              
            })
    return pd.DataFrame(conversions)