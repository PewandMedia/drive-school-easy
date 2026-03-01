
ALTER TABLE exams DISABLE TRIGGER validate_exam_instructor_trigger;
ALTER TABLE exams DISABLE TRIGGER trg_open_item_exam;

ALTER TABLE exams ADD COLUMN status text NOT NULL DEFAULT 'angemeldet';

UPDATE exams SET status = CASE
  WHEN bestanden = true THEN 'bestanden'
  ELSE 'nicht_bestanden'
END;

ALTER TABLE exams DROP COLUMN bestanden;

ALTER TABLE exams ENABLE TRIGGER validate_exam_instructor_trigger;
ALTER TABLE exams ENABLE TRIGGER trg_open_item_exam;
