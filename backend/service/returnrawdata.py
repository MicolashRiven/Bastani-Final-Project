import json

from database.pcdb.rawdata import getAllComplexesList



def getrawdataJson(complex_id=None, material_id=None):

    data = getAllComplexesList(complex_id, material_id).to_json(orient="records")  

    return json.loads(data)
