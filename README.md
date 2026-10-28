# Vista

A project dashboard built with React, Vite and Tailwind, backed by Vercel serverless functions and Firestore.

## Getting started

```bash
npm install
vercel dev
```

`vercel dev` serves the app and the `/api` functions together. Firebase settings are read from `.env` (`FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, …).

| Script               | What it does                             |
| -------------------- | ---------------------------------------- |
| `npm run build`      | Type-check and build the browser app     |
| `npm run lint`       | Lint, including the layer boundary rules |
| `npm test`           | Run the unit tests once                  |
| `npm run test:watch` | Run the unit tests in watch mode         |
| `npm run format`     | Format the codebase with Prettier        |

## Architecture

The code is split into layers. Each layer only calls the layer below it.

```
src/            Browser app
  pages/          Screens; compose features
  features/       One folder per domain (e.g. projects/)
  components/     ui/ (generic primitives), layout/ (app shell)
  lib/            Generic helpers (fetch client, dates)
        │
        │ HTTP / JSON
        ▼
api/            Vercel routes: parse request → call service → send response
server/         Server internals (not deployed as endpoints)
  http/           Errors, validation, method router
  projects/       Service (business rules) and repository (Firestore)
        │
        ▼
    Firestore

shared/         Contracts used by both sides: domain model and request schemas
```

### The project layers

- **`shared/projects/model.ts`**: the `Project` domain model and its enums.
- **`shared/projects/contracts.ts`**: zod schemas and DTO types for what clients may send (`CreateProjectRequest`, `UpdateProjectRequest`, `ProjectFilters`) and what the API returns (`ProjectResponse`).
- **`server/projects/projectRepository.ts`**: the `ProjectRepository` interface. `firestoreProjectRepository.ts` is the only code that talks to Firestore.
- **`server/projects/projectService.ts`**: business rules such as timestamps and not-found handling. It receives a repository, so tests can pass an in-memory one.
- **`server/projects/index.ts`**: wires the Firestore repository into the service.
- **`api/`**: thin route files. Every file in `api/` becomes a Vercel function, so helpers live in `server/`.
- **`src/features/projects/`**: everything the browser app knows about projects: `api.ts` (the only place with endpoint URLs), `hooks.ts`, `selectors.ts` (pure derived data), and components. Other code imports it through `index.ts`.

### Import rules

These are enforced by ESLint (`no-restricted-imports`):

- `src/` must not import from `api/` or `server/`. Use `@shared/*` for contracts.
- `server/`, `api/` and `shared/` must not import from `src/`.
- `shared/` must not import from `api/` or `server/`.
- Outside a feature, import it through its public `index.ts` (`@/features/projects`), not its internal files.

### Path aliases

The browser app uses `@/` for `src/` and `@shared/` for `shared/`. Server code uses relative imports with `.js` extensions, as required by the Node ESM runtime on Vercel.
