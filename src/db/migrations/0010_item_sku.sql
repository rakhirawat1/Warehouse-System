-- Every item gets a short code (LAP-001) so people can refer to it on paper,
-- on a label or over the phone without reading out a UUID.
ALTER TABLE "items" ADD COLUMN "sku" varchar(40);
--> statement-breakpoint

-- Backfill: three letters from the name plus a running number.
UPDATE "items" AS i
SET "sku" = generated.value
FROM (
  SELECT
    "id",
    COALESCE(
      NULLIF(
        UPPER(
          SUBSTRING(REGEXP_REPLACE("name", '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 3)
        ),
        ''
      ),
      'ITM'
    )
      || '-'
      || LPAD(
        (ROW_NUMBER() OVER (ORDER BY "created_at", "id"))::text,
        3,
        '0'
      ) AS value
  FROM "items"
) AS generated
WHERE i."id" = generated."id";
--> statement-breakpoint

ALTER TABLE "items" ALTER COLUMN "sku" SET NOT NULL;
--> statement-breakpoint

-- Codes are compared without case, so "lap-001" cannot shadow "LAP-001".
CREATE UNIQUE INDEX "items_sku_unique" ON "items" (UPPER("sku"));
