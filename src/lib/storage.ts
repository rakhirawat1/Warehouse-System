/**
 * Storage-type rules, shared by the database triggers, the services and the UI
 * so they can never disagree.
 */

export const STORAGE_TYPES = [
  "NORMAL",
  "COLD_STORAGE",
  "SECURE",
  "HAZARDOUS",
] as const;

export type StorageType = (typeof STORAGE_TYPES)[number];

export const STORAGE_TYPE_LABELS: Record<StorageType, string> = {
  NORMAL: "Normal",
  COLD_STORAGE: "Cold storage",
  SECURE: "Secure",
  HAZARDOUS: "Hazardous",
};

export const STORAGE_TYPE_DESCRIPTIONS: Record<StorageType, string> = {
  NORMAL: "Standard shelving for everyday items.",
  COLD_STORAGE: "Temperature controlled space for items that must stay cold.",
  SECURE: "Locked space for high value items.",
  HAZARDOUS: "Certified space for dangerous goods.",
};

/**
 * Space types that can hold an item of each required type. Special types are
 * strict; normal items can use any space except hazardous.
 */
export const STORAGE_COMPATIBILITY: Record<StorageType, StorageType[]> = {
  NORMAL: ["NORMAL", "COLD_STORAGE", "SECURE"],
  COLD_STORAGE: ["COLD_STORAGE"],
  SECURE: ["SECURE"],
  HAZARDOUS: ["HAZARDOUS"],
};

export function canStore(itemType: StorageType, spaceType: StorageType) {
  return STORAGE_COMPATIBILITY[itemType].includes(spaceType);
}

export function storageMismatchMessage(
  itemName: string,
  itemType: StorageType,
  spaceName: string,
  spaceType: StorageType,
) {
  return (
    `"${itemName}" needs ${STORAGE_TYPE_LABELS[itemType].toLowerCase()} storage, ` +
    `but "${spaceName}" is ${STORAGE_TYPE_LABELS[spaceType].toLowerCase()}. ` +
    `Choose a storage space that matches the item.`
  );
}
