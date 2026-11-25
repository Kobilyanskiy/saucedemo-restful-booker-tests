# QA Automation Test Assignment — UI & API Test Suite

Playwright + TypeScript tests for two public demo apps:
- UI: Sauce Demo (https://www.saucedemo.com), an e-commerce demo store
- API: Restful Booker (https://restful-booker.herokuapp.com), a hotel booking REST API

This is a time-boxed take-home assignment (~4 hours). Scope is fixed
(see "Scope"). Do not add tests, tools or abstractions beyond it
unless I ask.

## Commands
- Install:            npm ci && npx playwright install --with-deps chromium
- Run all:            npx playwright test
- Run UI only:        npx playwright test --project=ui
- Run API only:       npx playwright test --project=api
- Run one file:       npx playwright test tests/ui/cart.spec.ts
- Run by tag:         npx playwright test --grep @smoke
- Re-run failures:    npx playwright test --last-failed
- Flakiness check:    npx playwright test <file> --repeat-each=10 --workers=1
- Type check:         npx tsc --noEmit
- Report:             npx playwright show-report

## Scope
UI (Sauce Demo, user standard_user):
- 5-7 tests for the main flows: login, catalog, sorting, cart, checkout
- 2-3 negative / edge cases (e.g. locked_out_user, empty checkout form,
  wrong password)

API (Restful Booker):
- One end-to-end flow: auth -> create booking -> update -> delete ->
  verify it is gone (GET returns 404)
- 2-3 negative cases (e.g. update without token, bad credentials,
  get non-existent booking)

CI: GitHub Actions on push, HTML report uploaded as an artifact.

## Structure
- tests/ui/          UI specs, one file per feature
- tests/api/         API specs using the `request` fixture
- pages/             Page objects (one class per page)
- fixtures/          Custom fixtures (logged-in page, API client, auth token)
- data/              Static test data (users, checkout info, booking payloads)
- .github/workflows/ playwright.yml
- playwright.config.ts  Projects: `ui` (chromium, baseURL saucedemo)
                        and `api` (no browser, baseURL restful-booker)

## Writing UI tests (Sauce Demo)
- testIdAttribute is set to `data-test` in the config. Sauce Demo has
  stable data-test attributes, so getByTestId is acceptable here.
  Order of preference: getByRole > getByTestId > getByPlaceholder >
  getByText. No CSS/XPath; if unavoidable, explain why in a comment.
- Use web-first assertions: toBeVisible(), toHaveText(), toHaveURL(),
  toHaveCount(). Never assert on a one-off textContent().
- NEVER use page.waitForTimeout().
- Locators and actions live in page objects. Assertions stay in specs.
  Reuse existing page objects before creating new ones.
- For sorting, assert the full order of names/prices against a sorted
  copy of the list read from the page, not just the first item.
- For checkout, verify item total, tax and total on the overview page
  against the prices of the items added.
- Log in via the fixture in fixtures/, not through the UI, except in
  tests that are about login itself.
- Positive scenarios use standard_user only. Other users
  (locked_out_user, problem_user, error_user) only in negative tests
  or when investigating a bug.

## Writing API tests (Restful Booker)
- Get the token from POST /auth and send it as the header
  `Cookie: token=<token>` on PUT, PATCH and DELETE.
- Each test creates its own booking. Never rely on existing booking IDs:
  the instance is public and shared, and data is reset periodically.
- Assert status code AND response body (schema/fields), not status only.
- This API has known non-REST behaviour (e.g. POST /booking returns 200,
  DELETE returns 201, bad credentials on /auth return 200 with
  {"reason": "Bad credentials"}). Do NOT silently write the test to
  match it. Tell me, and I decide whether it is a bug report or an
  accepted quirk.
- Heroku may respond slowly or with 503 on cold start. Do not hide this
  with retries or long timeouts without asking.

## Test data and secrets
- Credentials (saucedemo password, restful-booker admin/password) are
  read from process.env with the public demo values as defaults in
  data/. Never commit a .env file.
- Use unique values where data is created (e.g. firstname with
  Date.now()).

## Tags
- Every test has a tag: @smoke (critical path) or @negative.
  Also @ui or @api.
- Test names describe behaviour: "user can sort products by price low
  to high", not "sorting test 2".

## Fixing failing tests — guardrails
- First classify the failure: locator changed / timing / test data /
  environment / real application bug. Show the evidence (error,
  trace, screenshot, response body).
- If the application is wrong, STOP and tell me. Do not edit the test
  to make it pass. Real bugs go to the "Found bugs" section of the
  README (steps, expected, actual), which I review.
- NEVER change expected values, delete assertions or weaken them
  (e.g. toHaveText -> toContainText) without asking me first.
- NEVER add test.skip(), test.fixme(), test.fail(), retries or longer
  timeouts to make a test pass without asking.
- Fix locators in the page object, then rerun every spec that uses it.

## Using the browser (Playwright MCP)
- Before writing a test for a page you have not seen, open it with
  the Playwright MCP browser and read the accessibility snapshot.
  Do not guess locators or texts.
- Only open https://www.saucedemo.com and
  https://restful-booker.herokuapp.com. No other sites.

## Files you must not edit
- AI_WORKLOG.md — I write it myself.
- README.md "Found bugs" section — propose changes, I approve them.
- Do not commit or push. I make the commits.

## Before you finish a task
- Run the tests you created or changed (chromium for UI).
- Run npx tsc --noEmit.
- Then stop and give me the report below. Always use this exact format,
  even for a planning-only task (write "n/a" in sections that do not
  apply).

## REPORT format
```
## REPORT
1. Files created / changed (path — one line on what it does)
2. Commands you ran and their result (pass/fail counts, not full logs)
3. Failures: for each one — classification (locator / timing / test data /
   environment / application bug) and the evidence
4. Suspected application bugs: steps, expected result, actual result
5. Assumptions you made and anything you were unsure of
6. What you deliberately did NOT do and why
7. What I should check manually before committing
```
