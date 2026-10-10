---
name: meaningful-testing
description: Writes and reviews tests that catch real bugs instead of inflating coverage. Use when adding, changing, or reviewing tests, verifying a bug fix, fixing flaky tests, or deciding whether a change needs tests at all. On explicit request ("review all tests", "audit the test suite", "clean up our tests") it audits the whole suite and fixes weak, duplicate, or flaky tests. Not for test-runner or CI configuration, or for docs-only changes.
license: MIT
---

# Meaningful Testing

A test earns its place only if it can fail on a realistic bug. A test that cannot fail, or fails only when someone refactors, is a maintenance cost with no return. Coverage is a byproduct of good tests, never the goal.

## When to use

- Writing or changing tests for new or modified code
- Deciding whether a change needs tests at all
- Verifying a bug fix, fixing flaky tests, reviewing tests in a PR
- Auditing a whole test suite, but only when the user asks for it (see [Audit mode](#audit-mode))

Do not use for test-runner or CI configuration, docs-only changes, or when the user explicitly asks for code without tests.

## Before writing any test

Read the code under test and its existing tests first. Then answer these for each test you intend to write:

1. What observable behavior or invariant does it protect?
2. What realistic regression would break it?
3. Is that risk already covered by an existing test?
4. Would this test fail if the regression occurred?
5. Is this the simplest reliable way to detect it?
6. Will it still pass after a behavior-preserving refactor?
7. Is its maintenance and CI cost justified by the risk?

If any answer is "nothing", "no", or "already covered", do not write the test. "No new tests needed because X" is a valid result. State it explicitly, with the reason and a pointer to the existing coverage.

## Rules

- Use the project's existing test framework, helpers, naming, and file layout. Do not introduce a new test library or a parallel convention.
- Derive expected values independently of the implementation: from the spec, a hand calculation, an invariant, or a known-good source. Never paste the code's current output into an assertion without verifying it is correct.
- For bug fixes: write the test first, run it, confirm it fails for the right reason, then fix. A regression test that never failed proves nothing.
- Assert on outcomes (return values, state, emitted events, persisted data), not on how the code reached them.
- Mock at I/O boundaries you do not own: network, clock, randomness, filesystem, external services. Do not mock the module under test or its cheap in-process collaborators. Prefer fakes over scripted mocks.
- Use the cheapest level that catches the bug: unit for logic, integration for wiring and contracts, end-to-end only for critical paths nothing else covers.
- Tests must be deterministic and order-independent. Control time and randomness. Never use an arbitrary sleep; wait on a condition with a deadline.
- Prioritize boundaries and failure paths over additional happy paths: empty, one, many, max, just-outside, invalid input, dependency error, concurrent access.
- Never weaken an assertion, widen a tolerance, add a retry, skip, or delete a test to make CI pass. A failing test is information. Find out what it says.
- Never claim tests pass without running them. Report the exact command and the real result. If you cannot run them, say so.

## Anti-patterns

Each of these is wrong by default. The parenthesis says when it is genuinely fine.

- Writing tests to reach a coverage number (fine: using the coverage report to find untested risk, then judging each case)
- Testing trivial getters, setters, and pass-throughs (fine: when they contain logic such as validation, defaults, or transformation)
- Asserting only that a mock was called (fine: when the call is the contract, e.g. "sends exactly one email", "never charges twice"; then assert the arguments that matter)
- Re-implementing production logic in the test to compute the expected value (fine: a deliberately naive reference implementation in a differential or property-based test)
- Snapshot tests on large or volatile output (fine: small, stable, hand-reviewed output such as CLI help text)
- Hardcoding the current output as the expected value without checking it (never; it freezes existing bugs)
- Arbitrary `sleep` (never; use fake timers or poll for a condition with a deadline)
- End-to-end tests for logic a unit test can cover (fine: a few end-to-end tests on critical paths that cross real boundaries)
- Testing private functions or internal structure (fine: a pure, complex algorithm that is hard to reach through the public API; give it its own stable interface and test that)
- Mocking everything the unit touches (fine: mocking only the slow, flaky, or side-effecting boundary)
- Generating large suites without a risk analysis (never)

Reasoning, checklists, and examples: [references/testing-principles.md](references/testing-principles.md), [references/test-examples.md](references/test-examples.md).

## Audit mode

Enter only when the user explicitly asks to review, audit, or clean up existing tests as a whole, for example "review all tests", "audit the test suite", or by invoking this skill with an audit request. Do not start a suite-wide audit on your own while doing other work. If you notice systemic problems, mention them and offer the audit.

Follow [references/audit-workflow.md](references/audit-workflow.md):

1. Inventory the suite and record a baseline run (results, duration, flaky tests).
2. Classify every test: `KEEP`, `STRENGTHEN`, `REWRITE`, `MERGE`, `DELETE`, or `QUARANTINE`, each with a one-line reason. Note gaps separately.
3. Fix in batches, running the suite after each batch. Delete immediately only tests that cannot fail or are exact duplicates. List every other `DELETE` candidate for the user to confirm.
4. Report the result.

## Reporting

When you finish test work, state:

- Which behaviors are now protected, and by which tests
- What you deliberately did not test, and why
- The exact command you ran and its real result (pass/fail counts, duration)
- Any remaining risk you see
