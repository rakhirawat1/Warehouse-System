-- A storage-space name identifies the space inside its warehouse, so two
-- spaces in the same warehouse may not share one. Names are compared without
-- case ("Rack A" and "rack a" are the same space). Different warehouses may
-- reuse a name.
CREATE UNIQUE INDEX "storage_spaces_warehouse_name_unique"
  ON "storage_spaces" ("warehouse_id", LOWER("name"));
