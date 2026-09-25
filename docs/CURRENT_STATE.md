# Marmix Flex Redesign v2 — Current State

**Current stage:** T001 и T002 COMPLETE; T003 BLOCKED до корректного branch Preview.

| Field | State |
|---|---|
| TASKS.md status | COMPLETE; [docs/TASKS.md](TASKS.md) сохранён и проверен в удалённой ветке. |
| PHASE count | 18 (PHASE 0–17). |
| TASK count | 74 (T001–T074); T001 и T002 DONE, остальные TODO. |
| Milestone count | 8 (M1–M8), плюс обязательный Content gate. |
| Completed TASK | T001 — Next.js foundation; T002 — tokens, global CSS, CSS Modules, Prata/Manrope; lint, typecheck, build прошли. |
| Deferred check | Визуальный smoke T002 на 1440/390 перенесён в T003 HTTPS Preview из-за ограничения среды на localhost, а не дефекта реализации. |
| T003 partial work | Безопасный .env.example и временный noindex metadata сохранены; lint, typecheck, build прошли. T003 остаётся TODO; визуальный smoke 1440/390 и M1 не пройдены. |
| T003 deployment blocker | Vercel connector сообщил «targeting preview», но фактический deployment dpl_2fSQp2oNYgNeLhaTLFN1nCDLhDHu нового отдельного проекта prj_2OI4vP4GIX3e99xbE7iF5NrBbdA2 имеет target=production и не содержит Git branch metadata. URL: https://marmix-flex-redesign-v2-preview-cp7rv1kv9.vercel.app; HTML отвечает 200. Существующий marmix-store не менялся. Нужен изолированный Preview, связанный с redesign-v2; не считать этот deployment принятым. |
| Next TASK | Завершить T003 — настроить действительный branch Preview и провести browser smoke; T004 не начинать. |
| Recommended model for T003 | GPT-6 Sol Medium; reasoning Medium; additional agent NO. |
| Current branch | GitHub: redesign-v2; в текущем scratch каталоге нет локального Git checkout. |
| Last verified remote TASK commit before this checkpoint | aac69ff1b24280fb2f9bde32e0bd050e391b1e25 — частичная реализация T003 (env/metadata); main оставался на 9927f4c83127b954a647a848d4ed09cc65faaee6. |
| Next concrete step | Исправить Vercel target и связь Preview с redesign-v2 безопасным способом; проверить production isolation; затем выполнить перенесённый visual smoke T002 и только при полном успехе закрыть T003/M1. |

**Граница:** сейчас не начинать T003 и последующие задачи. Технический source of truth — [ARCHITECTURE.md](ARCHITECTURE.md), визуальный — [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Этот checkpoint фиксирует последний TASK commit до собственного commit; актуальный HEAD ветки после его записи проверять на GitHub.
