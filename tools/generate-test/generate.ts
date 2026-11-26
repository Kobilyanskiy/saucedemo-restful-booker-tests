/**
 * Text test case -> Playwright spec.
 *
 *   npx tsx tools/generate-test/generate.ts tools/generate-test/cases/<case>.md
 *
 * 1. Builds a prompt from the case, the rules in CLAUDE.md, the public API of
 *    pages/*.ts, fixtures/index.ts and the exports of data/ and utils/.
 * 2. Sends it to Claude Code headless (`claude -p`, prompt on stdin, no tools).
 * 3. Writes the returned code to tests/ui/generated/<case>.spec.ts.
 * 4. Runs only that file (`npx playwright test <file> --project=ui`).
 * 5. Writes tools/generate-test/results/<case>.md.
 *
 * No retries and no self-fixing: a failing spec is left as is for manual fixes.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = resolve(__dirname, '..', '..');
const GENERATED_DIR = join(ROOT, 'tests', 'ui', 'generated');
const RESULTS_DIR = join(ROOT, 'tools', 'generate-test', 'results');
const CLAUDE_TIMEOUT_MS = 5 * 60_000;
const PLAYWRIGHT_TIMEOUT_MS = 5 * 60_000;

// Sections of CLAUDE.md that apply to writing a UI spec.
const CLAUDE_MD_SECTIONS = ['Writing UI tests (Sauce Demo)', 'Test data and secrets', 'Tags'];

type RunResult = { status: number | null; stdout: string; stderr: string; error?: Error };

// ---------- process helpers ----------

/** Quote one argument for cmd.exe (used only on Windows with shell: true). */
function quoteWin(arg: string): string {
  if (arg === '') return '""';
  return /[\s"&|<>^]/.test(arg) ? `"${arg.replace(/"/g, '""')}"` : arg;
}

/**
 * Runs a command and waits for it. On Windows `npx` (and an npm-installed
 * `claude`) are .cmd shims, which Node can only start through a shell, so the
 * shell is used there and every argument is quoted explicitly.
 */
function run(cmd: string, args: string[], opts: { input?: string; cwd: string; timeout: number }): RunResult {
  const isWin = process.platform === 'win32';
  const res = isWin
    ? spawnSync([cmd, ...args.map(quoteWin)].join(' '), {
        cwd: opts.cwd,
        input: opts.input,
        encoding: 'utf8',
        shell: true,
        timeout: opts.timeout,
        maxBuffer: 50 * 1024 * 1024,
        windowsHide: true,
      })
    : spawnSync(cmd, args, {
        cwd: opts.cwd,
        input: opts.input,
        encoding: 'utf8',
        timeout: opts.timeout,
        maxBuffer: 50 * 1024 * 1024,
      });
  return { status: res.status, stdout: res.stdout ?? '', stderr: res.stderr ?? '', error: res.error };
}

const stripAnsi = (s: string): string => s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');

// ---------- prompt building ----------

type TestCase = { name: string; title: string; markdown: string };

function readCase(file: string): TestCase {
  const markdown = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trim();
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const missing = [
    !title && '"# <title>"',
    !/^##\s+Steps\s*$/im.test(markdown) && '"## Steps"',
    !/^##\s+Expected result\s*$/im.test(markdown) && '"## Expected result"',
  ].filter(Boolean);
  if (missing.length) throw new Error(`${file} is missing ${missing.join(', ')}`);
  return { name: basename(file, extname(file)), title: title!, markdown };
}

/** Returns "## <heading>" sections of CLAUDE.md, body included. */
function claudeMdRules(): string {
  const md = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8').replace(/\r\n/g, '\n');
  return CLAUDE_MD_SECTIONS.map((heading) => {
    const start = md.indexOf(`## ${heading}\n`);
    if (start === -1) throw new Error(`CLAUDE.md has no "## ${heading}" section`);
    const next = md.indexOf('\n## ', start + 3);
    return md.slice(start, next === -1 ? undefined : next).trim();
  }).join('\n\n');
}

/**
 * Public surface of one page object: the class name, readonly locators and
 * method signatures, with the comment lines directly above them. Private
 * members and method bodies are dropped.
 */
function pageObjectApi(file: string): string {
  const lines = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let comments: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('//') || line.startsWith('/**') || line.startsWith('*')) {
      comments.push(raw);
      continue;
    }
    const isExportedType = /^export (type|interface) /.test(line);
    const isClass = /^export class /.test(line);
    const isField = /^readonly \w+: /.test(line);
    const isMethod = /^(async\s+)?(?!constructor|if|for|while|return|await)\w+\(.*\)(:\s*[^{]+)?\s*\{$/.test(line);
    if (isExportedType) out.push(...comments, raw);
    else if (isClass) out.push(...comments, raw);
    else if (isField) out.push(...comments, raw);
    else if (isMethod) out.push(...comments, raw.replace(/\s*\{$/, ';'));
    comments = [];
  }
  if (out.some((l) => /^export class /.test(l.trim()))) out.push('}');
  return out.join('\n');
}

/** Exported declarations of a data/ or utils/ file, so the model knows what it can import. */
function moduleExports(file: string): string {
  return readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trim();
}

function tsFiles(dir: string): string[] {
  return readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith('.ts'))
    .sort()
    .map((f) => join(ROOT, dir, f));
}

type Prompt = { text: string; parts: { label: string; chars: number }[] };

function buildPrompt(tc: TestCase): Prompt {
  const rel = (f: string) => relative(ROOT, f).replace(/\\/g, '/');
  const pages = tsFiles('pages').map((f) => `// ${rel(f)}\n${pageObjectApi(f)}`).join('\n\n');
  const fixtures = `// fixtures/index.ts\n${readFileSync(join(ROOT, 'fixtures', 'index.ts'), 'utf8').trim()}`;
  const helpers = [...tsFiles('data'), ...tsFiles('utils')]
    .map((f) => `// ${rel(f)}\n${moduleExports(f)}`)
    .join('\n\n');

  const task = `You are generating ONE Playwright + TypeScript spec file for this repository.

Output rules (strict):
- Reply with the TypeScript source of the spec file ONLY. No explanations, no markdown outside one optional \`\`\`ts block.
- The file will be saved as tests/ui/generated/${tc.name}.spec.ts. Import paths are relative to that folder:
  import { test, expect } from '../../../fixtures';
  pages are '../../../pages/<Name>', data '../../../data/<name>', utils '../../../utils/<name>'.
- Use ONLY the page objects, fixtures, data and helpers listed below. Do not invent locators, methods,
  page objects or data. Do not use page.locator(), CSS or XPath. If a step cannot be done with the
  listed API, use the closest listed API and add a "// TODO(manual):" comment explaining the gap.
- The \`ui\` project already has a logged-in standard_user session (storageState). Start such tests
  with \`await inventoryPage.goto()\`. Only a test about login itself starts logged out, with
  \`test.use({ storageState: { cookies: [], origins: [] } })\` and \`await loginPage.goto()\`.
- Wrap the test(s) in test.describe('${tc.title.replace(/'/g, "\\'")}', ...).
- Every test has exactly the tags ['@generated', '@ui']. Never add '@smoke' or '@negative': generated
  specs duplicate hand-written ones, which already carry those tags.
  Example: test('user can ...', { tag: ['@generated', '@ui'] }, async ({ ... }) => { ... });
- Test names describe behaviour ("user can sort products by price high to low").
- Never use page.waitForTimeout(), test.skip/fixme/fail, retries or custom timeouts.

Project rules (from CLAUDE.md):
${claudeMdRules()}

Page objects (public API only; method bodies omitted):
${pages}

Fixtures:
${fixtures}

Test data and helpers you may import:
${helpers}

Test case to implement (${tc.name}.md):
${tc.markdown}
`;

  return {
    text: task,
    parts: [
      { label: `CLAUDE.md sections: ${CLAUDE_MD_SECTIONS.join(', ')}`, chars: claudeMdRules().length },
      { label: `Page objects: ${tsFiles('pages').map((f) => basename(f, '.ts')).join(', ')}`, chars: pages.length },
      { label: 'Fixtures: fixtures/index.ts', chars: fixtures.length },
      { label: `Data/utils: ${[...tsFiles('data'), ...tsFiles('utils')].map(rel).join(', ')}`, chars: helpers.length },
      { label: `Test case: ${tc.name}.md`, chars: tc.markdown.length },
    ],
  };
}

// ---------- model call ----------

function generateCode(prompt: string): string {
  const args = [
    '-p',
    '--output-format', 'text',
    '--tools', '', // no built-in tools: the model can only answer with text
    '--strict-mcp-config', // and no MCP servers
    '--no-session-persistence',
  ];
  if (process.env.GENERATE_TEST_MODEL) args.push('--model', process.env.GENERATE_TEST_MODEL);

  // Run outside the repo so the project CLAUDE.md is not loaded a second time:
  // the prompt already carries the rules that apply.
  const res = run('claude', args, { input: prompt, cwd: tmpdir(), timeout: CLAUDE_TIMEOUT_MS });
  if (res.error) throw new Error(`Could not run claude: ${res.error.message}`);
  if (res.status !== 0) {
    throw new Error(`claude exited with ${res.status}\n${res.stderr || res.stdout}`.trim());
  }
  const code = stripCodeFences(res.stdout);
  if (!code) throw new Error('claude returned an empty answer');
  return code;
}

/** Takes the first fenced code block if there is one, otherwise the whole answer. */
function stripCodeFences(answer: string): string {
  const text = answer.replace(/\r\n/g, '\n').trim();
  const fenced = text.match(/```[a-zA-Z]*\n([\s\S]*?)\n```/);
  return (fenced ? fenced[1] : text).trim() + '\n';
}

// ---------- run + report ----------

type TestRun = { passed: boolean; command: string; output: string };

function runSpec(specFile: string): TestRun {
  const relSpec = relative(ROOT, specFile).replace(/\\/g, '/');
  const args = ['playwright', 'test', relSpec, '--project=ui'];
  const res = run('npx', args, { cwd: ROOT, timeout: PLAYWRIGHT_TIMEOUT_MS });
  const output = stripAnsi(`${res.stdout}\n${res.stderr}`).trim();
  return {
    passed: res.status === 0,
    command: `npx ${args.join(' ')}`,
    output: res.error ? `${res.error.message}\n${output}` : output,
  };
}

/** Error part of the Playwright output: from the first numbered failure to the summary. */
function failureExcerpt(output: string): string {
  const lines = output.split('\n');
  const start = lines.findIndex((l) => /^\s+\d+\) /.test(l));
  const excerpt = start === -1 ? lines.slice(-60) : lines.slice(start);
  return excerpt.slice(0, 120).join('\n').trim();
}

function writeResult(file: string, r: {
  tc: TestCase;
  prompt: Prompt;
  specPath: string;
  code: string;
  run?: TestRun;
  generationError?: string;
}): void {
  const fence = (lang: string, body: string) => `\`\`\`${lang}\n${body.trim()}\n\`\`\``;
  const status = r.generationError ? 'GENERATION FAILED' : r.run!.passed ? 'PASS' : 'FAIL';
  const rel = (f: string) => relative(ROOT, f).replace(/\\/g, '/');

  const runSection = r.generationError
    ? `**Result:** GENERATION FAILED — the spec was not written or run.\n\n${fence('text', r.generationError)}`
    : [
        `**Result:** ${status}`,
        `**Command:** \`${r.run!.command}\``,
        r.run!.passed ? '' : `**Error:**\n\n${fence('text', failureExcerpt(r.run!.output))}`,
        `<details><summary>Full output</summary>\n\n${fence('text', r.run!.output)}\n\n</details>`,
      ]
        .filter(Boolean)
        .join('\n\n');

  const md = `# ${r.tc.title}

- Case: \`${r.tc.name}\`
- Generated: ${new Date().toISOString()}
- Spec: \`${rel(r.specPath)}\`
- Status: **${status}**

## Input

${r.tc.markdown.replace(/^(#+)/gm, '##$1')}

## Prompt summary

Sent to \`claude -p --output-format text --tools "" --strict-mcp-config\` on stdin, ${r.prompt.text.length} characters in total:

${r.prompt.parts.map((p) => `- ${p.label} (${p.chars} chars)`).join('\n')}
- Output rules: one spec file only, imports from \`../../../\`, tags \`@generated\` + \`@ui\` only, listed API only

## Generated code

${r.code ? fence('ts', r.code) : '_none_'}

## Run result

${runSection}

## Manual fixes

<!-- What you changed by hand and why (locator / timing / test data / environment / generator mistake). -->
`;
  writeFileSync(file, md);
}

// ---------- main ----------

function main(): void {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: npx tsx tools/generate-test/generate.ts <case.md>');
    process.exit(2);
  }
  const caseFile = resolve(input);
  if (!existsSync(caseFile)) {
    console.error(`No such file: ${input}`);
    process.exit(2);
  }

  const tc = readCase(caseFile);
  const prompt = buildPrompt(tc);
  const specPath = join(GENERATED_DIR, `${tc.name}.spec.ts`);
  const resultPath = join(RESULTS_DIR, `${tc.name}.md`);
  mkdirSync(dirname(specPath), { recursive: true });
  mkdirSync(RESULTS_DIR, { recursive: true });

  console.log(`[${tc.name}] calling claude (${prompt.text.length} chars prompt)...`);
  let code: string;
  try {
    code = generateCode(prompt.text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    writeResult(resultPath, { tc, prompt, specPath, code: '', generationError: msg });
    console.error(`[${tc.name}] generation failed: ${msg}`);
    console.log(`[${tc.name}] result: ${relative(ROOT, resultPath)}`);
    process.exit(1);
  }

  writeFileSync(specPath, code);
  console.log(`[${tc.name}] wrote ${relative(ROOT, specPath)}, running it...`);

  const testRun = runSpec(specPath);
  writeResult(resultPath, { tc, prompt, specPath, code, run: testRun });
  console.log(`[${tc.name}] ${testRun.passed ? 'PASS' : 'FAIL'} — result: ${relative(ROOT, resultPath)}`);
  process.exit(testRun.passed ? 0 : 1);
}

main();
