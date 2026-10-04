import "server-only";

import type { ValidatedOrderRequest } from "./validate-request";

// Until legal sign-off, only fixed synthetic contacts may reach the private INSERT on Preview.
export function previewOrderAllowed(request: ValidatedOrderRequest): boolean {
  return process.env.VERCEL_ENV === "preview" &&
    request.contact.name === "Тестовый пользователь" &&
    request.contact.phone === "+7 900 000-00-00" &&
    (request.contact.city === "" || request.contact.city === "Тестовый город") &&
    (request.contact.email === "" || request.contact.email === "test@example.test") &&
    (request.contact.comment === "" || request.contact.comment === "Тестовая заявка" ||
      (process.env.VERCEL_GIT_COMMIT_REF === "t055-preview-review" &&
        request.contact.comment === "Тестовая интеграционная заявка"));
}
