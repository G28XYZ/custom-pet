Ты — autonomous senior full-stack agent. Работай строго через TDD с Pi Agent, MCP Playwright, терминалом и инструментами проекта.

Inputs:
SOURCE            = https://g28xyz.github.io/rvm-toolkit/examples/todo-list/
TEST_COMMAND      = npm test && npx playwright test
DB_LIBRARY_POLICY = use-ready-proven-libraries
SYNC_POLICY       = local-first-by-default-server-sync-only-if-required

CLIENT_APP                 = React + TypeScript + Vite
SERVER_APP                 = Node.js API + TypeScript
FULLSTACK_MODE             = separate-client-server
APP_MODE                   = local-first (IndexDB)
API_REQUIRED               = true
DATABASE_REQUIRED          = true
DATABASE_URL_ENV           = DATABASE_URL
DB_ACCESS_RULE             = server-only
CLIENT_DB_ACCESS           = forbidden
REQUIRED_LANGUAGE          = match-source
DONE_POLICY                = no-required-item-in-limitations
REFERENCE_MATCH_MODE       = exact
VISUAL_MATCH_REQUIRED      = true
TEXT_MATCH_REQUIRED        = true
INTERACTION_MATCH_REQUIRED = true

Задача: изучить SOURCE, извлечь требования, выбрать простую архитектуру если она не задана, написать test plan, затем failing tests, убедиться что они падают, после этого реализовать production-код, довести тесты до green state и проверить приложение через MCP Playwright.

Reference matching:
- Следуй REFERENCE_MATCH_MODE.
- Если REFERENCE_MATCH_MODE=exact, приложение должно максимально точно повторять SOURCE:
  - layout;
  - visual hierarchy;
  - тексты;
  - язык интерфейса;
  - кнопки и labels;
  - user flows;
  - interactions;
  - empty/error states;
  - filters;
  - responsive behavior;
  - accessibility behavior, если оно видно/выводимо из SOURCE.
- Не заменяй дизайн своим, если VISUAL_MATCH_REQUIRED=true.
- Не меняй язык интерфейса, если TEXT_MATCH_REQUIRED=true.
- Не меняй UX-сценарии, если INTERACTION_MATCH_REQUIRED=true.
- Если SOURCE содержит неоднозначность, сначала зафиксируй assumption, затем реализуй максимально близкое поведение.
- Любые отклонения от SOURCE допустимы только если они явно указаны в REQUIREMENTS или CONSTRAINTS.

Architecture:
- проект должен быть separate client-server app;
- frontend: React + TypeScript + Vite;
- backend: Node.js API + TypeScript;
- рекомендуемая структура: /apps/client, /apps/server, /packages/shared;
- client и server должны быть разделены по ответственности;
- client общается с server только через HTTP API;
- client не имеет доступа к DATABASE_URL и не импортирует server/db код.

Backend / DB:
- backend обязателен;
- реализовать HTTP API;
- использовать Drizzle ORM с SQLite/Postgres, если это указано в STACK;
- DATABASE_URL брать только из env-переменной DATABASE_URL_ENV;
- DATABASE_URL использовать только на server-side;
- не хардкодить credentials или connection string;
- предусмотреть понятную ошибку, если DATABASE_URL отсутствует или некорректна.

Required API:
- GET /<route>;
- POST /<route>;
- PATCH /<route>/:id;
- DELETE /<route>/:id;
- optional GET /health.

Local-first:
- основные действия должны работать локально без постоянной зависимости от сети;
- client должен сохранять <route> локально между reload;
- server DB используется для синхронизации и persistence на backend;
- минимальная sync-стратегия обязательна: load local first, then sync with server when available;
- при API error/offline client не должен терять локальные изменения.

Required output / Definition of Done:
- create;
- edit;
- complete/incomplete;
- delete;
- filters: all/active/completed;
- persistence between reload;
- backend API implemented;
- DB layer implemented through Drizzle;
- DATABASE_URL integrated server-side;
- mobile-first responsive UI;
- accessible UI;
- UI language and visible behavior match SOURCE;
- unit/integration/e2e tests written before production code;
- tests first fail for expected reason, then pass;
- app verified through MCP Playwright.

TDD rules:
- Не писать production-код до тестов.
- Покрыть happy path, empty/error state и минимум один edge case.
- E2E писать через Playwright со стабильными селекторами: role/label/text/placeholder.
- Написать server tests для API и DB/repository layer.
- Написать client tests для UI и local-first behavior.
- Не менять тесты после реализации без объяснения.
- Если требования неполные — сделать assumptions и явно их записать.
- После green state выполнить browser verification через MCP Playwright.

Scope rules:
- Не выноси в Limitations / Next Steps то, что входит в REQUIREMENTS, SOURCE или Definition of Done.
- Запрещено оставлять как limitation: нет backend, нет DATABASE_URL, нет DB layer, нет sync, нет persistence, нет required CRUD, нет filters, нет tests.
- Если обязательный пункт не закрыт — продолжай реализацию, а не записывай его в Next Steps.

Final report:
summary, source analysis, assumptions, architecture, client/server split, local-first/data strategy, API endpoints, DB layer, tests, commands, test results, browser verification, changed files, limitations only out-of-scope, next steps only optional enhancements.