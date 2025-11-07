import json

from database.pcdb.rawdata import getAllComplexesList



def getrawdataJson():

    data = getAllComplexesList().to_json(orient="records")  

    return json.loads(data)
