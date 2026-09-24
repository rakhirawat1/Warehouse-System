"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { createItemAction } from "../actions";
import BulkItemReview from "./bulk-item-review";
import { suggestItemsAction } from "@/features/ai/actions";
import type { ItemSuggestion } from "@/features/ai/assist";
import AIAssistBox from "@/features/ai/components/ai-assist-box";
import { suggestSku } from "../schemas";
import Button from "@/components/ui/button";
import FormMessage from "@/components/ui/form-message";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  STORAGE_TYPE_DESCRIPTIONS,
  STORAGE_TYPES,
  STORAGE_TYPE_LABELS,
  type StorageType,
} from "@/lib/storage";
import { useAction } from "@/lib/use-action";

type ItemFormProps = {
  /** Used to suggest the next code, e.g. the 26th item becomes LAP-026. */
  nextSequence: number;
};

export default function ItemForm({ nextSequence }: ItemFormProps) {
  const router = useRouter();

  const [storageType, setStorageType] = useState<StorageType>("NORMAL");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [skuTouched, setSkuTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  /** Why the AI picked the storage type, shown under the field. */
  const [storageReason, setStorageReason] = useState<string | null>(null);
  const [quantityFromPrompt, setQuantityFromPrompt] = useState(false);
  /** Set when one prompt described several items; shows the review list. */
  const [bulk, setBulk] = useState<ItemSuggestion[] | null>(null);

  function applyOne(suggestion: ItemSuggestion) {
    setName(suggestion.name);
    setDescription(suggestion.description);
    setStorageType(suggestion.storageType);
    setStorageReason(suggestion.storageReason || null);
    setSku(suggestion.sku);
    setSkuTouched(true);

    // Only when the user wrote a quantity; otherwise leave theirs alone.
    if (suggestion.quantity !== null) {
      setQuantity(String(suggestion.quantity));
      setQuantityFromPrompt(true);
    }
  }

  const create = useAction(createItemAction, {
    onSuccess: (item) => {
      router.push(`/items/${item.id}`);
      router.refresh();
    },
  });

  // The code follows the name until the user types one of their own.
  const suggestedSku = skuTouched ? sku : suggestSku(name, nextSequence);

  async function handleSubmit(formData: FormData) {
    await create.run({
      name: formData.get("name"),
      sku: formData.get("sku"),
      description: formData.get("description"),
      requiredStorageType: formData.get("requiredStorageType"),
      quantity: formData.get("quantity") || 0,
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {/* A quantity is only filled when the description states it. */}
      <AIAssistBox
        label="Describe one or more items and let AI fill in the details"
        placeholder='e.g. "455 iPhone 18 Pro Max, 200 boxes of A4 paper and 30 cans of white paint"'
        maxLength={1500}
        suggest={suggestItemsAction}
        onApply={(suggestions) => {
          if (suggestions.length === 1) {
            setBulk(null);
            applyOne(suggestions[0]);
          } else {
            setBulk(suggestions);
          }
        }}
      />

      {bulk && (
        <BulkItemReview
          key={bulk.map((item) => item.sku).join("|")}
          suggestions={bulk}
          onDismiss={() => setBulk(null)}
          onUseOne={(suggestion) => {
            setBulk(null);
            applyOne(suggestion);
          }}
        />
      )}

      <div className={bulk ? "hidden" : "space-y-5"}>

      <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
        <div>
          <Label htmlFor="name">Item name</Label>

          <Input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Cardboard Boxes"
            required
          />

          {create.fieldError("name") && (
            <FieldHint error>{create.fieldError("name")}</FieldHint>
          )}
        </div>

        <div>
          <Label htmlFor="sku">Item code</Label>

          <Input
            id="sku"
            name="sku"
            type="text"
            value={suggestedSku}
            onChange={(event) => {
              setSkuTouched(true);
              setSku(event.target.value.toUpperCase());
            }}
            placeholder="e.g. BOX-001"
            className="font-mono uppercase"
            required
          />

          <FieldHint error={Boolean(create.fieldError("sku"))}>
            {create.fieldError("sku") ??
              "Suggested from the name. It must be unique."}
          </FieldHint>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>

        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What this item is, and anything worth knowing about it"
          rows={3}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="requiredStorageType">Storage needed</Label>

          <Select
            id="requiredStorageType"
            name="requiredStorageType"
            value={storageType}
            onChange={(event) =>
              setStorageType(event.target.value as StorageType)
            }
          >
            {STORAGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {STORAGE_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>

          <FieldHint>
            {storageReason ? (
              <>
                <span className="font-medium text-accent">AI:</span>{" "}
                {storageReason}.{" "}
              </>
            ) : null}
            {STORAGE_TYPE_DESCRIPTIONS[storageType]} The item can only be
            allocated to a storage space of this type.
          </FieldHint>
        </div>

        <div>
          <Label htmlFor="quantity">Total quantity</Label>

          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            placeholder="e.g. 100"
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value);
              setQuantityFromPrompt(false);
            }}
            required
          />

          <FieldHint error={Boolean(create.fieldError("quantity"))}>
            {create.fieldError("quantity") ??
              (quantityFromPrompt
                ? "Taken from your description. Check it before saving."
                : "How many units the business owns. You allocate them to storage spaces next, all at once or a few at a time.")}
          </FieldHint>
        </div>
      </div>

      <FormMessage error={create.error} success={create.message} />

      <div className="flex justify-end gap-2 border-t border-border pt-5">
        <Button href="/items" variant="secondary" type="button">
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={create.pending}
          icon={<Plus className="h-4 w-4" />}
        >
          {create.pending ? "Creating..." : "Create Item"}
        </Button>
      </div>
      </div>
    </form>
  );
}
