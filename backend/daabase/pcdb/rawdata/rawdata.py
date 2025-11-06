from sqlalchemy import text
import pandas as pd
from ....core.dbconfig import getDBconfig

engine = getDBconfig()

def getAllComplexesList():
    with engine.begin() as conn:
        conn.execute(text("""
            DROP TABLE IF EXISTS temp_petrochemicalinfo;

                );
        """))


        query = "SELECT * FROM temp_petrochemicalinfo;"
        df = pd.read_sql(text(query), conn)

    return df
