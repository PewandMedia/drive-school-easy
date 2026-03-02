-- Alle Demo-Daten löschen (in korrekter Reihenfolge wegen Foreign Keys)
DELETE FROM payment_allocations;
DELETE FROM payments;
DELETE FROM open_items;
DELETE FROM driving_lessons;
DELETE FROM exams;
DELETE FROM services;
DELETE FROM theory_sessions;
DELETE FROM gear_lessons;
DELETE FROM activity_log;
DELETE FROM students;