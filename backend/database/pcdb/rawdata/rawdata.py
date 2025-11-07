from sqlalchemy import text
import pandas as pd
from core.dbconfig import getDBconfig

engine = getDBconfig()

def getAllComplexesList(complex_id=None, material_id=None):

    final_query = """
    SELECT
        m.id as measurement_id,
        m.measurement_date,
        c.id as complex_id,
        c.name as complex_name,
        eq.id as equipment_id,
        eq.name as equipment_name,
        p.id as parameter_id,
        p.name as parameter_name,
        u.id as units_id,
        u.symbol as units_symbol,
        m.value as measured_value,
        fc.id as feed_complex_id,
        pc.id as product_complex_id,
        ma.id as feed_material_id,
        ma.name as feed_material_name,
        mat.id as product_material_id,
        mat.name as product_material_name,
        l.id as license_id,
        l.name as license_name,
        coalesce(fc.line_number, pc.line_number) as line_number
    FROM operation.measurement as m
    LEFT JOIN basic.complex as c ON m.complex_id = c.id
    LEFT JOIN general.equipment as eq ON m.equipment_id = eq.id
    LEFT JOIN general.parameter as p ON m.parameter_id = p.id
    LEFT JOIN general.units as u ON p.unit_id = u.id
    LEFT JOIN basic.feed_complex as fc ON m.feed_complex_id = fc.id
    LEFT JOIN general.material as ma ON fc.material_id = ma.id
    LEFT JOIN basic.production_complex pc ON m.production_complex_id = pc.id
    LEFT JOIN general.material as mat ON pc.material_id = mat.id
    LEFT JOIN (
        SELECT DISTINCT ON (complex_id)
            complex_id,
            license_id
        FROM basic.complex_license
    ) as cl ON c.id = cl.complex_id
    LEFT JOIN general.license as l ON cl.license_id = l.id
    WHERE 1=1
    """


    params = {}
    if complex_id is not None:
        final_query += " AND c.id = :complex_id"
        params["complex_id"] = complex_id
    if material_id is not None:
        final_query += " AND ma.id = :material_id"
        params["material_id"] = material_id

    final_query += " ORDER BY m.id"


    with engine.begin() as conn:
        df = pd.read_sql(text(final_query), conn, params=params)

    return df
