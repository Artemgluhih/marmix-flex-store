const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const dir = path.resolve(__dirname, "../src/app/admin/(workspace)/orders/[id]");
function load(file, mocks) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)((name) => mocks[name] ?? require(name), module, module.exports);
  return module.exports;
}

const state = load(path.join(dir, "order-state.ts"), {});
const snapshot = load(path.join(dir, "snapshot.ts"), {});
const id = "11111111-1111-4111-8111-111111111111";
const updatedAt = "2026-10-04T17:00:00.123+00:00";
const calls = [];
let response = { data: { id }, error: null };
let guarded = 0;
const client = { from(table) {
  assert.equal(table, "order_requests");
  return {
    update(patch) {
      const call = { patch, filters: [] };
      calls.push(call);
      const query = {
        eq(column, value) { call.filters.push([column, value]); return query; },
        select(columns) { assert.equal(columns, "id"); return { maybeSingle: async () => response }; },
      };
      return query;
    },
    select(columns) {
      assert.equal(columns, "status,updated_at");
      const query = { eq() { return query; }, maybeSingle: async () => response };
      return query;
    },
  };
} };
const refreshed = [];
const actions = load(path.join(dir, "order-actions.ts"), {
  "next/cache": { revalidatePath: (value) => refreshed.push(value) },
  "@/lib/admin/require-admin": { requireAdminMutation: async () => { guarded++; return { supabase: client }; } },
  "../orders-list": { ORDER_STATUSES: ["new", "in_progress", "completed", "cancelled"] },
  "./order-state": state,
  "./snapshot": snapshot,
});
function form(fields = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    id, expected_status: "new", expected_updated_at: updatedAt, ...fields,
  })) data.append(key, value);
  return data;
}
function expectGuards(call, status) {
  assert.deepEqual(call.filters, [["id", id], ["status", status], ["updated_at", updatedAt]]);
}

(async () => {
  for (const [before, after] of [
    ["new", "in_progress"], ["new", "cancelled"],
    ["in_progress", "completed"], ["in_progress", "cancelled"],
  ]) {
    const result = await actions.saveOrderStatus(state.INITIAL_ACTION_RESULT,
      form({ expected_status: before, status: after, name: "must never be written" }));
    assert.equal(result.kind, "saved");
    const call = calls.pop();
    assert.deepEqual(call.patch, { status: after });
    expectGuards(call, before);
  }
  for (const terminal of ["completed", "cancelled"]) {
    for (const after of ["new", "in_progress", "completed", "cancelled"].filter((value) => value !== terminal)) {
      assert.equal((await actions.saveOrderStatus(state.INITIAL_ACTION_RESULT,
        form({ expected_status: terminal, status: after }))).kind, "validation");
    }
  }
  assert.equal((await actions.saveOrderStatus(state.INITIAL_ACTION_RESULT, form({ status: "invalid" }))).kind, "validation");
  response = { data: { status: "new", updated_at: updatedAt }, error: null };
  const beforeNoop = calls.length;
  assert.equal((await actions.saveOrderStatus(state.INITIAL_ACTION_RESULT, form({ status: "new" }))).kind, "saved");
  assert.equal(calls.length, beforeNoop);
  response = { data: { id }, error: null };

  for (const [submitted, normalized] of [
    ["  first  ", "first"], ["changed", "changed"], [" \n  ", null],
    ["a".repeat(2000), "a".repeat(2000)], ["<script>unsafe</script>", "<script>unsafe</script>"],
  ]) {
    const result = await actions.saveOrderNote(state.INITIAL_ACTION_RESULT,
      form({ internal_note: submitted, total_minor: "1" }));
    assert.equal(result.kind, "saved");
    const call = calls.pop();
    assert.deepEqual(call.patch, { internal_note: normalized });
    expectGuards(call, "new");
  }
  assert.equal((await actions.saveOrderNote(state.INITIAL_ACTION_RESULT,
    form({ internal_note: "a".repeat(2001) }))).kind, "validation");
  response = { data: null, error: null };
  assert.equal((await actions.saveOrderStatus(state.INITIAL_ACTION_RESULT,
    form({ status: "in_progress" }))).kind, "conflict");
  assert.equal((await actions.saveOrderNote(state.INITIAL_ACTION_RESULT,
    form({ internal_note: "stale" }))).kind, "conflict");
  response = { data: null, error: { message: "private database detail" } };
  const failed = await actions.saveOrderNote(state.INITIAL_ACTION_RESULT, form({ internal_note: "test" }));
  assert.equal(failed.kind, "error");
  assert.doesNotMatch(failed.message, /private database detail/);
  assert.ok(guarded > 0);
  assert.ok(refreshed.includes("/admin/orders"));
  assert.ok(refreshed.includes(`/admin/orders/${id}`));
  console.log("T058 guarded status/note actions: PASS");
})().catch((error) => { console.error(error); process.exitCode = 1; });
