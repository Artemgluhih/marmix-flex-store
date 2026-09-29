"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { clearNonAdminLoginSession, loginAction, type LoginState } from "./actions";
import styles from "./login.module.css";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className={styles.submit} type="submit" disabled={pending}>
      {pending ? "Входим…" : "Войти"}
    </button>
  );
}

export function LoginForm({
  returnPath,
  clearNonAdminSession,
}: {
  returnPath: string;
  clearNonAdminSession: boolean;
}) {
  const [state, formAction] = useActionState(loginAction, initialState);

  useEffect(() => {
    if (clearNonAdminSession) void clearNonAdminLoginSession();
  }, [clearNonAdminSession]);

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <Link className={styles.brand} href="/" prefetch={false} aria-label="Marmix Flex — на главную">
          MARMIX <span>FLEX</span>
        </Link>

        <section className={styles.panel} aria-labelledby="login-title">
          <div className={styles.eyebrow}>Администрирование</div>
          <h1 id="login-title">Вход в управление</h1>
          <p className={styles.intro}>Для доступа используйте выданную владельцем учётную запись.</p>

          <form action={formAction} className={styles.form}>
            <input type="hidden" name="next" value={returnPath} />
            <div className={styles.field}>
              <label htmlFor="admin-email">Электронная почта</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                required
                maxLength={320}
                aria-describedby={state.error ? "login-error" : undefined}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="admin-password">Пароль</label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-describedby={state.error ? "login-error" : undefined}
              />
            </div>
            {state.error && (
              <p id="login-error" className={styles.error} role="alert">
                {state.error}
              </p>
            )}
            <SubmitButton />
          </form>
        </section>

        <Link className={styles.back} href="/" prefetch={false}>← Вернуться на сайт</Link>
      </div>
    </main>
  );
}
