-- Keep the item total and its allocations in step.
--
--   allocated = SUM(allocations.quantity)
--   remaining = items.quantity - allocated   (never negative)
--
-- The services check the same rules first and return friendly messages; these
-- triggers make the rules impossible to break from any other code path.

-- Existing rows: the total becomes whatever is already allocated.
UPDATE items i
   SET quantity = COALESCE(
     (SELECT SUM(a.quantity) FROM allocations a WHERE a.item_id = i.id),
     0
   );
--> statement-breakpoint

CREATE OR REPLACE FUNCTION enforce_allocation_within_item_total() RETURNS trigger AS $$
DECLARE
  item_total integer;
  item_label varchar;
  allocated integer;
BEGIN
  -- Only increases can break the rule.
  IF TG_OP = 'UPDATE' AND NEW.quantity <= OLD.quantity THEN
    RETURN NEW;
  END IF;

  -- Lock the item so two allocations cannot both use the last free units.
  SELECT quantity, name INTO item_total, item_label
    FROM items
   WHERE id = NEW.item_id
     FOR UPDATE;

  SELECT COALESCE(SUM(quantity), 0) INTO allocated
    FROM allocations
   WHERE item_id = NEW.item_id
     AND id <> NEW.id;

  IF allocated + NEW.quantity > item_total THEN
    RAISE EXCEPTION 'item "%" has % units in total and % already allocated, so % more cannot be allocated',
      item_label, item_total, allocated, NEW.quantity
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS allocations_within_item_total ON allocations;
--> statement-breakpoint

CREATE TRIGGER allocations_within_item_total
  BEFORE INSERT OR UPDATE ON allocations
  FOR EACH ROW EXECUTE FUNCTION enforce_allocation_within_item_total();
--> statement-breakpoint

-- The total can never drop below what is already allocated.
CREATE OR REPLACE FUNCTION enforce_item_total_covers_allocations() RETURNS trigger AS $$
DECLARE
  allocated integer;
BEGIN
  IF NEW.quantity >= OLD.quantity THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO allocated
    FROM allocations
   WHERE item_id = NEW.id;

  IF NEW.quantity < allocated THEN
    RAISE EXCEPTION 'item "%" has % units allocated, so the total cannot be %',
      NEW.name, allocated, NEW.quantity
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS items_total_covers_allocations ON items;
--> statement-breakpoint

CREATE TRIGGER items_total_covers_allocations
  BEFORE UPDATE OF quantity ON items
  FOR EACH ROW EXECUTE FUNCTION enforce_item_total_covers_allocations();
