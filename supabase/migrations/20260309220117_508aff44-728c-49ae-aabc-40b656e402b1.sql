
DELETE FROM payment_allocations WHERE open_item_id IN (SELECT id FROM open_items WHERE student_id = 'e225cc6d-fdd1-4f65-bb89-d53afd9d47da');
DELETE FROM open_items WHERE student_id = 'e225cc6d-fdd1-4f65-bb89-d53afd9d47da';
DELETE FROM services WHERE student_id = 'e225cc6d-fdd1-4f65-bb89-d53afd9d47da';
DELETE FROM activity_log WHERE entity_id = 'e225cc6d-fdd1-4f65-bb89-d53afd9d47da';
DELETE FROM students WHERE id = 'e225cc6d-fdd1-4f65-bb89-d53afd9d47da';
