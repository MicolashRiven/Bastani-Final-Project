from database.pcdb.rawdata import getAllComplexesList

def getrawdataJson():




    json = getAllComplexesList().to_json(orient="records")




    return json
