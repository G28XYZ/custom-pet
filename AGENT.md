# Agent Instructions

Ты — autonomous senior full-stack agent. Работай строго через TDD с Pi Agent, MCP Playwright, терминалом и инструментами проекта.

## Project Inputs

<table>
  <thead>
    <tr>
      <th>Variable</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>SOURCE</code></td>
      <td><code>https://g28xyz.github.io/rvm-toolkit/examples/todo-list/</code></td>
    </tr>
    <tr>
      <td><code>TEST_COMMAND</code></td>
      <td><code>npm test &amp;&amp; npx playwright test</code></td>
    </tr>
    <tr>
      <td><code>DB_LIBRARY_POLICY</code></td>
      <td><code>use-ready-proven-libraries</code></td>
    </tr>
    <tr>
      <td><code>SYNC_POLICY</code></td>
      <td><code>local-first-by-default-server-sync-only-if-required</code></td>
    </tr>
  </tbody>
</table>

## Project Constraints

<table>
  <thead>
    <tr>
      <th>Variable</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>CLIENT_APP</code></td>
      <td><code>React + TypeScript + Vite</code></td>
    </tr>
    <tr>
      <td><code>SERVER_APP</code></td>
      <td><code>Node.js API + TypeScript</code></td>
    </tr>
    <tr>
      <td><code>FULLSTACK_MODE</code></td>
      <td><code>separate-client-server</code></td>
    </tr>
    <tr>
      <td><code>APP_MODE</code></td>
      <td><code>local-first (IndexedDB)</code></td>
    </tr>
    <tr>
      <td><code>API_REQUIRED</code></td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>DATABASE_REQUIRED</code></td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>DATABASE_URL_ENV</code></td>
      <td><code>DATABASE_URL</code></td>
    </tr>
    <tr>
      <td><code>DATABASE_ENGINE</code></td>
      <td><code>PostgreSQL only</code></td>
    </tr>
    <tr>
      <td><code>DB_ACCESS_RULE</code></td>
      <td><code>server-only</code></td>
    </tr>
    <tr>
      <td><code>CLIENT_DB_ACCESS</code></td>
      <td><code>forbidden</code></td>
    </tr>
    <tr>
      <td><code>REQUIRED_LANGUAGE</code></td>
      <td><code>match-source</code></td>
    </tr>
    <tr>
      <td><code>DONE_POLICY</code></td>
      <td><code>no-required-item-in-limitations</code></td>
    </tr>
    <tr>
      <td><code>REFERENCE_MATCH_MODE</code></td>
      <td><code>exact</code></td>
    </tr>
    <tr>
      <td><code>VISUAL_MATCH_REQUIRED</code></td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>TEXT_MATCH_REQUIRED</code></td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>INTERACTION_MATCH_REQUIRED</code></td>
      <td><code>true</code></td>
    </tr>
  </tbody>
</table>

## Task

Изучи `SOURCE`, извлеки требования, выбери простую архитектуру если она не задана, напиши test plan, затем failing tests, убедись что они падают, после этого реализуй production-код, доведи тесты до green state и проверь приложение через MCP Playwright.

## Reference Matching

- Следуй `REFERENCE_MATCH_MODE`.
- Если `REFERENCE_MATCH_MODE=exact`, приложение должно максимально точно повторять `SOURCE`: layout, visual hierarchy, тексты, язык интерфейса, кнопки и labels, user flows, interactions, empty/error states, filters, responsive behavior и accessibility behavior, если оно видно/выводимо из `SOURCE`.
- Не заменяй дизайн своим, если `VISUAL_MATCH_REQUIRED=true`.
- Не меняй язык интерфейса, если `TEXT_MATCH_REQUIRED=true`.
- Не меняй UX-сценарии, если `INTERACTION_MATCH_REQUIRED=true`.
- Если `SOURCE` содержит неоднозначность, сначала зафиксируй assumption, затем реализуй максимально близкое поведение.
- Любые отклонения от `SOURCE` допустимы только если они явно указаны в requirements или constraints.

## Architecture

- Проект должен быть separate client-server app.
- Frontend: React + TypeScript + Vite.
- Backend: Node.js API + TypeScript.
- Рекомендуемая структура: `/apps/client`, `/apps/server`, `/packages/shared`.
- Client и server должны быть разделены по ответственности.
- Client общается с server только через HTTP API.
- Client не имеет доступа к `DATABASE_URL` и не импортирует server/db код.

## Backend And Database

- Backend обязателен.
- Реализуй HTTP API.
- Server DB: только PostgreSQL.
- `DATABASE_URL` брать только из env-переменной `DATABASE_URL`.
- `DATABASE_URL` должен быть PostgreSQL connection string: `postgres://...` или `postgresql://...`.
- `DATABASE_URL` использовать только на server-side.
- Не хардкодить credentials или connection string.
- Предусмотреть понятную ошибку, если `DATABASE_URL` отсутствует или некорректна.
- Запрещено добавлять SQLite, sqlite fallback, file-based DB, in-memory production DB, `better-sqlite3`, `sqlite3`, `bun:sqlite` или любые SQLite adapters.
- Тестовые doubles/mocks допустимы только в test code и не должны становиться production DB fallback.

## Required API

- `GET /<route>`
- `POST /<route>`
- `PATCH /<route>/:id`
- `DELETE /<route>/:id`
- Optional: `GET /health`

## Local-First Behavior

- Основные действия должны работать локально без постоянной зависимости от сети.
- Client должен сохранять `<route>` локально между reload.
- Server DB используется для синхронизации и persistence на backend.
- Минимальная sync-стратегия обязательна: load local first, then sync with server when available.
- При API error/offline client не должен терять локальные изменения.

## Definition Of Done

- Create.
- Edit.
- Complete/incomplete.
- Delete.
- Filters: all/active/completed.
- Persistence between reload.
- Backend API implemented.
- DB layer implemented through PostgreSQL.
- `DATABASE_URL` integrated server-side.
- Mobile-first responsive UI.
- Accessible UI.
- UI language and visible behavior match `SOURCE`.
- Unit/integration/e2e tests written before production code.
- Tests first fail for expected reason, then pass.
- App verified through MCP Playwright.

## TDD Rules

- Не писать production-код до тестов.
- Покрыть happy path, empty/error state и минимум один edge case.
- E2E писать через Playwright со стабильными селекторами: role/label/text/placeholder.
- Написать server tests для API и DB/repository layer.
- Написать client tests для UI и local-first behavior.
- Не менять тесты после реализации без объяснения.
- Если требования неполные, сделать assumptions и явно их записать.
- После green state выполнить browser verification через MCP Playwright.

## Scope Rules

- Не выноси в limitations или next steps то, что входит в requirements, `SOURCE` или Definition of Done.
- Запрещено оставлять как limitation: нет backend, нет `DATABASE_URL`, нет DB layer, нет sync, нет persistence, нет required CRUD, нет filters, нет tests.
- Если обязательный пункт не закрыт, продолжай реализацию, а не записывай его в next steps.

## Final Report

Финальный отчет должен включать: summary, source analysis, assumptions, architecture, client/server split, local-first/data strategy, API endpoints, DB layer, tests, commands, test results, browser verification, changed files, limitations only out-of-scope, next steps only optional enhancements.
