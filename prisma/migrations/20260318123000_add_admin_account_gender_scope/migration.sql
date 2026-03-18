-- Add a gender scope to privileged accounts for gender-specific moderation queues.
ALTER TABLE "AdminAccount"
ADD COLUMN "gender" "Gender";

UPDATE "AdminAccount"
SET "gender" = CASE
    WHEN "email" = 'admin@example.com' THEN 'MALE'::"Gender"
    WHEN "email" = 'ops.admin@example.com' THEN 'MALE'::"Gender"
    WHEN "email" = 'moderator@example.com' THEN 'FEMALE'::"Gender"
    ELSE 'MALE'::"Gender"
END
WHERE "gender" IS NULL;

ALTER TABLE "AdminAccount"
ALTER COLUMN "gender" SET NOT NULL;
