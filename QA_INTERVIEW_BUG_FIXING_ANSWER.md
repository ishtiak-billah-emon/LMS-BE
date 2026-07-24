# QA Interview: Recent Bug-Fixing Example - LMS CORS/Login Issue

Use this as a speaking guide. Keep the answer natural; do not claim test results that you did not personally run.

## 60-90 second answer

> A recent issue I worked through in our LMS happened when the frontend tried to log in to the Node/Express API from a different local origin. In the browser, the request appeared as a CORS failure and the cookie-based login flow could not continue.
>
> I first confirmed it was a browser/API integration issue rather than a database or credentials issue. I checked the browser Network tab for the `OPTIONS` preflight and response headers, then reviewed the server startup and CORS configuration. The backend used ES modules: `index.js` called `dotenv.config()`, but it also statically imported `app.js`. Because ES module imports are evaluated before the body of `index.js`, `app.js` read `process.env.CORS_ORIGIN` too early. It could therefore configure CORS with an undefined origin. That is particularly problematic for credentialed requests, because the browser needs a specific allowed origin rather than a wildcard response.
>
> I fixed it by making the CORS origin lookup happen when each request is handled, after the environment is loaded, and kept `credentials: true` for the HTTP-only authentication cookies. I also made sure the frontend origin was documented in the environment example. I retested normal login, a preflight request, and a request from an unapproved origin. Finally, I locked the project back to the tested Express 4 version and synchronized `package.json` and `package-lock.json`, so a clean install did not recreate the inconsistent dependency state.
>
> The outcome was that the frontend could call the API with credentials, while the API only returned CORS permission for the configured frontend origin. The main lesson was to treat a CORS error as an integration symptom: check request headers, preflight behavior, cookie settings, environment-load order, and the installed dependency tree instead of changing headers blindly.

## Short version (30 seconds)

> Our LMS frontend could not complete cookie-based login because the API showed a CORS error. I inspected the preflight and found that `CORS_ORIGIN` was read before `dotenv` had loaded it, due to ES module import evaluation order. I changed the CORS configuration to resolve the allowed origin at request time, verified credentialed login and `OPTIONS`, and synchronized the Express version and lockfile so clean installs stayed reproducible.

## Technical facts from this project

| Area | What I can say |
| --- | --- |
| Backend | Node.js, Express, ES modules, `cors`, `cookie-parser`, JWT-based authentication |
| Relevant config | `src/index.js` loads `dotenv`; `src/app.js` registers the global CORS middleware before the routes |
| Required CORS behavior | A configured frontend origin plus `credentials: true`, because login uses HTTP-only cookies |
| Configuration fix | `origin: (_origin, callback) => callback(null, process.env.CORS_ORIGIN)` reads the environment value when the request is processed |
| Dependency repair | The dependency was changed from Express `^5.2.1` to the tested Express `^4.21.2`, with the lockfile updated to match |

## If they ask: "What was the node_modules problem that caused the CORS issue?"

> There were two related things, and I would separate them clearly. The direct CORS cause was configuration timing: `CORS_ORIGIN` was being read before `dotenv.config()` had executed under ES module loading. Separately, the local dependency tree had moved to Express 5 while the project had been written and tested against Express 4. That meant the installed `node_modules` tree and expected runtime behavior were not aligned. We pinned Express back to `^4.21.2`, updated the lockfile, and used a clean install to make the local tree reproducible. I would not say that deleting `node_modules` itself fixes CORS; it only removes stale or mismatched installed packages. The actual fix was correcting the CORS configuration and aligning the dependency versions.

If asked what you did operationally, say:

1. Checked `package.json` and `package-lock.json` for the intended Express version.
2. Removed the existing install only after confirming the project files were correct, then ran `npm ci` (or `npm install` when intentionally changing dependencies).
3. Restarted the backend and verified the installed version with `npm ls express cors`.
4. Re-ran the browser preflight and credentialed login tests.

## QA investigation and verification steps

1. Reproduce from the frontend and save the browser console error and Network entry.
2. Inspect the `OPTIONS` preflight: request `Origin`, requested method/headers, HTTP status, and `Access-Control-Allow-Origin` / `Access-Control-Allow-Credentials` response headers.
3. Confirm the API starts with the expected environment values, without logging secrets.
4. Verify the allowed frontend origin exactly matches its protocol, hostname, and port (for example `http://localhost:3000`).
5. Test a successful login with credentials enabled on the frontend (`withCredentials: true` or `credentials: "include"`).
6. Test an allowed origin, an unapproved origin, a preflighted request, and a request without credentials.
7. Confirm that `package.json`, `package-lock.json`, and the installed dependency tree agree after a clean install.

## Useful follow-up answers

**Why did credentials matter?**

> The application stores auth tokens in HTTP-only cookies. Browsers only send or accept those cookies cross-origin when the client explicitly includes credentials and the server returns both a specific `Access-Control-Allow-Origin` value and `Access-Control-Allow-Credentials: true`. A wildcard origin cannot be used for that credentialed flow.

**How would you prevent regression?**

> I would add an API integration test that sends an `OPTIONS` request and asserts the exact CORS headers for an approved origin, plus a negative test for an unapproved origin. I would keep the allowed origin in environment configuration, commit the lockfile, use `npm ci` in CI, and add a login smoke test from the real frontend origin.

**What was your role as QA?**

> I reproduced the issue, narrowed it down using browser and API evidence, documented the expected headers and credential behavior, verified the fix across positive and negative cases, and checked that a clean dependency install did not reintroduce the problem.

## Important accuracy note

Do not say "Express 5 always causes CORS errors." It does not. In this project, the Express-version/package-tree mismatch was a stability and reproducibility concern. The direct reason the credentialed CORS flow broke was the environment variable being read too early; the dependency cleanup made the runtime match the version the project was using and testing.
