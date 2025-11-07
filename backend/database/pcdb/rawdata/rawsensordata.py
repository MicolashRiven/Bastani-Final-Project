import json
from sqlalchemy import text
import pandas as pd
from core.dbconfig import getDBconfig

engine = getDBconfig()

def getAllSensorDataList(complex_id: int = None):
    with engine.begin() as conn:
        query = """
        SELECT
            sd.id AS sensor_data_id,
            sd.timestamp,
            c.id AS complex_id,
            c.name AS complex_name,
            eq.id AS equipment_id,
            eq.name AS equipment_name,
            eqc.name AS equipment_class,
            eqt.name AS equipment_type,
            p.id AS parameter_id,
            p.name AS parameter_name,
            su.symbol AS sensor_unit_symbol,
            su.name AS sensor_unit_name,
            sd.value AS sensor_value,
            sd.status AS sensor_status,
            l.id AS license_id,
            l.name AS license_name,
            COALESCE(fc.line_number, pc.line_number) AS line_number
        FROM operation.sensor_data sd
        LEFT JOIN basic.complex c ON sd.complex_id = c.id
        LEFT JOIN general.equipment eq ON sd.equipment_id = eq.id
        LEFT JOIN general.equipment_class eqc ON eq.class_id = eqc.id
        LEFT JOIN general.equipment_type eqt ON eq.type_id = eqt.id
        LEFT JOIN general.parameter p ON sd.parameter_id = p.id
        LEFT JOIN general.units su ON sd.unit_id = su.id
        LEFT JOIN (
            SELECT DISTINCT ON (complex_id)
                complex_id,
                license_id
            FROM basic.complex_license
        ) AS cl ON c.id = cl.complex_id
        LEFT JOIN general.license AS l ON cl.license_id = l.id
        LEFT JOIN (
            SELECT DISTINCT ON (complex_id)
                id,
                complex_id,
                line_number
            FROM basic.feed_complex
            ORDER BY complex_id
        ) AS fc ON sd.complex_id = fc.complex_id
        LEFT JOIN (
            SELECT DISTINCT ON (complex_id)
                id,
                complex_id,
                line_number
            FROM basic.production_complex
            ORDER BY complex_id
        ) AS pc ON sd.complex_id = pc.complex_id
        """

        # ✅ در اینجا شرط WHERE اضافه می‌شود (نه بعد از ORDER BY)
        params = {}
        if complex_id is not None:
            query += " WHERE c.id = :complex_id"
            params["complex_id"] = complex_id

        # ✅ و در آخر ORDER BY قرار می‌گیرد
        query += " ORDER BY sd.id"

        df = pd.read_sql(text(query), conn, params=params)

    return df
