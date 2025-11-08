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
ma.id as feed_material_id,
ma.name as feed_material_name,
mat.id as product_material_id,
mat.name as product_material_name,
l.id as license_id,
l.name as license_name,

coalesce(fc.line_number, pc.line_number) as line_number


from operation.measurement as m 

left join basic.complex as c on m.complex_id = c.id
left join general.equipment as eq on m.equipment_id = eq.id
left join general.parameter as p on m.parameter_id = p.id
left join general.units as u on p.unit_id = u.id
left join basic.feed_complex as fc on m.feed_complex_id = fc.id
left join general.material as ma on fc.material_id = ma.id
left join basic.production_complex pc on m.production_complex_id = pc.id
left join general.material as mat on pc.material_id = mat.id

left join (select distinct on (complex_id)
complex_id,
license_id
from basic.complex_license
) as cl on c.id = cl.complex_id

left join general.license as l on cl.license_id = l.id

order by m.id;



