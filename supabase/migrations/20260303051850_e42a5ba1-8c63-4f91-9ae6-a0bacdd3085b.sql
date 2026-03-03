DELETE FROM open_items oi
WHERE NOT EXISTS (
  SELECT 1 FROM driving_lessons dl WHERE dl.id = oi.referenz_id
) AND NOT EXISTS (
  SELECT 1 FROM exams e WHERE e.id = oi.referenz_id
) AND NOT EXISTS (
  SELECT 1 FROM services s WHERE s.id = oi.referenz_id
);