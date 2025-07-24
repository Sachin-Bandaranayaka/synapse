-- CreateMigration
-- Align courier service authentication with original jnex project

-- Add new transExpressApiKey field
ALTER TABLE "Tenant" ADD COLUMN "transExpressApiKey" TEXT;

-- Migrate existing Trans Express credentials to new format
-- Combine username:password into single API key field
UPDATE "Tenant" 
SET "transExpressApiKey" = CONCAT("transExpressUsername", ':', "transExpressPassword")
WHERE "transExpressUsername" IS NOT NULL AND "transExpressPassword" IS NOT NULL;

-- Migrate existing Royal Express credentials to email:password format
-- Note: This assumes royalExpressApiKey currently stores email, and we need to add password
-- Since we don't have the password stored separately, we'll need manual intervention
-- For now, we'll just ensure the field exists and can store email:password format

-- Remove old Trans Express fields
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "transExpressUsername";
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "transExpressPassword";