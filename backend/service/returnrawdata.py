import json

from database.pcdb.rawdata import getAllComplexesList



def getrawdataJson(complex_id=None, material_id=None):

    df = getAllComplexesList(complex_id=complex_id, material_id=material_id)

    data = df.to_json(orient="records")

    return json.loads(data)  
