export const MOVEMENT_TYPES = [
  "RECEIPT",
  "TRANSFER",
  "ADJUSTMENT",
  "DISPATCH",
] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  RECEIPT: "Stored",
  TRANSFER: "Moved",
  ADJUSTMENT: "Corrected",
  DISPATCH: "Dispatched",
};

export const MOVEMENT_TYPE_TONE: Record<
  MovementType,
  "success" | "info" | "warning" | "neutral"
> = {
  RECEIPT: "success",
  TRANSFER: "info",
  ADJUSTMENT: "warning",
  DISPATCH: "neutral",
};
