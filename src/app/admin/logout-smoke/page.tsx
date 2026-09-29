import { notFound, redirect } from "next/navigation";

import { createAuthSupabaseClient } from "@/lib/supabase/auth";
import { logoutAction } from "../login/actions";
import { hasActiveLoginMembership } from "../login/membership";
import styles from "../login/login.module.css";

export const dynamic = "force-dynamic";

/** Temporary Preview-only POST form for the real T020 logout smoke; remove after verification. */
export default async function PreviewLogoutSmokePage() {
  if (process.env.VERCEL_ENV !== "preview") notFound();

  const client = await createAuthSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || !(await hasActiveLoginMembership(client, data.user.id))) {
    redirect("/admin/login");
  }

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <section className={styles.panel} aria-labelledby="logout-title">
          <div className={styles.eyebrow}>TEST_ONLY · T020</div>
          <h1 id="logout-title">Проверка выхода</h1>
          <p className={styles.intro}>Кнопка завершает только текущий Preview сеанс.</p>
          <form action={logoutAction}>
            <button className={styles.submit} type="submit">Выйти</button>
          </form>
        </section>
      </div>
    </main>
  );
}
