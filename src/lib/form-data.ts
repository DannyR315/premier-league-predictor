export function formField(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function formCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}
