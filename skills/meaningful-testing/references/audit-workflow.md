# Audit workflow

Procedure for reviewing and fixing an entire test suite. Enter only on an explicit request from the user.

## 0. Scope and ground rules

- Confirm scope: whole repository, one package, or one directory. Default to every test file in the repository.
- Confirm the test command(s) and how long a full run takes. Ask if there is a known-flaky list or a quarantine convention already in use.
- Deletion policy: delete immediately only tests that cannot fail or are exact duplicates. Every other `DELETE` candidate goes into the report for the user to confirm before you touch it.
- Never make the suite green by removing signal. Never weaken an assertion to make a test pass. If a strengthened test fails, you may have found a real bug; stop and report it.
- Do not reformat or refactor production code during the audit. Keep the diff about tests.

## 1. Inventory and baseline

1. Identify the runner(s), configuration, and the exact command for a full run.
2. Count test files and tests. Note which are already skipped or marked as expected failures, and whether a reason is recorded.
3. Run the full suite once. Record pass/fail counts, duration, and the slowest tests.
4. If feasible, run it again, ideally in random order or in parallel, to surface flaky tests. Anything that changed result between runs is `QUARANTINE` unless the cause is obvious and local.
5. If the baseline already fails, record which tests fail. Do not fix a pre-existing failure by deleting or skipping the test; classify it and report it.

## 2. Classify every test

Read each test file in full. For every test, or for a tightly related group of tests, record: file, test name, the behavior it protects, a verdict, and a one-line reason.

| Verdict | Criteria | Action |
| - | - | - |
| `KEEP` | Protects real behavior, would fail on a plausible bug, deterministic, not duplicated | None |
| `STRENGTHEN` | Right target, weak assertion: generic matcher, partial check, missing failure reason, missing boundary | Sharpen the assertion, add the boundary |
| `REWRITE` | Right intent, wrong approach: over-mocked, coupled to implementation, sleep-based, re-implements the logic | Rewrite against the public behavior with fakes at the boundary |
| `MERGE` | Several tests cover the same risk with different inputs | One parametrized or table-driven test; every distinct input survives |
| `DELETE` | Cannot fail (tautology, asserts only on a mock, `assert true`), exact duplicate, or tests a removed feature | Immediate for the first two; propose for the rest |
| `QUARANTINE` | Flaky, root cause not fixable within scope | Skip with a reason that names the symptom, add a tracking reference, list in report |

Record gaps separately: important behaviors with no test at all. Apply the seven questions from `SKILL.md` to each gap. Propose tests for the ones that pass; do not mass-add.

### Fast heuristics for spotting weak tests

Search the suite for these before reading line by line. Each is a candidate, not a verdict.

- `assertTrue(x)`, `toBeTruthy()`, `toBeDefined()`, `isNotNull()` as the main assertion on a non-boolean
- `toHaveBeenCalled()` or `verify(x).called()` with no `With(...)` and no assertion on state or result
- `expect.anything()`, `any()`, `_` wildcards in most argument positions
- `toMatchSnapshot()` on objects larger than a screen
- `sleep(`, `setTimeout(`, `time.sleep(`, `Thread.sleep(` inside a test
- Test names like `test1`, `works`, `should work`, `testFunctionName`
- Tests with no assertion at all, or with assertions inside a conditional
- `try { ... } catch { }` that swallows the failure
- Mocks or spies on the module under test itself
- `skip`, `xit`, `xtest`, `@Ignore`, `@pytest.mark.skip` without a reason string
- Several tests whose bodies differ only in literal values
- Expected values that look copied from output: long opaque strings, unexplained floats, timestamps

## 3. Fix in batches

Batch by file or module so each batch is reviewable on its own.

For each batch:

1. Apply the changes.
2. Run the affected tests, then the full suite. Record both results.
3. For at least one `STRENGTHEN` or `REWRITE` in the batch, perform a manual mutation: break the code under test on purpose, confirm the test now fails, revert. This confirms the new assertion catches something.
4. For every `MERGE`, confirm each distinct input from the originals is present in the table.
5. For every `QUARANTINE`, skip with a reason that names the observed symptom and add a tracking reference the project uses (issue, TODO with owner, or an entry in the project's flaky list).
6. For `DELETE` applied immediately, keep the one-line reason in the commit message or the report.

If a test fails after strengthening and the test is correct, the code has a bug. Do not adjust the test to pass. Report the bug with the failing test as evidence and continue with the rest of the audit.

## 4. Report

```
## Test suite audit

Scope: <paths>
Command: <exact command>

Baseline: <n> tests, <pass>/<fail>/<skipped>, <duration>, flaky: <list or none>
After:    <n> tests, <pass>/<fail>/<skipped>, <duration>

### Changes
| File | Test | Verdict | What changed |
| ... |

### DELETE candidates awaiting confirmation
| File | Test | Reason |
| ... |

### Gaps
| Behavior | Recommendation | Reason |
| ... |     | test / no test |

### Bugs surfaced by strengthened tests
- ...

### Quarantined
| Test | Symptom | Suspected cause | Tracking |
| ... |

### Remaining risk
- ...
```

Keep the report factual. Numbers come from real runs; include the command output or a summary of it.
