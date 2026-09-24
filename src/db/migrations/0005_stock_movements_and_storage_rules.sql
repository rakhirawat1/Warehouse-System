CREATE TYPE "public"."movement_type" AS ENUM('RECEIPT', 'TRANSFER', 'ADJUSTMENT', 'DISPATCH');--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"type" "movement_type" NOT NULL,
	"item_id" uuid,
	"item_name" varchar(150) NOT NULL,
	"from_space_id" uuid,
	"from_label" varchar(300),
	"from_warehouse_id" uuid,
	"to_space_id" uuid,
	"to_label" varchar(300),
	"to_warehouse_id" uuid,
	"quantity" integer NOT NULL,
	"note" text,
	"actor_id" text,
	"actor_name" varchar(150) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_movements_quantity_positive" CHECK ("stock_movements"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_quantity_positive";--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "required_storage_type" "storage_type" DEFAULT 'NORMAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_from_space_id_storage_spaces_id_fk" FOREIGN KEY ("from_space_id") REFERENCES "public"."storage_spaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_from_warehouse_id_warehouses_id_fk" FOREIGN KEY ("from_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_to_space_id_storage_spaces_id_fk" FOREIGN KEY ("to_space_id") REFERENCES "public"."storage_spaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_movements_item_idx" ON "stock_movements" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "stock_movements_batch_idx" ON "stock_movements" USING btree ("batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "allocations_item_space_unique" ON "allocations" USING btree ("item_id","storage_space_id");--> statement-breakpoint
CREATE INDEX "allocations_storage_space_idx" ON "allocations" USING btree ("storage_space_id");