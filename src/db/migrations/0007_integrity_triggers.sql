-- Database-level guarantees for the stock rules.
--
-- The services already check these rules and return friendly messages. These
-- triggers make the rules impossible to break even from a different code path,
-- a script, or two requests running at the same time.

CREATE OR REPLACE FUNCTION enforce_allocation_rules() RETURNS trigger AS $$
DECLARE
  space_capacity integer;
  space_type storage_type;
  warehouse_state warehouse_status;
  warehouse_label varchar;
  space_label varchar;
  item_type storage_type;
  used integer;
BEGIN
  -- Taking stock out is always allowed: a full space or an inactive warehouse
  -- must still be possible to empty.
  IF TG_OP = 'UPDATE'
     AND NEW.storage_space_id = OLD.storage_space_id
     AND NEW.quantity <= OLD.quantity THEN
    RETURN NEW;
  END IF;

  -- Lock the storage space so two transactions cannot both pass the capacity
  -- check on the same free units.
  SELECT s.capacity, s.storage_type, s.name, w.status, w.name
    INTO space_capacity, space_type, space_label, warehouse_state, warehouse_label
    FROM storage_spaces s
    JOIN warehouses w ON w.id = s.warehouse_id
   WHERE s.id = NEW.storage_space_id
     FOR UPDATE OF s;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Storage space does not exist' USING ERRCODE = 'check_violation';
  END IF;

  IF warehouse_state <> 'ACTIVE' THEN
    RAISE EXCEPTION 'warehouse "%" is inactive and cannot store new stock', warehouse_label
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT required_storage_type INTO item_type FROM items WHERE id = NEW.item_id;

  IF NOT (
    item_type = space_type
    OR (item_type = 'NORMAL' AND space_type IN ('COLD_STORAGE', 'SECURE'))
  ) THEN
    RAISE EXCEPTION 'storage space "%" is % storage and cannot hold an item that needs %',
      space_label, space_type, item_type
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO used
    FROM allocations
   WHERE storage_space_id = NEW.storage_space_id
     AND id <> NEW.id;

  IF used + NEW.quantity > space_capacity THEN
    RAISE EXCEPTION 'storage space "%" holds % of % units, so % more do not fit',
      space_label, used, space_capacity, NEW.quantity
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS allocations_rules ON allocations;
--> statement-breakpoint

CREATE TRIGGER allocations_rules
  BEFORE INSERT OR UPDATE ON allocations
  FOR EACH ROW EXECUTE FUNCTION enforce_allocation_rules();
--> statement-breakpoint

-- A storage space can never be made smaller than the stock it already holds.
CREATE OR REPLACE FUNCTION enforce_storage_space_capacity() RETURNS trigger AS $$
DECLARE
  used integer;
BEGIN
  IF NEW.capacity < OLD.capacity THEN
    SELECT COALESCE(SUM(quantity), 0) INTO used
      FROM allocations
     WHERE storage_space_id = NEW.id;

    IF NEW.capacity < used THEN
      RAISE EXCEPTION 'storage space "%" holds % units, so its capacity cannot be %',
        NEW.name, used, NEW.capacity
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS storage_spaces_capacity_rule ON storage_spaces;
--> statement-breakpoint

CREATE TRIGGER storage_spaces_capacity_rule
  BEFORE UPDATE OF capacity ON storage_spaces
  FOR EACH ROW EXECUTE FUNCTION enforce_storage_space_capacity();
