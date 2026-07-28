export type Ritual = "burn" | "shatter" | "shred" | "dissolve";

export type TextOffering = {
  kind: "text";
  text: string;
  label: string;
};

export type FileOffering = {
  kind: "file";
  file: File;
  name: string;
  size: number;
  mime: string;
  previewUrl?: string;
};

export type Offering = TextOffering | FileOffering;

export type AppPhase = "offer" | "choose" | "ritual" | "released";
