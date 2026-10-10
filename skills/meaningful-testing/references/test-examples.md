# Weak versus strong tests

Each pair shows a test that cannot catch a realistic bug and a replacement that can. Syntax is illustrative pseudocode in a JavaScript-like style; apply the idea in whatever language and framework the project uses.

## 1. Testing the mock instead of the behavior

**Weak**

```js
test("getUser returns the user", async () => {
  repo.findById = mock().returns({ id: 1, name: "Ana" });
  const user = await service.getUser(1);
  expect(user).toEqual({ id: 1, name: "Ana" });
});
```

The service could return the repository result unchanged, or could ignore the argument entirely, and this test passes. It verifies that the mock returns what the mock was told to return.

**Strong**

```js
test("getUser hides soft-deleted users", async () => {
  const repo = new InMemoryUserRepo([{ id: 1, name: "Ana", deletedAt: "2025-01-01" }]);
  const service = new UserService(repo);
  await expect(service.getUser(1)).rejects.toThrow(NotFound);
});
```

If `getUser` has no logic of its own, the right answer is no test at all. If it has logic (filtering, mapping, authorization), test that logic against a fake that behaves.

## 2. Asserting a call happened without asserting the outcome

**Weak**

```js
test("checkout charges the card", async () => {
  await checkout(cart, paymentGateway);
  expect(paymentGateway.charge).toHaveBeenCalled();
});
```

Passes when the charge amount is wrong, the currency is wrong, or the card is charged twice.

**Strong**

```js
test("checkout charges the cart total once, in the cart currency", async () => {
  const gateway = new FakeGateway();
  await checkout(cartWith([{ price: 1999, qty: 3 }], "EUR"), gateway);
  expect(gateway.charges).toEqual([{ amount: 5997, currency: "EUR" }]);
});
```

The call is the contract here, so asserting on it is right. The strong version asserts the arguments that matter and that it happened exactly once.

## 3. Expected value copied from the implementation

**Weak**

```js
test("formats the invoice date", () => {
  expect(formatInvoiceDate(new Date("2025-03-09T23:30:00Z"))).toBe("2025-03-09");
});
```

Looks fine until you learn the invoice date must be in the customer's timezone, and for a customer in Tokyo this should be `2025-03-10`. The expected value was pasted from the current (wrong) output.

**Strong**

```js
test("formats the invoice date in the customer timezone", () => {
  // 23:30 UTC on March 9 is 08:30 on March 10 in Asia/Tokyo (UTC+9)
  expect(formatInvoiceDate(new Date("2025-03-09T23:30:00Z"), "Asia/Tokyo")).toBe("2025-03-10");
});
```

The expected value comes from a hand calculation written down in the test.

## 4. Re-implementing production logic in the test

**Weak**

```js
test("computes shipping", () => {
  const weight = 12;
  const expected = weight > 10 ? 15 + (weight - 10) * 1.5 : 15;
  expect(shippingCost(weight)).toBe(expected);
});
```

If the formula is wrong, the test reproduces the same wrong formula and passes.

**Strong**

```js
test.each([
  [0, 15],    // flat rate applies to empty parcels
  [10, 15],   // boundary: exactly 10 kg is still flat rate
  [10.5, 15.75], // first half kilo over: 15 + 0.5 * 1.5
  [12, 18],   // 15 + 2 * 1.5
])("shippingCost(%s kg) = %s", (weight, expected) => {
  expect(shippingCost(weight)).toBe(expected);
});
```

Concrete values from the pricing spec, with the boundary covered.

## 5. Sleeping instead of waiting for a condition

**Weak**

```js
test("job completes", async () => {
  queue.enqueue(job);
  await sleep(500);
  expect(job.status).toBe("done");
});
```

Fails on a slow CI runner, wastes 500 ms on a fast one, and tells you nothing about why it failed.

**Strong**

```js
test("job completes", async () => {
  queue.enqueue(job);
  await waitFor(() => job.status === "done", { timeout: 5000 });
  expect(job.result).toEqual({ processed: 3 });
});
```

Or, when the code uses timers, drive them with fake timers so the test is instant and exact.

## 6. Happy path only

**Weak**

```js
test("parses a port", () => {
  expect(parsePort("8080")).toBe(8080);
});
```

**Strong**

```js
test.each([
  ["1", 1],
  ["65535", 65535],
])("accepts valid port %s", (input, expected) => {
  expect(parsePort(input)).toBe(expected);
});

test.each([
  ["0", "out of range"],
  ["65536", "out of range"],
  ["-1", "out of range"],
  ["80a", "not a number"],
  ["", "not a number"],
  [" 80", "not a number"],
])("rejects %s", (input, reason) => {
  expect(() => parsePort(input)).toThrow(reason);
});
```

The bugs in a parser live at the edges. Each rejection asserts the reason, so an unrelated crash does not pass as "rejected".

## 7. Snapshot bloat

**Weak**

```js
test("renders the dashboard", () => {
  expect(render(<Dashboard user={user} orders={orders} />)).toMatchSnapshot();
});
```

A 400-line snapshot that changes on every styling tweak. Reviewers approve updates without reading them, so it stops catching anything.

**Strong**

```js
test("dashboard shows the three most recent orders, newest first", () => {
  const view = render(<Dashboard user={user} orders={fiveOrders} />);
  expect(view.orderRows().map((r) => r.id)).toEqual(["o5", "o4", "o3"]);
});

test("dashboard shows an empty state when there are no orders", () => {
  const view = render(<Dashboard user={user} orders={[]} />);
  expect(view.text()).toContain("No orders yet");
});
```

Snapshots are fine for small, stable, hand-reviewed output (a CLI help screen, a generated config). For UI, assert the behavior.

## 8. Testing private structure

**Weak**

```js
test("cache uses a Map keyed by url", () => {
  const cache = new ResponseCache();
  cache.put("/a", response);
  expect(cache._store).toBeInstanceOf(Map);
  expect(cache._store.get("/a")).toBe(response);
});
```

Replacing the `Map` with an LRU list breaks the test while the behavior is unchanged.

**Strong**

```js
test("cache returns the stored response for the same url", () => {
  const cache = new ResponseCache();
  cache.put("/a", response);
  expect(cache.get("/a")).toBe(response);
  expect(cache.get("/b")).toBeUndefined();
});

test("cache evicts the least recently used entry past capacity", () => {
  const cache = new ResponseCache({ capacity: 2 });
  cache.put("/a", r1); cache.put("/b", r2);
  cache.get("/a");
  cache.put("/c", r3);
  expect(cache.get("/b")).toBeUndefined();
  expect(cache.get("/a")).toBe(r1);
});
```

## 9. Overmocking

**Weak**

```js
test("createOrder", async () => {
  validator.validate = mock().returns(true);
  pricing.total = mock().returns(100);
  repo.save = mock().returns({ id: 7 });
  events.publish = mock();
  const result = await createOrder(input, { validator, pricing, repo, events });
  expect(validator.validate).toHaveBeenCalledWith(input);
  expect(pricing.total).toHaveBeenCalled();
  expect(repo.save).toHaveBeenCalled();
  expect(events.publish).toHaveBeenCalled();
  expect(result.id).toBe(7);
});
```

Every collaborator is mocked, so the test verifies the order of calls, not the result. It breaks on any internal reshuffle and passes when the total is computed wrongly.

**Strong**

```js
test("createOrder persists the priced order and publishes OrderCreated", async () => {
  const repo = new InMemoryOrderRepo();
  const events = new RecordingEventBus();
  const result = await createOrder(
    { items: [{ sku: "A", qty: 2, unitPrice: 500 }] },
    { repo, events, clock: fixedClock("2025-06-01T10:00:00Z") },
  );
  expect(repo.byId(result.id)).toMatchObject({ total: 1000, createdAt: "2025-06-01T10:00:00Z" });
  expect(events.published).toEqual([{ type: "OrderCreated", orderId: result.id }]);
});
```

Real validator and pricing, fakes only for persistence, events, and the clock.

## 10. Generic failure assertion

**Weak**

```js
test("rejects invalid config", () => {
  expect(() => loadConfig({ port: "abc" })).toThrow();
});
```

Passes if `loadConfig` throws a `TypeError` from an unrelated bug three lines earlier.

**Strong**

```js
test("rejects a non-numeric port with a field-specific error", () => {
  expect(() => loadConfig({ port: "abc" })).toThrow(ConfigError);
  expect(() => loadConfig({ port: "abc" })).toThrow(/port.*must be a number/);
});
```

## 11. Regression test for a bug fix: red first

Bug report: "Discount applied twice when a coupon and a loyalty tier both apply."

Wrong order of work: fix the code, then write a test that passes. You never learn whether the test could have caught the bug.

Right order:

1. Write `applies at most one percentage discount when both coupon and tier apply`, with the expected total computed by hand from the pricing rules.
2. Run it. It must fail, and fail on the total, not on a setup error.
3. Fix the code.
4. Run it again. It passes. Run the rest of the suite.
5. In the report, include both runs.

## 12. The right answer is no new test

Change: rename `fetchUserProfile` to `getUserProfile` and add an optional `includeAvatar` flag that is passed straight through to the API client.

Analysis: the rename has no behavioral change and the compiler or existing tests catch a missed call site. The new flag is a pass-through with no branching. The API client's handling of the flag is covered by the client's own tests.

Verdict: "No new tests. The rename is behavior-preserving and verified by the existing `UserProfile` tests passing. `includeAvatar` is forwarded without logic; the client's `sendsQueryFlags` test covers the forwarding format."
