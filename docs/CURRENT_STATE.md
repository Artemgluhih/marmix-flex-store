# Marmix Flex Redesign v2 — Current State

**Current stage:** T001 и T002 COMPLETE; T003 IN PROGRESS, M1 не пройден.

| Field | State |
|---|---|
| TASKS.md status | COMPLETE; [docs/TASKS.md](TASKS.md) сохранён и проверен в удалённой ветке. |
| PHASE count | 18 (PHASE 0–17). |
| TASK count | 74 (T001–T074); T001 и T002 DONE, остальные TODO. |
| Milestone count | 8 (M1–M8), плюс обязательный Content gate. |
| Completed TASK | T001 — Next.js foundation; T002 — tokens, global CSS, CSS Modules, Prata/Manrope; lint, typecheck, build прошли. |
| Deferred check | Визуальный smoke T002 на 1440/390 перенесён в T003 HTTPS Preview из-за ограничения среды на localhost, а не дефекта реализации. |
| T003 partial work | Безопасный .env.example и временный noindex metadata сохранены; lint, typecheck, build прошли. Git подключён к отдельному Vercel проекту prj_2OI4vP4GIX3e99xbE7iF5NrBbdA2. Настоящий branch Preview dpl_3R7xBFFfRyNVWzRZZSUg2MdqFFUk (redesign-v2 @ efa67888c1bdda1c6b49dac269dbb9da3c9bf9e2) READY: https://marmix-flex-redesign-v2-preview-5wlvryt8f.vercel.app. На 1363px подтверждены Prata, Manrope, кириллица, токены, отсутствие overflow и ошибок страницы в консоли. Точные 1440/390 визуальные smoke пока не пройдены; T003 остаётся TODO и M1 не пройден. |
| T003 deployment blocker | Первоначальный Vercel connector сообщил «targeting preview», но создал отдельный deployment dpl_2fSQp2oNYgNeLhaTLFN1nCDLhDHu с target=production в том же новом проекте: https://marmix-flex-redesign-v2-preview-cp7rv1kv9.vercel.app. Его нельзя считать Preview. Существующий проект marmix-store не менялся. Удаление ошибочного deployment через UI лишает мгновенного отката и требует подтверждения пользователя; до него не выполнять. |
| Next TASK | Завершить T003 — настроить действительный branch Preview и провести browser smoke; T004 не начинать. |
| Recommended model for T003 | GPT-6 Sol Medium; reasoning Medium; additional agent NO. |
| Current branch | GitHub: redesign-v2; в текущем scratch каталоге нет локального Git checkout. |
| Last verified remote TASK commit before this checkpoint | aac69ff1b24280fb2f9bde32e0bd050e391b1e25 — частичная реализация T003 (env/metadata); main оставался на 9927f4c83127b954a647a848d4ed09cc65faaee6. |
| Next concrete step | После подтверждения пользователя удалить только ошибочный production-target deployment нового проекта; затем проверить точные 1440/390 в подходящем browser-инструменте, отсутствие ошибок/overflow и только при полном успехе закрыть T003/M1. T004 не начинать. |

**Граница:** сейчас не начинать T003 и последующие задачи. Технический source of truth — [ARCHITECTURE.md](ARCHITECTURE.md), визуальный — [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Этот checkpoint фиксирует последний TASK commit до собственного commit; актуальный HEAD ветки после его записи проверять на GitHub.
