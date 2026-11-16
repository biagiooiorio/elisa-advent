export type GiftKind = "messaggio" | "attivita" | "promessa" | "sorpresa";

export type Gift = {
  day: number;
  title: string;
  body: string;
  kind: GiftKind;
  sticker: string;
};
