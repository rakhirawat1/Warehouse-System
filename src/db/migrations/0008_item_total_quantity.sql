ALTER TABLE "items" ADD COLUMN "quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_quantity_not_negative" CHECK ("items"."quantity" >= 0);