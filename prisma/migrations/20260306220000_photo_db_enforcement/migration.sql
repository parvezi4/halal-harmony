-- Enforce secure photo constraints at the database level.

-- Backfill legacy nullable rows before setting NOT NULL.
UPDATE "Photo"
SET "mimeType" = 'image/jpeg'
WHERE "mimeType" IS NULL;

UPDATE "Photo"
SET "fileSizeBytes" = 1
WHERE "fileSizeBytes" IS NULL OR "fileSizeBytes" <= 0;

-- Require metadata for all photo rows.
ALTER TABLE "Photo"
  ALTER COLUMN "mimeType" SET NOT NULL,
  ALTER COLUMN "fileSizeBytes" SET NOT NULL;

-- MIME and file size guards.
ALTER TABLE "Photo"
  ADD CONSTRAINT "photo_mime_type_allowed_chk"
    CHECK ("mimeType" IN ('image/jpeg', 'image/png', 'image/webp')),
  ADD CONSTRAINT "photo_file_size_max_2mb_chk"
    CHECK ("fileSizeBytes" > 0 AND "fileSizeBytes" <= 2097152);

-- Hard cap at 5 photos per profile.
CREATE OR REPLACE FUNCTION enforce_photo_limit_per_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_profile_id TEXT;
  current_count INTEGER;
BEGIN
  target_profile_id := COALESCE(NEW."profileId", OLD."profileId");

  SELECT COUNT(*)
  INTO current_count
  FROM "Photo"
  WHERE "profileId" = target_profile_id
    AND (TG_OP <> 'UPDATE' OR "id" <> NEW."id");

  IF current_count >= 5 THEN
    RAISE EXCEPTION 'A profile can have at most 5 photos';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "photo_limit_per_profile_trg" ON "Photo";

CREATE TRIGGER "photo_limit_per_profile_trg"
BEFORE INSERT OR UPDATE OF "profileId" ON "Photo"
FOR EACH ROW
EXECUTE FUNCTION enforce_photo_limit_per_profile();
