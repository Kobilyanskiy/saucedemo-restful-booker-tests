# QA Automation Test Assignment — UI & API Test Suite

Automated tests for two public demo applications:

- **UI:** [Sauce Demo](https://www.saucedemo.com), an e-commerce demo store (login, catalog, sorting, cart, checkout).
- **API:** [Restful Booker](https://restful-booker.herokuapp.com), a hotel booking REST API (auth and booking CRUD).

**Stack:** Playwright Test, TypeScript, Page Object Model, Playwright `request` fixture for API, GitHub Actions for CI.

## How to run

### Requirements

- Node.js LTS (CI uses `lts/*`)
- npm
- Internet access (both applications are public, hosted demos)

### Install

```bash
npm ci
npx playwright install --with-deps chromium
```

### Run

| What | Command |
| --- | --- |
| All tests (UI + API) | `npx playwright test` (or `npm test`) |
| UI only | `npx playwright test --project=ui` (or `npm run test:ui`) |
| API only | `npx playwright test --project=api` (or `npm run test:api`) |
| By tag | `npx playwright test --grep @smoke` / `--grep @negative` / `--grep @api` |
| One file | `npx playwright test tests/ui/cart.spec.ts` |
| Type check | `npx tsc --noEmit` (or `npm run typecheck`) |

The `ui` project depends on `ui-setup`, which logs in once as `standard_user` and saves the session
to `.auth/standard_user.json`. It runs automatically before UI tests, also when filtering by tag.

Credentials default to the public demo values and can be overridden with environment variables:
`SAUCE_PASSWORD`, `RB_USERNAME`, `RB_PASSWORD`.

### Report

```bash
npx playwright show-report
```

Traces and screenshots are kept for failed tests only.

### CI report

The workflow [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs on every push
(and manually via `workflow_dispatch`): `npm ci` → install Chromium → `tsc --noEmit` → `npx playwright test`.

In the GitHub Actions run page, under **Artifacts**:

- `playwright-report` — the HTML report (uploaded on every non-cancelled run, kept 14 days).
- `test-results` — traces and screenshots (uploaded only when the run fails, kept 14 days).

Download and unzip `playwright-report`, then open it with `npx playwright show-report <unzipped folder>`.

## Project structure

```
tests/ui/            UI specs, one file per feature (+ auth.setup.ts)
tests/api/           API specs using the `request` fixture
pages/               Page objects, one class per page (+ HeaderComponent)
fixtures/            index.ts: page-object fixtures; api.ts: `authToken` fixture and auth header helper
data/                Static test data: users, checkout info, products, UI messages, booking payloads
utils/               price.ts: price parsing/formatting in integer cents
docs/bugs/           Screenshots used as bug evidence
playwright.config.ts Projects: ui-setup, ui (Chromium, saucedemo), api (no browser, restful-booker)
```

## What is covered

19 tests in total: 1 setup step, 14 UI tests, 4 API tests. Tags: `@smoke` (critical path),
`@negative`, plus `@ui` / `@api`.
UI has 6 positive and 3 negative scenarios; sorting (4 options) and invalid login (3 inputs) are
data-driven, so they are reported as 9 + 5 test cases.

### UI — Sauce Demo (Chromium, `standard_user` unless stated)

| # | Test | Type | Tags | What it verifies |
| --- | --- | --- | --- | --- |
| – | authenticate as standard_user (`auth.setup.ts`) | setup | – | Logs in through the UI, lands on `/inventory.html`, saves `storageState` for the `ui` project |
| 1 | user can log in with valid credentials and see the product catalog | positive | `@smoke` `@ui` | Redirect to `/inventory.html`, title "Products", 6 product cards |
| 2 | user can log out and can no longer open the inventory | positive | `@smoke` `@ui` | Logout returns to login page; opening `/inventory.html` afterwards shows the "logged in" error and no products |
| 3 | user can open product details from the catalog | positive | `@smoke` `@ui` | Details page shows the same name, description and price as the catalog card; "Back to products" returns to inventory |
| 4 | user can sort products by Name (A to Z) | positive | `@smoke` `@ui` | Full list of names equals a sorted copy read from the page; active option label |
| 5 | user can sort products by Name (Z to A) | positive | `@smoke` `@ui` | Same, descending |
| 6 | user can sort products by Price (low to high) | positive | `@smoke` `@ui` | Full list of prices equals a sorted copy (compared in cents); active option label |
| 7 | user can sort products by Price (high to low) | positive | `@smoke` `@ui` | Same, descending |
| 8 | user can add products to the cart and remove one from the cart | positive | `@smoke` `@ui` | Cart badge count, cart rows, names, prices (from catalog), quantities; removal updates rows and badge |
| 9 | user can complete checkout and sees the correct item total, tax and total | positive | `@smoke` `@ui` | Overview item names; item total = sum of catalog prices; tax > 0 and total = item total + tax; "Thank you for your order!"; cart badge cleared |
| 10 | user cannot continue checkout without first name, last name and postal code | negative | `@negative` `@ui` | With 0/1/2 fields filled: the matching "… is required" error and user stays on step one |
| 11 | locked-out user cannot log in and sees the lockout message | negative | `@negative` `@ui` | `locked_out_user` gets the lockout error, stays on `/` |
| 12 | user cannot log in with a wrong password | negative | `@negative` `@ui` | "Username and password do not match…" error, stays on `/` |
| 13 | user cannot log in with an empty username | negative | `@negative` `@ui` | "Username is required" error, stays on `/` |
| 14 | user cannot log in with an empty password | negative | `@negative` `@ui` | "Password is required" error, stays on `/` |

Sorting tests first apply the opposite order, so the list is never already in the expected order.

### API — Restful Booker

| # | Test | Type | Tags | What it verifies |
| --- | --- | --- | --- | --- |
| 1 | booking can be created, updated, partially updated and deleted, after which it is no longer found | E2E | `@smoke` `@api` | Token from `POST /auth`; `POST /booking` returns id + echoed booking; `GET` matches; `PUT` and `PATCH` return and persist changes; `DELETE` is 2xx; `GET` then returns 404 "Not Found" |
| 2 | auth does not issue a token for invalid credentials | negative | `@negative` `@api` | Body is exactly `{"reason": "Bad credentials"}` (no token). Status not asserted — see BUG-API-01 |
| 3 | booking cannot be updated without an auth token | negative | `@negative` `@api` | `PUT` without token returns 403 "Forbidden" and the stored booking is unchanged; booking is cleaned up |
| 4 | booking without required fields is rejected with 400 | negative, `test.fail()` | `@negative` `@api` | Expects 400 and no `bookingid`. Marked `test.fail()` because the API currently returns 500 (BUG-API-03); it shows as passing while the bug is open |

Each API test creates its own booking with a unique first name (`Date.now()`); no shared booking IDs are used.

> **Note:** In CI and local logs, the `list` reporter prints ✗ (`x`) next to "booking without required
> fields is rejected with 400". That is the expected failure of the `test.fail()` test: it is counted
> as passed and does not fail the run. If the API is fixed, the test body passes, Playwright reports the
> test as failed, and `test.fail()` should then be removed.

## Quality checks

- Every key assertion was temporarily broken (wrong expected value) to prove it can fail, then restored.
- Flakiness: UI specs were run with `--repeat-each=5`; API specs were run 3 times in a row on the shared instance.
  Final review run `--repeat-each=3 --workers=2`: 55 passed, 0 flaky.
- `npx tsc --noEmit` runs locally and in CI before the tests.

## What is deliberately NOT covered, and why

The assignment is time-boxed to about 4 hours with a fixed scope: the main UI flows, a few UI negative
cases, one API end-to-end flow and a few API negative cases.

- **Other browsers (Firefox, WebKit, mobile).** Only Chromium is configured, which keeps local and CI runs fast.
- **`performance_glitch_user` and `visual_user`.** Slowness and visual defects need performance and
  visual checks, which are out of scope.
- **Automated tests for `problem_user` / `error_user` bugs.** These accounts are broken on purpose.
  Their bugs were reproduced manually and are recorded under [Found bugs](#found-bugs) instead.
- **Visual testing.** There is no screenshot comparison.
- **XML / form-encoded bodies and `GET /booking` filters.** Only JSON bodies and the CRUD-by-id endpoints are tested.
- **Cleanup of orphan bookings if the smoke flow fails midway.** The E2E flow deletes its booking as
  one of its steps. If a step before the delete fails, the booking stays on the shared instance
  (the public instance is reset periodically).
- **Heroku cold starts.** Restful Booker can answer slowly or with 503 after being idle. There are no
  retries and no extended timeouts on purpose (`retries: 0`), so this shows up as a failure instead of being hidden.

## Found bugs

Found while writing the tests and reproduced manually. `problem_user` and `error_user` are
intentionally defective Sauce Demo accounts, so their bugs are planted defects of the demo store.

### UI — Sauce Demo

#### BUG-UI-01 — Opening /inventory.html or /cart.html directly returns HTTP 404

- **Environment:** https://www.saucedemo.com, `standard_user`, Chromium
- **Severity:** Low
- **Steps:**
  1. Log in as `standard_user`.
  2. Open the network log in DevTools.
  3. Open `https://www.saucedemo.com/inventory.html` (or `/cart.html`) directly in the address bar.
- **Expected:** The document request returns 200.
- **Actual:** The document request returns 404. The page still renders.
- **Evidence:** Network log (status of the document request).

#### BUG-UI-02 — Cart button accessible name is "Cart, 1 items"

- **Environment:** https://www.saucedemo.com, `standard_user`, Chromium
- **Severity:** Low
- **Steps:**
  1. Log in as `standard_user`.
  2. Add one product to the cart.
  3. Inspect the accessible name of the cart button (accessibility tree or screen reader).
- **Expected:** "Cart, 1 item".
- **Actual:** "Cart, 1 items".
- **Evidence:** Accessibility snapshot of the header.

#### BUG-UI-03 — problem_user: sorting does nothing

- **Environment:** https://www.saucedemo.com, `problem_user`, Chromium
- **Severity:** Medium
- **Steps:**
  1. Log in as `problem_user`.
  2. On the inventory page, choose each sort option: Name (Z to A), Price (low to high), Price (high to low).
- **Expected:** The product list is re-ordered and the dropdown label shows the chosen option.
- **Actual:** For every option the list keeps its order and the label stays "Name (A to Z)".
- **Evidence:** Manual reproduction.

#### BUG-UI-04 — problem_user: some products cannot be added to the cart; Remove does nothing

- **Environment:** https://www.saucedemo.com, `problem_user`, Chromium
- **Severity:** High
- **Steps:**
  1. Log in as `problem_user`.
  2. On the inventory page, click "Add to cart" for Sauce Labs Bolt T-Shirt, Sauce Labs Fleece Jacket and Test.allTheThings() T-Shirt (Red).
  3. Click "Add to cart" for Sauce Labs Backpack, then click its "Remove" button on the inventory page.
- **Expected:** Each product is added (button changes to "Remove", badge increases); Remove takes the product out of the cart.
- **Actual:** Nothing happens for the three products. Remove on the inventory page does nothing: the button and the badge stay unchanged.
- **Evidence:** Manual reproduction.

#### BUG-UI-05 — problem_user: typing in Last Name writes into First Name; checkout impossible

- **Environment:** https://www.saucedemo.com, `problem_user`, Chromium
- **Severity:** Critical
- **Steps:**
  1. Log in as `problem_user`.
  2. Add a product to the cart, open the cart, click Checkout.
  3. Type a first name, then type a last name into Last Name, then type a postal code.
  4. Click Continue.
- **Expected:** Each field keeps its own value and the user goes to the overview (`/checkout-step-two.html`).
- **Actual:** Each keystroke in Last Name replaces the First Name value, so typing "Doe" leaves First Name = "e"; Last Name stays empty. Continue shows "Error: Last Name is required" and the user stays on `/checkout-step-one.html`. Checkout cannot be completed.
- **Evidence:** [docs/bugs/bug-problem_user-checkout-lastname.png](docs/bugs/bug-problem_user-checkout-lastname.png)

#### BUG-UI-06 — error_user: empty Last Name passes validation; Finish does nothing

- **Environment:** https://www.saucedemo.com, `error_user`, Chromium
- **Severity:** Critical
- **Steps:**
  1. Log in as `error_user`.
  2. Add Sauce Labs Backpack, Sauce Labs Bike Light and Sauce Labs Onesie to the cart (badge "3"), open the cart, click Checkout.
  3. Fill First Name, Last Name and Zip/Postal Code, click Continue.
  4. On the overview page, click Finish.
- **Expected:** Last Name keeps the typed value (and an empty Last Name blocks Continue); Finish goes to `/checkout-complete.html` with "Thank you for your order!" and the cart badge is cleared.
- **Actual:** Typing into Last Name has no effect and it stays empty, yet Continue goes to step two (Item total $47.97, Tax $3.84, Total $51.81). Finish does nothing: the URL stays `/checkout-step-two.html` and the cart badge stays "3".
- **Evidence:** [docs/bugs/bug-error_user-finish-noop.png](docs/bugs/bug-error_user-finish-noop.png) shows the overview page after clicking Finish. The URL is not visible in the screenshot; it stayed `/checkout-step-two.html`.

#### Also observed

- `problem_user`: all product images are broken (every image is `/assets/sl-404-*.jpg`).
- `error_user`: choosing a sort option shows the alert "Sorting is broken! This error has been reported to Backtrace." and the list is not re-sorted.
- `error_user`: like BUG-UI-04, "Add to cart" does nothing for Bolt T-Shirt, Fleece Jacket and Test.allTheThings() T-Shirt (Red), and Remove on the inventory page does nothing.

### API — Restful Booker

#### BUG-API-01 — POST /auth with a wrong password returns 200 instead of 401

- **Environment:** https://restful-booker.herokuapp.com, `POST /auth`
- **Severity:** Medium
- **Steps:** Send `POST /auth` with `{"username": "admin", "password": "wrong_password"}`.
- **Expected:** 401 Unauthorized.
- **Actual:** 200 OK with body `{"reason": "Bad credentials"}`.
- **Evidence:** `tests/api/booking.spec.ts`, "auth does not issue a token for invalid credentials" (annotation `BUG-API-01`; the status is deliberately not asserted).

#### BUG-API-02 — DELETE /booking/:id returns 201 Created

- **Environment:** https://restful-booker.herokuapp.com, `DELETE /booking/:id`
- **Severity:** Low
- **Steps:** Get a token via `POST /auth`, create a booking, send `DELETE /booking/:id` with `Cookie: token=<token>`.
- **Expected:** 200 OK, as the API docs state.
- **Actual:** 201 Created. The docs say 200 but their example shows 201. The booking is deleted (a following `GET` returns 404).
- **Evidence:** `tests/api/booking.spec.ts`, E2E test, step "delete booking" (annotation `BUG-API-02`; only a 2xx is asserted).

#### BUG-API-03 — POST /booking with only firstname returns 500 instead of 400

- **Environment:** https://restful-booker.herokuapp.com, `POST /booking`
- **Severity:** High
- **Steps:** Send `POST /booking` with body `{"firstname": "Incomplete<timestamp>"}`.
- **Expected:** 400 Bad Request.
- **Actual:** 500 Internal Server Error.
- **Evidence:** `tests/api/booking.spec.ts`, "booking without required fields is rejected with 400", marked `test.fail()` (annotation `BUG-API-03`).

#### BUG-API-04 — PUT / DELETE on a deleted booking id returns 405 instead of 404

- **Environment:** https://restful-booker.herokuapp.com, `PUT /booking/:id`, `DELETE /booking/:id`
- **Severity:** Low
- **Steps:** Create a booking and delete it with a valid token, then send `PUT` or `DELETE` to the same id with a valid token.
- **Expected:** 404 Not Found.
- **Actual:** 405 Method Not Allowed.
- **Evidence:** Manual reproduction.

#### BUG-DOC-01 — API docs: no error responses documented; PATCH examples use PUT

- **Environment:** https://restful-booker.herokuapp.com/apidoc
- **Severity:** Low
- **Steps:** Open the API docs and read the endpoint sections, including PartialUpdateBooking.
- **Expected:** Error responses are documented; PATCH examples use `curl -X PATCH`.
- **Actual:** No error responses are documented; the PATCH examples use `curl -X PUT`.
- **Evidence:** API documentation page.

### Accepted quirks (not bugs)

- `POST /booking` returns 200 instead of 201. This matches the API docs; the tests assert 200.
- A missing or invalid token on `PUT` / `PATCH` / `DELETE` returns 403 Forbidden instead of 401. The tests assert 403.

## AI work log

How AI tools were used on this assignment: [AI_WORKLOG.md](AI_WORKLOG.md).
