
CREATE OR REPLACE FUNCTION public.delete_open_item_for_entity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM open_items WHERE referenz_id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_delete_open_item_driving_lesson
  BEFORE DELETE ON driving_lessons
  FOR EACH ROW EXECUTE FUNCTION delete_open_item_for_entity();

CREATE TRIGGER trg_delete_open_item_exam
  BEFORE DELETE ON exams
  FOR EACH ROW EXECUTE FUNCTION delete_open_item_for_entity();

CREATE TRIGGER trg_delete_open_item_service
  BEFORE DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION delete_open_item_for_entity();
