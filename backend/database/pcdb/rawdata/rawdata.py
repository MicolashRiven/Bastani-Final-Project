from sqlalchemy import text
import pandas as pd
from core.dbconfig import getDBconfig

engine = getDBconfig()

def getAllComplexesList():
    with engine.begin() as conn:
        # conn.execute(text("""

        #         );
        # """))


        query = """

        SELECT
        m.id as  measurement_id,
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
        ma.id as material_id,
        ma.name as material_name,

        coalesce(fc.line_number, pc.line_number) as line_number

        from operation.measurement as m 

        left join basic.complex as c on m.complex_id = c.id
        left join general.equipment as eq on m.equipment_id = eq.id
        left join general.parameter as p on m.parameter_id = p.id
        left join general.units as u on p.unit_id = u.id
        left join basic.feed_complex as fc on m.feed_complex_id = fc.id
        left join general.material as ma on fc.material_id = ma.id
        left join basic.production_complex pc on m.production_complex_id = pc.id


        order by m.id;

        """

        df = pd.read_sql(text(query), conn)

    return df
