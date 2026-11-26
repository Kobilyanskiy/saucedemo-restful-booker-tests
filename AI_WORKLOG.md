# AI Worklog

How I built this test suite together with an AI agent (Claude Code),
what instructions it got, and where it went wrong.

## Setup and workflow

- **Agent:** Claude Code (Claude Desktop, Code tab) with the Playwright MCP
  server (`.mcp.json`) so the agent could open the real sites and read
  accessibility snapshots instead of guessing locators.
- **Instructions:** [CLAUDE.md](CLAUDE.md). It contains the project scope,
  locator and assertion rules, specifics of both apps, and guardrails for
  fixing failing tests: classify the failure first, never weaken
  assertions, never write a test that passes because of an application
  bug, stop and ask instead.
- **Report format:** every task ended with a fixed REPORT block (files
  changed, commands and results, failures with classification, suspected
  bugs, assumptions, what was deliberately not done, what I should check).
  This made each step reviewable.
- **Isolated sessions:** I split the work into separate sessions with a
  clean context: setup + CI → UI → API → README. Shared rules lived in
  CLAUDE.md, so no chat history had to be carried over. Each UI/API
  session ran in its own git worktree branch, which I merged into `main`
  only after reviewing it.
- **Plan before code:** for UI and API the agent first explored the app
  and proposed a test plan, then stopped. I reviewed and changed the plan
  before any code was written.
- **Review loop after every step:** read the report, check the diff,
  verify claims with my own commands (`git show --stat`, `git grep`,
  `npx playwright test --list`), then commit.
- I also used a second AI chat (Claude) as a reviewer for plans and
  reports. Its suggestions were checked the same way; one of them was
  wrong (see the end of this file).

## Key prompts

Full prompts, word for word, are in [docs/prompts.md](docs/prompts.md).
The most important ones, summarised:

1. **Setup (1.1):** build the skeleton from CLAUDE.md without
   `npm init playwright`, two projects (`ui`, `api`), `retries: 0`, no
   tests yet.
2. **UI exploration (2.1):** walk through the site with the Playwright MCP
   browser, read the accessibility snapshots, propose a test plan with an
   explanation of why each assertion proves the behaviour, then stop.
3. **Plan approval with changes (2.2):** a setup project with
   `storageState` instead of the session cookie, no assertion on the 8%
   tax rate, merged cart tests, no hard-coded product id.
4. **Proving tests can fail (2.3, 2.4, 3.2):** one temporary wrong
   expectation per spec, confirm the failure, revert, verify by hash.
5. **API decisions (3.2):** the rule quoted exactly: "never assert a value
   only because the API currently returns it when we classified that
   behaviour as a bug." Bugs are marked with annotations, and the
   500-instead-of-400 bug got a `test.fail()` test.

## Where the agent went wrong and how I noticed

### 1. A wrong explanation of how Playwright works
**What happened:** the agent tagged `auth.setup.ts` with `@smoke`, saying
otherwise `--grep @smoke` would not run the login setup.
**How I noticed:** I didn't accept the explanation and asked it to check
with `npx playwright test --grep @smoke --list` and `--grep @negative
--list`. The setup project ran in every case: dependency projects always
run and ignore tags.
**Fix:** removed the tags and added a comment explaining why the setup has
none.
**Lesson:** an agent's claims about tool behaviour need an experiment,
not trust.

### 2. Proposing to encode API bugs as expected results
**What happened:** in the API plan the agent proposed that "whichever you
choose, the test asserts the actual status", e.g. `200` for bad
credentials and `201` for DELETE, even for behaviour we classified as
bugs.
**How I noticed:** reviewing the plan against the CLAUDE.md rule "do not
write the test to match it".
**Fix:** the tests assert the correct behaviour that holds (no token is
issued; DELETE is `2xx` and the booking is gone), and the bugs are marked
with `bug` annotations. The 500-instead-of-400 case is a `test.fail()`
test that will turn red when the bug is fixed. I checked with
`git grep "201" tests/api` that `201` appears only in comments.

### 3. Weak or over-specific assertions in the UI plan
**What happened:** the first UI plan asserted an undocumented 8% tax rate
the agent had measured itself, hard-coded the product id `id=4`, had two
overlapping cart tests, and logged in by injecting the `session-username`
cookie (which works only because the site never checks the password).
**How I noticed:** reviewing every assertion against the question "does
this prove the requirement, or the agent's guess?".
**Fix:** arithmetic checks instead of the tax rate (item total = sum of
prices, total = item total + tax, tax > 0), a regex for the id, merged
cart tests, and a setup project that logs in through the UI and saves
`storageState`.

### 4. Green tests that were never seen failing
**What happened:** all tests passed on the first run, and the agent noted
in its own report: "I didn't check that the assertions can fail".
**How I noticed:** the REPORT section "What I deliberately did NOT do".
**Fix:** for every key assertion (UI and API) the agent made one temporary
wrong expectation, showed the failure message, reverted, and verified the
files by hash. All of them failed with clear messages.

### 5. Reports that can't be pasted as-is
**What happened:** one report contained a draft-like self-correction in
the middle of a sentence ("tax $3.20… no: tax $3.84"), and the screenshot
offered as evidence for the error_user Finish bug could not prove anything
on its own, because the URL isn't visible on a still image (the agent
flagged that itself).
**How I noticed:** reading the reports before using them in the README.
**Fix:** I didn't copy report text into the README directly. The bugs
were reproduced again in a later session (I logged in, the agent checked
the behaviour), and the Finish bug describes the URL and cart badge in
text next to the screenshot.

## Other observations

- **Good behaviour worth noting:** when my prompt had a placeholder
  instead of the bug list, the agent did not invent bugs. It built a draft
  only from what was in the repo and marked it "pending review". It also
  pointed out when my prompt conflicted with CLAUDE.md (commits) instead
  of silently choosing one.
- **Behaviour differs between sessions:** in one session the agent logged
  in to Sauce Demo through the MCP browser, in another it refused to type
  even the public demo password. I did those logins myself.
- **The reviewer AI was wrong too:** the second chat advised pinning
  TypeScript to 5.x. TypeScript 7 (the native Go port) is the current
  stable release and type-checks this project fine, so I kept 7 after
  checking the release notes.
