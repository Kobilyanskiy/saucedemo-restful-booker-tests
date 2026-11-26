# Text test case → Playwright test

A small pipeline that turns a written test case (`cases/*.md`) into a runnable
Playwright spec for the Sauce Demo UI suite, runs it once and writes a report.

## Summary

On the three example cases, all 3 generated specs passed on the first run, but
2 of 3 (checkout, sorting) had weaker assertions than our hand-written tests
(`toContainText` instead of exact `toHaveText`, `expect.poll` instead of a
web-first `toHaveText(array)`), and all 3 were tagged `@smoke` although they
duplicate existing smoke tests. The fixes are recorded in "Manual fixes" in
each `results/<case>.md`.
The `@smoke` tagging was then fixed in the generator prompt too, not only in the output:
generated specs are now always tagged `@generated` `@ui`.

## How to run

Requirements: dependencies installed (`npm ci`), Chromium installed, and the
`claude` CLI (Claude Code) on `PATH` and logged in.

```powershell
npx tsx tools/generate-test/generate.ts tools/generate-test/cases/login-standard-user.md
```

Output:

| File | What it is |
| --- | --- |
| `tests/ui/generated/<case>.spec.ts` | The generated spec (overwritten on every run) |
| `tools/generate-test/results/<case>.md` | Input, prompt summary, generated code, run result and an empty "Manual fixes" section |

Exit code: `0` if the generated spec passed, `1` if generation or the test failed,
`2` for bad usage. Set `GENERATE_TEST_MODEL` to pass `--model` to `claude`.

## Writing a case

A Markdown file in `cases/` with a `# Title`, a `## Steps` section and an
`## Expected result` section (the script refuses a file without them).
`## Preconditions` and a `Type:` line are optional but help the model choose
logged-in vs. logged-out and `@smoke` vs. `@negative`. The file name becomes the
spec name. Use the exact UI texts (product names, sort labels).

## How it works

1. **Prompt.** `generate.ts` builds one prompt from:
   - output rules (one spec file only, import paths from `tests/ui/generated/`,
     tags `@generated` + `@ui` only, never `@smoke`/`@negative`, use only the listed API);
   - the sections *Writing UI tests*, *Test data and secrets* and *Tags* of `CLAUDE.md`;
   - the public API of every `pages/*.ts` (class, `readonly` locators, method
     signatures and their comments, no method bodies);
   - `fixtures/index.ts`;
   - `data/*.ts` and `utils/*.ts`, so the model can import users, product names,
     messages and the cents helpers instead of hard-coding them;
   - the test case itself.
2. **Model.** Runs `claude -p --output-format text --tools "" --strict-mcp-config
   --no-session-persistence` with the prompt on stdin. `--tools ""` and
   `--strict-mcp-config` give the model no tools, so it can only answer with
   text. It runs in the OS temp folder so the project `CLAUDE.md` is not loaded a
   second time (the prompt already has the rules that apply).
3. **Code.** The first fenced code block is taken (or the whole answer if there is
   none) and written to `tests/ui/generated/<case>.spec.ts`.
4. **Run.** `npx playwright test tests/ui/generated/<case>.spec.ts --project=ui`
   (which also runs `ui-setup` for the logged-in session).
5. **Report.** `results/<case>.md` with pass/fail, the error excerpt and the full
   output.

Windows: `npx` (and an npm-installed `claude`) are `.cmd` shims, which Node can
only start through a shell, so on Windows the commands run with `shell: true` and
each argument is quoted explicitly. On other platforms they are spawned directly.

There is **no retry and no self-fixing**: a failing spec is left exactly as
generated. Fix it by hand and note what you changed in "Manual fixes".

## Limits

- **The model never sees the page.** It only knows the page-object API. A step
  that needs a locator the page objects do not have cannot be implemented
  correctly; the prompt asks the model to leave a `// TODO(manual):` comment
  instead of inventing one, but this is not enforced.
- **UI only.** API specs (`tests/api/`) are not supported.
- **Output is not deterministic.** Running the same case twice can give different
  code. The spec is overwritten on every run, so commit or copy manual fixes first.
- **A passing run is not a review.** The generator can still produce weaker
  assertions than the hand-written suite (e.g. `toContainText` instead of
  `toHaveText`) or miss part of the expected result. Read the code against the
  case before committing.
- **Only the first code block is used.** If the model returns several files or
  explanations, the rest is dropped.
- **Generated specs live under `tests/ui/`,** so the `ui` project and CI pick them
  up once committed. Commit a generated spec only after it has been reviewed and
  passes.
- **Each run is one paid model call** plus one Playwright run (~1–2 min per case).
- The page-object API is extracted with simple line patterns (one member per
  line, as the current page objects are written). Multi-line signatures would be
  missed.
