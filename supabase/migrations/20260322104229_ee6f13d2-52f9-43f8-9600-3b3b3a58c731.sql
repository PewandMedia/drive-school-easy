ALTER TABLE payments ADD COLUMN einreichungsdatum timestamptz DEFAULT now();
UPDATE payments SET einreichungsdatum = datum WHERE einreichungsdatum IS NULL;