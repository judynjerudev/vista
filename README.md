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

Variables are read from `.env` locally and from the Vercel project settings when deployed. `.env.example` lists them.

**Server** (Vercel type **Secret**):

| Variable                      | What it is                                                            |
| ----------------------------- | --------------------------------------------------------------------- |
| `FIREBASE_PROJECT_ID`         | The Firebase project ID                                               |
| `FIREBASE_CLIENT_EMAIL`       | The service account's email                                           |
| `FIREBASE_PRIVATE_KEY`        | The service account's private key, on one line with `\n` for newlines |
| `FIRESTORE_EMULATOR_HOST`     | Optional. Use the local emulator; the two above are then optional     |
| `FIREBASE_AUTH_EMULATOR_HOST` | Optional. Verify ID tokens from the local Auth emulator               |

**Browser** (Vercel type **Config**):

| Variable                           | What it is                                        |
| ---------------------------------- | ------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`            | The web app's API key                             |
| `VITE_FIREBASE_AUTH_DOMAIN`        | Usually `<project-id>.firebaseapp.com`            |
| `VITE_FIREBASE_PROJECT_ID`         | The Firebase project ID                           |
| `VITE_FIREBASE_APP_ID`             | The web app's ID                                  |
| `VITE_FIREBASE_AUTH_EMULATOR_HOST` | Optional. Sign in against the local Auth emulator |

The `VITE_` prefix makes Vite include a variable in the browser bundle, so anyone can read it. That's safe for these four: Firebase's web config identifies the project but grants nothing on its own. Vercel warns about public prefixes; classify these as **Config** to confirm they're meant to be public. Never give a secret a `VITE_` prefix.

Create the service account key in the Firebase console under Project settings → Service accounts → Generate new private key. It gives full access to the database, so keep it out of git and mark it **Secret** in Vercel.

`server/config.ts` validates the server variables when a function starts. If any is missing or malformed, the function fails with one error naming every bad variable, for example `Invalid server configuration: FIREBASE_PRIVATE_KEY is required`. Values are never logged. `src/lib/config.ts` does the same for the browser variables and shows an error screen naming them.

## Authentication and access

Users sign in with Google or with a link emailed to them (passwordless). There are no passwords to store or reset.

- **Browser:** `src/features/auth/` wraps Firebase Auth. Until someone signs in, the app shows only the sign-in screen. Every API request carries the user's Firebase ID token as `Authorization: Bearer <token>`; `src/lib/http.ts` adds it. If the API answers `401`, the user is signed out and told their session expired.
- **Email links:** the email is saved on the device that requested the link. If the link is opened elsewhere, the app asks for the email again, so nobody can send you a link that signs you into their account. Once used, the link is removed from the address bar.
- **API:** `server/auth/` verifies the token with the Admin SDK. `methodRouter` requires an authenticator, so every route is signed-in only. A missing or invalid token gets `401`; an account without a verified email gets `403`.
- **Ownership:** a project's `ownerUuid` is set from the signed-in user when it's created; clients can't choose it. Users only see their own projects. Reading, updating or deleting someone else's project returns `404`, so IDs can't be used to discover other users' projects. Updates and deletes check ownership in the same transaction as the write.
- **Signing out** clears the session on that device. It doesn't revoke tokens already issued, which stay valid for up to an hour. Checking for revoked tokens would add a call to Firebase on every request, which isn't worth it for a dashboard where each user only reaches their own data.

### Firebase console setup

1. Authentication → Sign-in method: enable **Google**, and **Email/Password** with **Email link (passwordless sign-in)** turned on. Leave the password option off.
2. Authentication → Settings → Authorized domains: add the production domain. `localhost` is there by default. Email links and Google sign-in only work on listed domains.
3. Restrict the browser API key in Google Cloud (APIs & Services → Credentials) to your sites and to the Identity Toolkit and Token Service APIs. Include `<project-id>.firebaseapp.com`, which Google sign-in uses. Local development uses `localhost:5173` (Vite) and `localhost:3000` (`vercel dev`).

## Firestore access

Only the API talks to Firestore. It uses the Admin SDK with the service account, which isn't subject to security rules. `firestore.rules` denies every direct read and write, so a browser or anyone else with the project ID can't reach the data.

Deploy the rules after changing them:

```bash
npx firebase deploy --only firestore:rules --project <project-id>
```

## Integration tests

`npm run test:integration` starts the Firestore and Auth emulators, runs the `*.integration.test.ts` files against them, and stops them. They call the real route handlers with real ID tokens, so they cover sign-in, ownership, and the Firestore queries, transactions and security rules that unit tests fake.

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
  features/       One folder per domain (auth/, projects/)
  components/     ui/ (generic primitives), layout/ (app shell)
  lib/            Generic helpers (config, fetch client, dates)
        │
        │ HTTP / JSON
        ▼
api/            Vercel routes: parse request → call service → send response
server/         Server internals (not deployed as endpoints)
  config.ts       Validated environment variables
  auth/           ID token verification
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
- **`server/projects/projectService.ts`**: business rules such as ownership, timestamps and not-found handling. Every method takes the signed-in user. It throws `AppError`s with a code such as `NOT_FOUND` and knows nothing about HTTP. It receives a repository, so tests can pass an in-memory one.
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
