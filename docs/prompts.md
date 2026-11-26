# Prompts sent to Claude Code

The prompts used to build this project, in the order they were sent.
Each session was a new Claude Code chat with a clean context; shared rules
and the REPORT format live in [CLAUDE.md](../CLAUDE.md). Within a session,
the next prompt was sent only after reviewing the REPORT of the previous one.
Short follow-ups (e.g. "commit this") are omitted.

---

## Session 1 — Project setup and CI

### 1.1 Project skeleton

```
Read CLAUDE.md first and follow it for the whole session.

Set up the project skeleton. Do not write any tests yet.

1. Run git init if this is not a git repo yet.
2. Initialize npm. Install @playwright/test, typescript and @types/node
   as devDependencies. Do NOT use `npm init playwright` (it is interactive
   and adds example files and extra browsers).
3. Install the chromium browser only.
4. Create playwright.config.ts:
   - two projects: `ui` (chromium, baseURL https://www.saucedemo.com,
     testDir tests/ui) and `api` (no browser, baseURL
     https://restful-booker.herokuapp.com, testDir tests/api)
   - testIdAttribute: 'data-test'
   - reporters: html (open: 'never') and list
   - trace: 'retain-on-failure', screenshot: 'only-on-failure'
   - retries: 0. Do not add retries; if you think CI needs them, say so
     in the report.
5. Create tsconfig.json (strict mode), .gitignore (node_modules,
   test-results, playwright-report, blob-report, .env).
6. Create the folder structure from CLAUDE.md with empty placeholders
   where needed. Do not create page objects or fixtures yet.
7. Add npm scripts: test, test:ui, test:api, typecheck, report.
8. Create .mcp.json with the Playwright MCP server
   (command: npx, args: ["@playwright/mcp@latest"]).
9. Run `npx playwright test --list` and `npx tsc --noEmit` to prove
   the setup works (0 tests is expected).

Finish with the REPORT in the format defined in CLAUDE.md.
```

### 1.2 Fixes after review

```
Rename the git branch from master to main, add
`.claude/settings.local.json` to .gitignore, and add
`forbidOnly: !!process.env.CI` to playwright.config.ts.
Then show `git status`.
```

```
Replace the `.claude/settings.local.json` line in .gitignore with
`.claude/`.
```

### 1.3 Line endings and GitHub Actions

```
First, add a `.gitattributes` with `* text=auto eol=lf` and renormalize
the repo (`git add --renormalize .`). Commit it separately as
"chore: normalize line endings".

Then create .github/workflows/playwright.yml:
- triggers: push (all branches) and workflow_dispatch
- ubuntu-latest, Node LTS with npm cache
- npm ci, then npx playwright install --with-deps chromium
- npx tsc --noEmit
- npx playwright test (both projects)
- upload playwright-report/ as an artifact named "playwright-report"
  with `if: ${{ !cancelled() }}` so it is uploaded when tests fail too,
  retention 14 days
- also upload test-results/ (traces) on failure only
- set a job timeout

Do not add secrets: credentials for both apps are public demo values
with defaults in data/.

Validate the YAML syntax as far as you can locally. You cannot run it,
so list in the report exactly what I must verify after my first push.

Finish with the REPORT in the format defined in CLAUDE.md.
```

---

## Session 2 — UI tests (Sauce Demo)

### 2.1 Exploration and test plan (no code)

```
Read CLAUDE.md first and follow it for the whole session.

Task: UI tests for https://www.saucedemo.com.
Required by the assignment: 5-7 tests for the main flows (login,
catalog, sorting, cart, checkout) with standard_user, plus 2-3
negative / edge-case tests.

Step 1 — explore, do NOT write code yet:
- Use the Playwright MCP browser. Log in as standard_user and walk
  through: inventory page, all sort options, product details, add/remove
  from cart, cart page, checkout step one, step two (overview), complete.
- Read the accessibility snapshot of each page. Note the data-test
  attributes you will use.
- Try the login page with locked_out_user, a wrong password and empty
  fields; note the exact error messages.

Step 2 — propose a test plan as a table:
| # | Test name (behaviour) | Tags | Steps | Assertions |
7 positive + 3 negative at most. For each assertion, explain why it
proves the behaviour (e.g. sorting: compare the full list with a sorted
copy, not just the first item; checkout: item total + tax = total).

Also list the page objects and fixtures you plan to create.

STOP after the plan. Wait for my approval before writing any code.

Finish with the REPORT in the format defined in CLAUDE.md.
```

### 2.2 Plan approved with changes — positive tests

```
Plan approved with these changes:

1. Login: do NOT use the session cookie. Use a Playwright setup
   project (tests/ui/auth.setup.ts) that logs in through the UI as
   standard_user once and saves storageState to .auth/standard_user.json.
   The ui project depends on it and uses that storageState. Tests about
   login itself (1, 7, N1, N2) must run without storageState
   (test.use({ storageState: { cookies: [], origins: [] } })).
   Add .auth/ to .gitignore.
2. Tax: do NOT assert the 8% rate. Assert: item total = sum of the
   prices read from the inventory; total = item total + tax (in cents);
   tax > 0.
3. Merge tests 4 and 5 into one: add two items from the catalog ->
   badge "2" -> open cart -> same names and prices, quantity 1 ->
   remove one -> one row left, badge "1".
4. Test 2: assert the URL matches inventory-item.html?id=<any number>,
   not a hard-coded id.
5. Keep test 7 (logout), data-driven sorting and data-driven N2.
6. Add .playwright-mcp/ to .gitignore.

Then implement:
1. data/ — users and checkout info (password read from
   process.env.SAUCE_PASSWORD with the public default).
2. pages/ — page objects with locators and actions only, no assertions.
3. fixtures/ — the logged-in setup described above.
4. tests/ui/ — the positive tests from the plan, one file per feature.

Run them, run each new spec with --repeat-each=5 --workers=1,
run npx tsc --noEmit. Do not commit.

Finish with the REPORT in the format defined in CLAUDE.md.
```

### 2.3 Prove the assertions can fail

```
Before committing, prove the key assertions can actually fail.
For each spec below, make ONE temporary change to the expected value,
run only that spec, confirm it fails, then revert:
- sorting: expect the reversed order for "Price (low to high)"
- checkout: add 1 cent to the expected total
- cart: expect badge "3" instead of "2"
- catalog: expect a different product name on the details page
Show me the failure message for each. After reverting, `git diff`
must show no changes to the spec files.

Then check how tags interact with the setup project:
run `npx playwright test --grep @smoke --list` and
`npx playwright test --grep @negative --list`. Tell me whether
ui-setup is included in each. Do not change anything yet, just report.

Also add utils/ to the Structure section of CLAUDE.md.

Then commit everything as
"test(ui): positive scenarios — login, catalog, sorting, cart, checkout, logout".

Finish with the REPORT in the format defined in CLAUDE.md.
```

### 2.4 Negative tests and bug hunting

```
First, two small fixes from your last report:
1. Remove the @smoke and @ui tags from tests/ui/auth.setup.ts —
   you showed that dependency projects ignore tags, so they are
   misleading.
2. Update the playwright.config.ts line in the CLAUDE.md Structure
   section to mention the ui-setup project.

Then implement the negative tests from the plan (tag @negative @ui):
- N1: locked_out_user sees the exact lockout message, URL stays on /
- N2: data-driven — wrong password, empty username, empty password;
  exact message for each, URL stays on /
- N3: checkout step one — Continue with 0, 1, 2 fields filled;
  exact error each time, URL stays on /checkout-step-one.html
Login tests use the empty storageState. Reuse existing page objects;
use data/messages.ts for texts.

Then spend at most 10 minutes looking for real bugs with problem_user
and error_user (sorting, add/remove to cart, checkout form, totals).
Use the Playwright MCP browser. Do NOT write tests that pass because
of a bug. Report each finding in section 4 with steps, expected,
actual and evidence.

Also verify N1–N3 can fail: one temporary change of an expected
message per spec, confirm it fails, revert (check by hash as before).

Run: npx playwright test --project=ui, --repeat-each=5 --workers=1
on the new specs, npx playwright test --grep @negative --list,
npx tsc --noEmit.

Commit as "test(ui): negative scenarios — login errors, checkout
form validation" (fixes 1–2 can go in the same commit).

Finish with the REPORT in the format defined in CLAUDE.md.
```

### 2.5 Bug evidence

```
Copy the two screenshots from .playwright-mcp/ into docs/bugs/
with names bug-problem_user-checkout-lastname.png and
bug-error_user-finish-noop.png. Then run `git grep waitForTimeout`
and confirm none of your exploration scripts are in the repo.
Commit as "docs: bug evidence screenshots".

Finish with the REPORT in the format defined in CLAUDE.md.
```

---

## Session 3 — API tests (Restful Booker)

### 3.1 Exploration and test plan (no code)

```
Read CLAUDE.md first and follow it for the whole session.

Task: API tests for Restful Booker.
Docs: https://restful-booker.herokuapp.com/apidoc/index.html
Required: one flow — auth -> create booking -> update -> delete ->
verify it no longer exists; plus 2-3 negative cases.

Step 1 — explore, no test code yet:
- Read the API docs.
- Make real requests (a small throwaway script or the request
  fixture) to: POST /auth (valid and invalid credentials),
  POST /booking, GET /booking/:id, PUT and PATCH /booking/:id
  (with and without the token), DELETE /booking/:id, GET of a
  deleted id.
- Build a table: | Endpoint | Documented status | Actual status |
  Actual body (short) |. Mark every difference between docs, REST
  conventions and actual behaviour.

Step 2 — propose the test plan: test names, tags, assertions on
status AND body. For each documented-vs-actual difference, propose
whether to treat it as a bug report or an accepted quirk. Do NOT
decide on your own; I decide.

Delete the throwaway script afterwards. STOP after the plan and wait
for my approval.

Finish with the REPORT in the format defined in CLAUDE.md.
```

### 3.2 Decisions on API behaviour and implementation

```
Plan approved with these decisions and changes:

Decisions:
- D1: bug. Test 2 asserts the correct behaviour that holds — no token
  is issued and the body equals { reason: 'Bad credentials' }. Do NOT
  assert status 200. Add a test annotation
  { type: 'bug', description: 'BUG-API-01: returns 200 instead of 401' }.
- D2: accepted quirk. Assert 200 with a comment that it matches the docs.
- D3: bug. In the smoke flow, assert response.ok() for DELETE (not 201),
  then GET -> 404 "Not Found" proves deletion. Add an annotation
  'BUG-API-02: DELETE returns 201 Created'.
- D4: accepted quirk. Assert 403 "Forbidden" with a comment.
- D6, D9: README only, no tests.
- D7: bug. Replace test 4 with: "booking without required fields is
  rejected with 400" — POST /booking with only firstname, expect 400.
  Mark it test.fail() with a comment and annotation
  'BUG-API-03: returns 500 instead of 400'.
- D8: ignore.
- Keep PATCH in the smoke flow. No API client class.

General rule: never assert a value only because the API currently
returns it when we classified that behaviour as a bug.

Implement data/booking.ts, fixtures/api.ts and tests/api/booking.spec.ts
as planned with these changes. Then:
- run `npx playwright test --project=api` three times in a row
- prove the key assertions can fail: one temporary change each in
  test 1 (expected firstname after PUT), test 2 (expect a token key)
  and test 3 (expect 200 instead of 403); confirm each fails, revert,
  verify by hash
- confirm the test.fail() test shows as "expected to fail" in the
  list reporter output
- npx tsc --noEmit

Commit as "test(api): booking CRUD flow and negative cases".

Finish with the REPORT in the format defined in CLAUDE.md.
```

---

## Session 4 — README and final review

### 4.1 README

```
Read CLAUDE.md first.

Write README.md. Read the code and run the tests yourself; do not
invent anything that is not in the repo.

Sections:
1. Short project description (what is tested, stack).
2. How to run: requirements, install, run all / ui / api / by tag,
   open the report, where the CI report artifact is.
3. Project structure (short).
4. What is covered: a table of all tests (name, type, tag, what it
   verifies). Generate it from the code.
5. What is deliberately NOT covered and why.
6. Found bugs — I will give you the list. Format each as:
   ID, title, environment, steps, expected, actual, severity, evidence.
7. A link to AI_WORKLOG.md.

Do not edit AI_WORKLOG.md.

Finish with the REPORT in the format defined in CLAUDE.md.
```

### 4.2 Confirmed bug list and README completion

The first README prompt was sent with a placeholder instead of the bug
list; the agent built only a draft from the repo and marked it for review.
This follow-up supplied the confirmed list:

```
Here is the confirmed bug list. Replace the whole "Found bugs" section
with it (remove the draft marker and TODOs). Format each bug as: ID,
title, environment (user / endpoint), severity, steps, expected,
actual, evidence. For UI bugs reproduce each one once with the
Playwright MCP browser to confirm the steps before writing them. Add
one sentence that problem_user and error_user are intentionally
defective Sauce Demo accounts.

UI: BUG-UI-01 … BUG-UI-06 plus "Also observed" items.
API: BUG-API-01 … BUG-API-04, BUG-DOC-01, plus accepted quirks.
(Full details are in README "Found bugs".)

Also make sure the README has:
- a short "Quality checks" section
- a complete "Not covered" section
- a note that the ✗ next to the test.fail() test in CI logs is the
  expected failure

Also:
- delete tests/api/.gitkeep and any other .gitkeep in folders that now
  have real files
- in CLAUDE.md change "Do not commit or push. I make the commits." to
  "Do not commit unless my prompt explicitly asks. Never push."

Do not edit AI_WORKLOG.md. Commit as "docs: README with coverage and
found bugs".

Finish with the REPORT in the format defined in CLAUDE.md.
```

### 4.3 Final review against the assignment

```
Do a final review of the repository against the assignment.
Do not change any code in this step, only report.

Checklist:
- UI: 5-7 positive tests with standard_user covering login, catalog,
  sorting, cart, checkout; 2-3 negative/edge tests
- API: full flow auth -> create -> update -> delete -> verify gone;
  2-3 negative tests
- CI: workflow on push, report uploaded as artifact even on failure
- README: how to run, covered / not covered, bugs in bug-report format
- CLAUDE.md, AI_WORKLOG.md present; all links in README and
  AI_WORKLOG.md resolve to existing files
- No waitForTimeout, no CSS/XPath without a comment, no hard-coded
  secrets, no skipped tests, no weakened assertions, no test order
  dependency

Run: npx tsc --noEmit, npx playwright test (all), then
npx playwright test --repeat-each=3 --workers=2.

Report each checklist item as OK / MISSING / PROBLEM with the file and
line. Then the REPORT in the format defined in CLAUDE.md.
```

---

## Session 5 — Bonus: text test case to Playwright test pipeline

### 5.1 Pipeline and three examples

```
Read CLAUDE.md first and follow it for the whole session.

Bonus task: a pipeline that turns a text test case into a runnable
Playwright test. Build it in tools/generate-test/.

Design:
- Input: a .md file in tools/generate-test/cases/ with a title, steps
  and expected result.
- generate.ts (run with `npx tsx tools/generate-test/generate.ts
  <case.md>`): builds a prompt from the test case + the rules from
  CLAUDE.md + the public methods of pages/*.ts + fixtures/index.ts,
  and calls Claude Code headless: `claude -p` with the prompt on stdin
  and `--output-format text`. No tools for the model: it must return
  only the TypeScript code of one spec file. This runs on Windows —
  spawn the process so it works there.
- The script strips code fences, writes the spec to
  tests/ui/generated/<case-name>.spec.ts, runs only that file with
  `npx playwright test <file> --project=ui`, and saves
  tools/generate-test/results/<case-name>.md with: input, prompt
  summary, generated code, run result (pass/fail + error), and an
  empty "Manual fixes" section for me.
- No automatic retry or self-fixing. I fix failures by hand.
- Generated tests get the tag @generated.

Then write 3 example cases in tools/generate-test/cases/: one simple
(login with standard_user lands on the catalog), one medium (sorting
by price high to low), one harder (checkout of two items with correct
totals). Run the pipeline on all three and show me the results.

Add tools/generate-test/README.md: how to run, how it works, its
limits. Add tsx as a devDependency if needed.

Do not fix generated specs yourself.
Commit ONLY the pipeline code, cases and README now, as
"feat(bonus): text test case to Playwright test pipeline".
Do NOT commit tests/ui/generated/ or results/ yet — I will commit
them after my manual fixes, so CI never runs a broken generated test.

Finish with the REPORT in the format defined in CLAUDE.md.
```

### 5.2 Recording the manual fixes

All three generated specs passed on the first run. I reviewed them and
fixed them by hand in the editor, then sent:

```
I fixed the three generated specs by hand. Run
`npx playwright test tests/ui/generated --project=ui` and `npx tsc --noEmit`.
In each tools/generate-test/results/*.md fill "Manual fixes" with the diff
between the generated version (saved in that file) and the current spec,
and one line on why each change was made:
- checkout: toContainText -> exact toHaveText for item total and total
  (toContainText would also pass for a wrong longer value); the tax
  regex replaced with a simple format check, since "> 0" is asserted
  separately; removed @smoke (duplicates the hand-written smoke test)
- sorting: expect.poll over allTextContents() -> web-first
  toHaveText(array) on the locator, as CLAUDE.md requires; removed @smoke
- login: removed @smoke only
Add a short "Summary" at the top of tools/generate-test/README.md:
all 3 specs passed on the first run, but 2 of 3 had weaker assertions
than our hand-written tests, and all 3 were tagged @smoke as duplicates.
Then commit tests/ui/generated/ and results/ as
"feat(bonus): generated specs with manual fixes".
Finish with the REPORT in the format defined in CLAUDE.md.
```

### 5.3 Fixing the cause in the generator

```
Close the gaps from your report:
1. In generate.ts, change the prompt so generated specs are tagged
   ['@generated', '@ui'] only (never @smoke or @negative — generated
   specs duplicate hand-written ones). Do not re-run the pipeline.
2. In CLAUDE.md "Tags", add: "Generated specs in tests/ui/generated/
   are tagged @generated @ui instead."
3. Remove the `// FIX:` comments from the three generated specs and add
   the missing final newlines. Change nothing else in them.
4. In the root README.md, add a short "Bonus: test case to Playwright
   test pipeline" section linking to tools/generate-test/README.md,
   and update the test count (3 more UI tests, tagged @generated).
5. In tools/generate-test/README.md Summary, add one line: the @smoke
   tagging was fixed in the generator prompt, not only in the output.
Run npx tsc --noEmit and npx playwright test (all).
Commit as "chore(bonus): generator tags, README link".
Finish with the REPORT in the format defined in CLAUDE.md.
```
