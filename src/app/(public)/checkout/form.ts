export const FORM_LIMITS = { name: 120, phone: 40, city: 120, email: 254, comment: 2000 } as const;
export const FIELD_REQUIREDNESS = { name: "required", phone: "required", city: "pending", email: "pending", comment: "optional" } as const;
export type Field = keyof typeof FORM_LIMITS;
export type FormValues = Record<Field, string>;
export type FormErrors = Partial<Record<Field, string>>;
export const EMPTY_FORM: FormValues = { name: "", phone: "", city: "", email: "", comment: "" };

export function validateField(field: Field, raw: string): string | undefined {
  const value = raw.trim();
  if (value.length > FORM_LIMITS[field]) return "Слишком длинное значение.";
  if (field === "name") return value ? undefined : "Укажите имя.";
  if (field === "phone") {
    if (!value) return "Укажите телефон.";
    const digits = value.replace(/\D/g, "");
    return /^[+\d() .-]+$/.test(value) && digits.length >= 7 && digits.length <= 15
      ? undefined : "Проверьте номер телефона.";
  }
  if (field === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Проверьте адрес электронной почты.";
  return undefined; // City/email requiredness awaits the owner; comment is optional.
}

export function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  for (const field of Object.keys(FORM_LIMITS) as Field[]) {
    const error = validateField(field, values[field]);
    if (error) errors[field] = error;
  }
  return errors;
}
