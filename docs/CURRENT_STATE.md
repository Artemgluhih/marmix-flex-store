# Marmix Flex Redesign v2 — Current State

**Current stage:** T001–T004 DONE; M1 Foundation ready PASS. T005 не начата.

| Field | State |
|---|---|
| TASKS.md status | COMPLETE; 18 PHASE (0–17), 74 TASK (T001–T074); T001–T004 DONE, T005–T074 TODO. |
| Milestone status | M1 — PASS; M2 и последующие gates ожидают соответствующих TASK. |
| T004 implementation | Public route group с Header, desktop/mobile navigation, Footer и прежней тестовой страницей foundation; implementation commit a166973c038834388c500c9e3d74d0fa86000eb5. Hero/Showcase/Product Card ещё не начаты. |
| Checks | Lint, typecheck, build PASS; Next.js Preview из Git branch redesign-v2 READY и содержит implementation commit. Browser console без ошибок приложения. |
| Owner verification T004 | Chrome Responsive Mode: 1440 × 900 PASS, 768 × 900 PASS, 390 × 844 PASS. Header/Footer и Dark Gold Showroom выглядят корректно; overflow NO. На mobile: открыть/закрыть кнопкой, Escape, Tab, видимый focus, usable navigation links — PASS. |
| HTTPS Preview | https://marmix-flex-redesign-v2-preview-ntk66u1fr.vercel.app (deployment dpl_3SQsZE4BrS76ho8aDECyQrsGH2AG, source SHA a166973c038834388c500c9e3d74d0fa86000eb5). При следующих commits Vercel создаёт отдельные branch Preview; проверять актуальный deployment по redesign-v2. |
| Security / production | .env.example только с пустыми placeholders, Preview noindex; ошибочный production deployment нового Preview-проекта удалён в T003; существующий production Marmix Flex и main не изменялись. |
| Current branch / remote HEAD | redesign-v2; после публикации этого checkpoint его commit является remote HEAD (точный SHA проверять через GitHub ref). Предыдущий проверенный HEAD: a166973c038834388c500c9e3d74d0fa86000eb5. |
| Next TASK | T005 — Hero и Material Showcase. Только после отдельного запроса владельца. |
| Recommended model for T005 | GPT-6 Sol Medium; reasoning Medium; additional agent NO. |
| Next concrete step | Остановиться после remote verification T004; T005 не начинать автоматически. |

**Источники истины:** [TASKS.md](TASKS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Утверждённый [prototype](../prototype/index.html) — visual reference для следующей TASK.
