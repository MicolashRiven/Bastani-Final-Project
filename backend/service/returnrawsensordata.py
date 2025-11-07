import json

from database.pcdb.rawdata import getAllSensorDataList



def getrawsensordataJson(complex_id: int = None):

    data = getAllSensorDataList(complex_id=complex_id).to_json(orient="records")  

    return json.loads(data)