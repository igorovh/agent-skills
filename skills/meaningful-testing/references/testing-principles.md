# Testing principles

Detailed reasoning behind the rules in `SKILL.md`. Language-agnostic; tool names are examples, not requirements.

## 1. Start from behavior, not from code

A test protects a promise the code makes to its callers. Find the promise before touching the test file:

- Read the spec, ticket, docstring, type signature, or public API. Write down, in one sentence each, what the unit guarantees.
- Read the diff if this is a change. The regression most likely to happen is the one that undoes or breaks what was just changed.
- List realistic failure modes: wrong branch taken, off-by-one at a boundary, error from a dependency not handled, wrong type coerced, state not reset, concurrent calls interleaving, timezone or encoding mishandled.
- Read the existing tests for this unit and its neighbors. Note what they already protect. Your new test must cover a risk they do not.

If the promise is "returns whatever the dependency returned", there is no logic to protect and usually no test to write.

## 2. Choosing the test level

| Level | Catches | Cost | Use for |
| - | - | - | - |
| Unit | Logic errors, branching, boundary math, error mapping | Milliseconds, no setup | The bulk of risk in any codebase |
| Integration | Wiring, configuration, SQL, serialization, contracts with libraries and frameworks | Seconds, real dependencies in-process or in containers | Code whose risk is in how pieces connect |
| Contract | Disagreement between a consumer and a provider | Medium | Service boundaries you do not control end to end |
| End-to-end | Broken critical user journeys across real boundaries | Slow, brittle, hard to diagnose | A handful of flows where failure is unacceptable |

Push each risk down to the cheapest level that can detect it. Do not test the same risk at two levels. An end-to-end test that fails because of a boundary condition in a pure function is a unit test in the wrong place.

## 3. Mocking boundaries

Mock what you do not own and what is slow, non-deterministic, or side-effecting: network, clock, randomness, filesystem, external APIs, message brokers, payment providers.

Do not mock the module under test, pure functions, or in-process collaborators that are cheap and deterministic. A test that mocks everything around the unit verifies that the mocks return what you told them to.

Prefer fakes over mocks. A fake is a working in-memory implementation (an in-memory repository, a fake clock, a stub HTTP server). It behaves, so the test can assert on outcomes. A mock only echoes scripted responses, so the test ends up asserting on calls.

Smells:

- More lines of mock setup than assertions
- The test breaks when you rename a private method
- `verify(x).wasCalled()` with no assertion about the result or state
- The same dependency mocked differently in every test with no shared fake

When a call assertion is the right test: when the side effect is the behavior. "Sends exactly one confirmation email", "writes an audit record with the actor id", "never calls the payment API twice for the same order". Assert the arguments that carry meaning, not every argument.

## 4. Deriving expected values

In order of preference:

1. **Specification or documentation.** The expected value is written down somewhere outside the code.
2. **Hand calculation.** Compute it yourself and show the work in a short comment: `// 3 items × 19.99, 10% discount, rounded half-up = 53.97`.
3. **Invariant.** Round-trip (`decode(encode(x)) == x`), idempotence (`f(f(x)) == f(x)`), order independence, monotonicity, conservation (totals before and after match).
4. **Known-answer vectors.** Test vectors from an RFC, a standard, or a trusted reference implementation.
5. **Differential testing.** Compare against a deliberately naive implementation that is obviously correct even if slow.

Never run the code and paste its output into the assertion. If the code is wrong, the test now protects the bug. When capturing current behavior is the only option (see [section 11](#11-legacy-code-and-characterization-tests)), label the test as a characterization test and verify a sample of values by hand.

## 5. Making assertions that bite

For every assertion, name the plausible bug that would make it fail. If you cannot, sharpen it or delete it.

- Specific over generic: `equals 42` over `is a number`; `equals [a, b]` over `has length 2`; `throws ValidationError for field "email"` over `throws`.
- Assert the whole relevant state, not one convenient field. If a function returns a record, check every field the behavior affects.
- Negative tests must check *why* it failed. "Throws" passes when the code throws a `NullPointerException` from a different bug.
- Avoid `toBeTruthy()` / `assertTrue(x)` on non-booleans, `toBeDefined()`, `expect.anything()` as the main assertion, and asserting the absence of an exception as the only check.

Manual mutation, the cheapest confidence check available: break the code on purpose (flip a comparison, introduce an off-by-one, delete a branch, return early), run the test, confirm it fails, revert. If the test still passes, it is not testing what you think.

## 6. Edge cases and boundaries

Pick the ones that are realistic for the code at hand. Do not enumerate all of them.

- Cardinality: empty, exactly one, many, the maximum allowed, one past the maximum
- Numbers: zero, negative, min, max, just outside the range, floating-point rounding, integer overflow
- Absence: null, undefined, missing key, empty string, whitespace-only
- Strings: unicode and combining characters, very long input, leading/trailing whitespace, case variations, injection characters
- Collections: duplicates, unsorted input, order of equal elements (stability)
- Time: timezone and DST transitions, leap years, midnight and month boundaries, clock skew, expiry exactly at the boundary
- Concurrency: two writers, retry after partial success, idempotency of repeated requests
- Dependencies: timeout, 5xx, malformed response, slow response, permission denied, disk full

## 7. Determinism and isolation

A flaky test is a bug report about either the test or the code. Fix it or quarantine it with a reason and a tracking reference. Never add retries until green, and never delete it silently.

| Cause | Fix |
| - | - |
| Real time (`now()`, timeouts) | Inject a clock or use fake timers |
| Randomness (ids, shuffles, UUIDs) | Seed it or inject the generator |
| Shared mutable state between tests | Fresh fixture per test, no module-level state |
| Test order dependence | Run in random order once to detect; remove the shared state |
| Real network | Fake at the boundary |
| Filesystem | Temp directory per test, removed afterwards |
| Async races | Await the actual completion signal; poll for a condition with a deadline; never fixed sleeps |
| Locale, env vars, path separators | Set explicitly in the test |
| Unordered collections compared as ordered | Sort first or compare as sets |
| Port or resource collisions in parallel runs | Random free port, unique resource names |

## 8. Refactor resilience

A good test survives a behavior-preserving refactor without edits. Signs a test is coupled to implementation:

- It imports private symbols or reaches into internal fields
- It asserts the sequence of internal calls
- It breaks when you extract or inline a function
- Its structure mirrors the code's structure line by line

Test through the public surface of the unit. Treat the test as the first consumer of the API: if the test is awkward to write, the API is awkward to use.

## 9. Table-driven and property-based tests

**Table-driven** (parametrized) tests: many inputs, one assertion shape. Compact, readable, easy to extend. Ideal for parsers, validators, formatters, and boundary sweeps. Each row should be a distinct risk, not a near-duplicate.

**Property-based** tests: generate inputs and check an invariant. Use when you can state a property: round-trip, idempotence, equivalence to a reference implementation, output is sorted and a permutation of the input, serialized size is bounded. Libraries: Hypothesis (Python), fast-check (JS/TS), proptest or quickcheck (Rust), jqwik (JVM), gopter or rapid (Go), FsCheck (.NET). Do not use when there is no meaningful property, or when the generator would be more complex than the code under test. Always pin the seed on failure so the case is reproducible.

## 10. Mutation testing, selectively

Mutation testing changes the code (flips operators, removes statements) and checks whether the tests notice. It finds weak assertions that line coverage hides.

Tools: Stryker (JS/TS, C#, Scala), mutmut or cosmic-ray (Python), PIT (JVM), cargo-mutants (Rust), go-mutesting (Go), Infection (PHP).

Use it on a focused module where correctness matters most: money, parsing, authorization, scheduling, core domain rules. It is slow; running it on an entire repository is rarely worth it. Treat surviving mutants as candidates for review, not as mandates. Some are equivalent mutants, some live in code not worth protecting. The goal is to find weak tests, not to reach a kill-rate number.

## 11. Legacy code and characterization tests

Before refactoring code with no tests, capture its current behavior: feed it representative inputs, record the outputs, and assert them. Label these tests as characterization tests, because they protect what the code does, not what it should do. Verify a sample of the captured outputs by hand; if one is wrong, you have found a bug to fix separately.

Characterization tests are scaffolding. After the refactor, replace them with behavior-derived tests where the intended behavior is known, and keep only the ones that still describe what the code should do.

## 12. Cost: CI time and maintenance

Every test is a liability: its runtime multiplied by runs per day, plus the edits it requires on every related change. The question is always whether the risk justifies it.

- One strong test over five weak ones
- Parametrization over copy-paste
- Shared fixtures with explicit setup over deep inheritance or implicit globals
- Delete tests whose risk no longer exists (feature removed, invariant now enforced by the type system)
- Keep the fast suite fast; move slow tests to a separate stage rather than letting them slow down every run

## 13. Coverage requirements

When a CI gate demands a percentage, use the coverage report to find untested *risk*, then apply the decision process from `SKILL.md` to each uncovered region. If what remains uncovered is genuinely trivial, say so and prefer excluding it from the metric or arguing for a lower threshold over writing tautological tests. Never write a test whose only purpose is to execute lines.

## 14. When to write zero tests

Recommend no new tests, and say why, when:

- The change is configuration, renames, formatting, or documentation
- The behavior is already protected by existing tests (name them)
- The code is a thin pass-through with no branching or transformation
- A test would need to mock so much that it would verify only the mocks
- The risk is better caught elsewhere: a type check, a linter, a schema, a contract test that already exists

Deliver the verdict explicitly: "No new tests. The new field is covered by `OrderSerializerTest.roundTrip`, and the rename has no behavioral change."

## 15. Naming and structure

- Name tests after behavior, condition, and expected outcome: `rejects expired token with 401`, not `test_auth_1` or `testValidateToken`.
- Keep arrange, act, and assert visually distinct.
- One behavior per test. Several assertions are fine when they describe the same outcome.
- No loops or conditionals in test bodies. Use parametrization. Logic in a test needs its own tests.
- Keep test data minimal and relevant. A fixture with forty fields hides which one matters.
