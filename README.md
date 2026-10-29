# Vista

A project dashboard built with React, Vite and Tailwind, backed by Vercel serverless functions and Firestore.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values
vercel dev
```

`vercel dev` serves the app and the `/api` functions together.

| Script                     | What it does                                        |
| -------------------------- | --------------------------------------------------- |
| `npm run build`            | Type-check and build the browser app                |
| `npm run lint`             | Lint, including the layer boundary rules            |
| `npm test`                 | Run the unit tests once                             |
| `npm run test:watch`       | Run the unit tests in watch mode                    |
| `npm run test:integration` | Run the integration tests in the Firestore emulator |
| `npm run format`           | Format the codebase with Prettier                   |

## Configuration

The API reads these variables from `.env` locally and from the Vercel project settings when deployed. `.env.example` lists them.

| Variable                  | What it is                                                            |
| ------------------------- | --------------------------------------------------------------------- |
| `FIREBASE_PROJECT_ID`     | The Firebase project ID                                               |
| `FIREBASE_CLIENT_EMAIL`   | The service account's email                                           |
| `FIREBASE_PRIVATE_KEY`    | The service account's private key, on one line with `\n` for newlines |
| `FIRESTORE_EMULATOR_HOST` | Optional. Use the local emulator; the two above are then optional     |

Create the service account key in the Firebase console under Project settings → Service accounts → Generate new private key. It gives full access to the database, so keep it out of git and mark it **Secret** in Vercel.

`server/config.ts` validates the variables when a function starts. If any is missing or malformed, the function fails with one error naming every bad variable, for example `Invalid server configuration: FIREBASE_PRIVATE_KEY is required`. Values are never logged.

## Firestore access

Only the API talks to Firestore. It uses the Admin SDK with the service account, which isn't subject to security rules. `firestore.rules` denies every direct read and write, so a browser or anyone else with the project ID can't reach the data.

Deploy the rules after changing them:

```bash
npx firebase deploy --only firestore:rules --project <project-id>
```

## Integration tests

`npm run test:integration` starts the Firestore emulator, runs the `*.integration.test.ts` files against it, and stops it. They call the real route handlers, so they cover the Firestore queries, transactions and security rules that unit tests fake.

The emulator needs Java 21 or later (for example `brew install openjdk@21` on macOS). It uses the `demo-vista` project ID, which can never reach a real Firebase project, and starts empty each time. CI runs these tests after the unit tests pass.

## API errors

Every error response has the same shape:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "name: Name is required",
    "details": [{ "path": "name", "message": "Name is required" }]
  }
}
```

| Code                 | Status |
| -------------------- | ------ |
| `VALIDATION_FAILED`  | 400    |
| `UNAUTHENTICATED`    | 401    |
| `FORBIDDEN`          | 403    |
| `NOT_FOUND`          | 404    |
| `METHOD_NOT_ALLOWED` | 405    |
| `INTERNAL`           | 500    |

`details` only appears on validation errors. Unexpected errors return `INTERNAL` without their cause, which is logged instead.

Every response has an `x-request-id` header, and every server log line for that request starts with `[request <id>]`. To investigate a failure, search the Vercel logs for its request ID. In the browser, `ApiError` exposes it as `requestId`.

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
  config.ts       Validated environment variables
  errors.ts       Domain errors (`AppError`)
  http/           Request parsing, responses, method router
  projects/       Service (business rules) and repository (Firestore)
        │
        ▼
    Firestore

shared/         Contracts used by both sides: domain model, request schemas, error shape
```

### The project layers

- **`shared/projects/model.ts`**: the `Project` domain model and its enums.
- **`shared/projects/contracts.ts`**: zod schemas and DTO types for what clients may send (`CreateProjectRequest`, `UpdateProjectRequest`, `ProjectFilters`) and what the API returns (`ProjectResponse`).
- **`server/projects/projectRepository.ts`**: the `ProjectRepository` interface. `firestoreProjectRepository.ts` is the only code that talks to Firestore.
- **`server/projects/projectService.ts`**: business rules such as timestamps and not-found handling. It throws `AppError`s with a code such as `NOT_FOUND` and knows nothing about HTTP. It receives a repository, so tests can pass an in-memory one.
- **`server/projects/index.ts`**: wires the Firestore repository into the service.
- **`api/`**: thin route files. Every file in `api/` becomes a Vercel function, so helpers live in `server/`. Routes read input only through `parseQuery`, `parseBody` and `getRouteParam` from `server/http/request.ts`, never `request.query` directly.
- **`src/features/projects/`**: everything the browser app knows about projects: `api.ts` (the only place with endpoint URLs), `hooks.ts`, `selectors.ts` (pure derived data), and components. Other code imports it through `index.ts`.

### Import rules

These are enforced by ESLint (`no-restricted-imports`):

- `src/` must not import from `api/` or `server/`. Use `@shared/*` for contracts.
- `server/`, `api/` and `shared/` must not import from `src/`.
- `shared/` must not import from `api/` or `server/`.
- Outside a feature, import it through its public `index.ts` (`@/features/projects`), not its internal files.

### Path aliases

The browser app uses `@/` for `src/` and `@shared/` for `shared/`. Server code uses relative imports with `.js` extensions, as required by the Node ESM runtime on Vercel.
