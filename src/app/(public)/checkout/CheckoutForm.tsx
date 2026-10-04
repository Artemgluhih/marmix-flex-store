"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { EMPTY_FORM, FORM_LIMITS, validateField, validateForm, type Field, type FormErrors, type FormValues } from "./form";
import styles from "./checkout.module.css";

type TechnicalState = "normal" | "validating" | "error";

export function CheckoutForm({ technical = false, technicalState = "normal", technicalInitialValues,
  onTechnicalSubmit, technicalSubmitting = false, technicalError }: {
  technical?: boolean; technicalState?: TechnicalState; technicalInitialValues?: FormValues;
  onTechnicalSubmit?: (values: FormValues) => Promise<void>;
  technicalSubmitting?: boolean; technicalError?: string;
}) {
  const [values, setValues] = useState<FormValues>(technicalInitialValues ?? EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: validateField(field, value) }));
  }

  function checkAll(): boolean {
    const next = validateForm(values);
    setErrors(next);
    const first = Object.keys(next)[0] as Field | undefined;
    if (first) requestAnimationFrame(() => (formRef.current?.elements.namedItem(first) as HTMLElement | null)?.focus());
    return !first;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!technical || !onTechnicalSubmit || technicalSubmitting || !checkAll()) return;
    void onTechnicalSubmit(values);
  }

  const fields: { field: Field; label: string; type?: string; autocomplete?: string; hint?: string }[] = [
    { field: "name", label: "Имя", autocomplete: "name", hint: "Необходимо для заявки." },
    { field: "phone", label: "Телефон", type: "tel", autocomplete: "tel", hint: "Необходим для связи по заявке." },
    { field: "city", label: "Город", autocomplete: "address-level2", hint: "Обязательность поля уточняется." },
    { field: "email", label: "Email", type: "email", autocomplete: "email", hint: "Обязательность поля уточняется." },
    { field: "comment", label: "Комментарий", hint: "Необязательно." },
  ];

  return <form ref={formRef} className={styles.form} noValidate onSubmit={submit} aria-labelledby="contact-title">
    <h2 id="contact-title">Контактные данные</h2>
    <p className={styles.formLead}>Заявка — это запрос на расчёт/связь с менеджером. Она не резервирует товар и сама по себе не является подтверждённым заказом или оплатой.</p>
    <div className={styles.fields}>
      {fields.map(({ field, label, type, autocomplete, hint }) => {
        const id = `checkout-${field}`;
        const props = { id, name: field, value: values[field], maxLength: FORM_LIMITS[field],
          required: field === "name" || field === "phone",
          "aria-invalid": !!errors[field], "aria-describedby": `${id}-hint${errors[field] ? ` ${id}-error` : ""}`,
          onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(field, event.target.value),
          onBlur: () => setErrors((current) => ({ ...current, [field]: validateField(field, values[field]) })) };
        return <div key={field} className={styles.field}>
          <label htmlFor={id}>{label}</label>
          {field === "comment" ? <textarea {...props} rows={4} />
            : <input {...props} type={type ?? "text"} autoComplete={autocomplete} inputMode={field === "phone" ? "tel" : undefined} />}
          <p id={`${id}-hint`} className={styles.hint}>{hint}</p>
          {errors[field] && <p id={`${id}-error`} className={styles.fieldError} role="alert">{errors[field]}</p>}
        </div>;
      })}
    </div>
    <div className={styles.legal} role="status" aria-label="Статус юридического согласия">
      <p className={styles.eyebrow}>Preview · Legal review required</p>
      <p>Юридический текст согласия ожидает утверждения.</p>
    </div>
    <p className={styles.payment}>Условия оплаты согласовываются с менеджером после рассмотрения заявки.</p>
    {technicalState === "validating" && <p className={styles.formStatus} role="status">Проверяем поля… Техническое отображение без отправки.</p>}
    {technicalState === "error" && <p className={styles.fieldError} role="alert">Не удалось отправить заявку. Техническое отображение будущей ошибки; отправка не выполнялась.</p>}
    <div className={styles.formActions}>
      {technical && <button type="button" className={styles.check} onClick={checkAll}>Проверить поля (технически)</button>}
      <button type="submit" className={styles.submit} disabled={!technical || !onTechnicalSubmit || technicalSubmitting}
        aria-describedby="checkout-submit-reason">{technicalSubmitting ? "Отправка…" : technical ? "Отправить TEST_ONLY заявку" : "Отправить заявку"}</button>
    </div>
    {technicalError && <p className={styles.fieldError} role="alert">{technicalError}</p>}
    <p id="checkout-submit-reason" className={styles.hint}>{technical
      ? "Только фиксированные синтетические данные в изолированной Preview проверке. Production legal approval ожидается."
      : "Отправка недоступна: юридический текст не утверждён."}</p>
  </form>;
}
