-- Update all CONVERTED leads to CONFIRMED
UPDATE "Lead"
SET status = 'CONFIRMED'
WHERE status = 'CONVERTED'; 