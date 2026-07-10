/*
# Fix assets type constraint

Adds 'newspaper' to the allowed asset types for the map view.
*/

ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_type_check;
ALTER TABLE assets ADD CONSTRAINT assets_type_check CHECK (type IN ('hoarding','gsb','gate_branding','pole_kiosk','wall_wrap','auto_branding','metro_branding','lift_branding','bus_branding','mall_branding','newspaper'));
