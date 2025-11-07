from sqlalchemy import text
import pandas as pd
from core.dbconfig import getDBconfig

engine = getDBconfig()

def getAllComplexesList(complex_id=None, material_id=None):

    final_query = """
    SELECT
        m.id AS measurement_id,
        m.measurement_date,
        c.id AS complex_id,
        c.name AS complex_name,
        eq.id AS equipment_id,
        eq.name AS equipment_name,
        p.id AS parameter_id,
        p.name AS parameter_name,
        u.id AS units_id,
        u.symbol AS units_symbol,
        m.value AS measured_value,
        fc.id AS feed_complex_id,
        pc.id AS product_complex_id,
        ma.id AS feed_material_id,
        ma.name AS feed_material_name,
        mat.id AS product_material_id,
        mat.name AS product_material_name,
        l.id AS license_id,
        l.name AS license_name,
        COALESCE(fc.line_number, pc.line_number) AS line_number
    FROM operation.measurement AS m
    LEFT JOIN basic.complex AS c ON m.complex_id = c.id
    LEFT JOIN general.equipment AS eq ON m.equipment_id = eq.id
    LEFT JOIN general.parameter AS p ON m.parameter_id = p.id
    LEFT JOIN general.units AS u ON p.unit_id = u.id
    LEFT JOIN basic.feed_complex AS fc ON m.feed_complex_id = fc.id
    LEFT JOIN general.material AS ma ON fc.material_id = ma.id
    LEFT JOIN basic.production_complex AS pc ON m.production_complex_id = pc.id
    LEFT JOIN general.material AS mat ON pc.material_id = mat.id
    LEFT JOIN (
        SELECT DISTINCT ON (complex_id)
            complex_id,
            license_id
        FROM basic.complex_license
    ) AS cl ON c.id = cl.complex_id
    LEFT JOIN general.license AS l ON cl.license_id = l.id
    WHERE 1=1
    """

    params = {}

    if complex_id is not None:
        final_query += " AND c.id = :complex_id"
        params["complex_id"] = complex_id

    if material_id is not None:
        final_query += " AND mat.id = :material_id"
        params["material_id"] = material_id

    final_query += " ORDER BY m.id"

    with engine.begin() as conn:
        df = pd.read_sql(text(final_query), conn, params=params)

    return df
