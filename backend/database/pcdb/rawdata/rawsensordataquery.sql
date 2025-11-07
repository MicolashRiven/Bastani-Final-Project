select
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
l.name as license_name,

coalesce(fc.line_number, pc.line_number) as line_number


from operation.sensor_data sd
left join basic.complex c on sd.complex_id = c.id
left join general.equipment eq on sd.equipment_id = eq.id
left join general.equipment_class eqc on eq.class_id = eqc.id
left join general.equipment_type eqt on eq.type_id = eqt.id
left join general.parameter p on sd.parameter_id = p.id
left join general.units su on sd.unit_id = su.id

left join (select distinct on (complex_id)
complex_id,
license_id
from basic.complex_license
) as cl on c.id = cl.complex_id

left join general.license as l on cl.license_id = l.id

left join (select distinct on (complex_id)
id,
complex_id,
line_number
from basic.feed_complex
order by complex_id
) as fc 
on sd.complex_id = fc.complex_id

left join (
select distinct on (complex_id)
id,
complex_id,
line_number
from basic.production_complex
order by complex_id
) as pc 
on sd.complex_id = pc.complex_id

order by sd.id;

