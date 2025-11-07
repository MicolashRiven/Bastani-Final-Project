import json
from sqlalchemy import text
import pandas as pd
from core.dbconfig import getDBconfig

engine = getDBconfig()

def getAllSensorDataList(complex_id: int = None):
    with engine.begin() as conn:
        query = """
        SELECT
            sd.id as sensor_data_id,
            sd.timestamp,
            c.id as complex_id,
            c.name as complex_name,
            eq.id as equipment_id,
            eq.name as equipment_name,
            eqc.name as equipment_class,
            eqt.name as equipment_type,
            p.id as parameter_id,
            p.name as parameter_name,
            su.symbol as sensor_unit_symbol,
            su.name as sensor_unit_name,
            sd.value as sensor_value,
            sd.status as sensor_status,
            l.id as license_id,
            l.name as license_name
        FROM operation.sensor_data sd
        LEFT JOIN basic.complex c on sd.complex_id = c.id
        LEFT JOIN general.equipment eq on sd.equipment_id = eq.id
        LEFT JOIN general.equipment_class eqc on eq.class_id = eqc.id
        LEFT JOIN general.equipment_type eqt on eq.type_id = eqt.id
        LEFT JOIN general.parameter p on sd.parameter_id = p.id
        LEFT JOIN general.units su on sd.unit_id = su.id
        LEFT JOIN (
            SELECT DISTINCT ON (complex_id)
                complex_id,
                license_id
            FROM basic.complex_license
        ) as cl on c.id = cl.complex_id
        LEFT JOIN general.license as l on cl.license_id = l.id
        WHERE 1=1
        """

        params = {}
        if complex_id is not None:
            query += " AND c.id = :complex_id"
            params["complex_id"] = complex_id

        query += " ORDER BY sd.id"

        df = pd.read_sql(text(query), conn, params=params)

    return df