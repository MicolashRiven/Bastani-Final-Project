import json

from database.pcdb.rawdata import getAllSensorDataList



def getrawsensordataJson():

    data = getAllSensorDataList().to_json(orient="records")  

    return json.loads(data)