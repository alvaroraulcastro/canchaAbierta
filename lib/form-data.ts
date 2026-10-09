import { z } from "zod";

export type FormDataEntry = FormDataEntryValue | null;

export function formEntryToString(value: FormDataEntry): string {
  if (value === null || typeof value !== "string") return "";
  return value.trim();
}

export function formCheckbox(value: FormDataEntry): boolean {
  return value === "on";
}

export const zFormString = z.preprocess(
  (value) => formEntryToString(value as FormDataEntry),
  z.string(),
);

export const zFormOptionalString = z.preprocess((value) => {
  const text = formEntryToString(value as FormDataEntry);
  return text.length === 0 ? undefined : text;
}, z.string().optional());

export const zFormCheckbox = z.preprocess(
  (value) => formCheckbox(value as FormDataEntry),
  z.boolean(),
);
