const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const modules = new Map();
const aliases = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (modules.has(filename)) return modules.get(filename);
  const source = fs.readFileSync(filename, "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  const mod = { exports: {} };
  modules.set(filename, mod.exports);
  const localRequire = (name) => {
    if (name === "server-only") return {};
    if (aliases.has(name)) return aliases.get(name);
    if (name.startsWith(".")) {
      const target = path.resolve(path.dirname(filename), name);
      const withExtension = fs.existsSync(target + ".ts") ? target + ".ts" : path.join(target, "index.ts");
      return load(path.relative(root, withExtension));
    }
    throw new Error("Unexpected import: " + name);
  };
  new Function("require", "module", "exports", code)(localRequire, mod, mod.exports);
  modules.set(filename, mod.exports);
  return mod.exports;
}

const notification = load("src/lib/orders/notifications/index.ts");
const { formatOrderNotification } = load("src/lib/orders/notifications/format.ts");
const id = "c1a4321e-8de8-4e1b-82a7-49e756d0021a";
const prepared = {
  idempotencyKey: "c2a4321e-8de8-4e1b-82a7-49e756d0021a",
  requestHash: "a".repeat(64),
  contact: { name: "Тестовый пользователь", phone: "+7 900 000-00-00",
    city: "Тестовый город", email: "test@example.test", comment: "Тестовое уведомление" },
  items: [{ productId: "product-id", name: "Тестовая позиция", sku: "TEST_ONLY-SKU",
    quantity: 3, saleUnit: "лист", priceMinor: 200000, priceUnit: "м²",
    lineTotalMinor: 2419680 }],
  totalMinor: 2419680, currency: "RUB",
};
const created = { requestId: id, createdAt: "2026-10-03T15:00:00.000Z", order: prepared };

const keys = ["ORDER_NOTIFICATIONS_ENABLED", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"];
Object.assign(process.env, {
  VERCEL_ENV: "preview", ORDER_NOTIFICATIONS_ENABLED: "true",
  TELEGRAM_BOT_TOKEN: "synthetic-token", TELEGRAM_CHAT_ID: "-1234",
});
const originalFetch = global.fetch;
let telegram = 0, failedTelegram = false;
global.fetch = async (url, init) => {
  assert.equal(init.method, "POST");
  assert.equal(init.cache, "no-store");
  assert.ok(init.signal);
  assert.match(String(url), /^https:\/\/api\.telegram\.org\/bot/);
  telegram++;
  const payload = JSON.parse(init.body);
  assert.equal(payload.chat_id, "-1234");
  assert.match(payload.text, /24\s?196,80 ₽/);
  assert.equal(payload.text.includes(prepared.requestHash), false);
  assert.equal(payload.parse_mode, undefined);
  return Response.json({ ok: !failedTelegram });
};

async function main() {
  const message = formatOrderNotification(created);
  assert.match(message, /Новая заявка Marmix Flex/);
  assert.match(message, /ID заявки: c1a4321e-8de8-4e1b-82a7-49e756d0021a/);
  assert.match(message, /TEST_ONLY-SKU/);
  assert.match(message, /3 лист/);
  assert.match(message, /24\s?196,80 ₽/);
  assert.equal(message.includes(prepared.idempotencyKey), false);
  assert.equal(message.includes(prepared.requestHash), false);
  assert.deepEqual(notification.missingPreviewNotificationEnvNames(), []);
  await notification.notifyCreatedOrder(created);
  assert.equal(telegram, 1);
  failedTelegram = true;
  await notification.notifyCreatedOrder(created);
  assert.equal(telegram, 2);
  process.env.VERCEL_ENV = "production";
  await notification.notifyCreatedOrder(created);
  assert.equal(telegram, 2);
  process.env.VERCEL_ENV = "preview";
  process.env.ORDER_NOTIFICATIONS_ENABLED = "false";
  assert.deepEqual(notification.missingPreviewNotificationEnvNames(), ["ORDER_NOTIFICATIONS_ENABLED"]);
  process.env.ORDER_NOTIFICATIONS_ENABLED = "true";
  delete process.env.TELEGRAM_CHAT_ID;
  assert.deepEqual(notification.missingPreviewNotificationEnvNames(), ["TELEGRAM_CHAT_ID"]);
  await notification.notifyCreatedOrder(created);
  assert.equal(telegram, 2);
  process.env.TELEGRAM_CHAT_ID = "-1234";

  let insertStatus = "created", existing = null, freshAllowed = true;
  aliases.set("@/lib/orders/validate-request", {
    MAX_ORDER_BODY_BYTES: 16384, MAX_ORDER_ITEMS: 50,
    validateOrderRequest: (body) => body.invalid ? { ok: false, fields: ["name"] } :
      { ok: true, value: { idempotencyKey: "key", items: [], contact: prepared.contact } },
  });
  aliases.set("@/lib/orders/idempotency", {
    lookupExistingOrder: async () => existing,
    resolveIdempotency: () => existing ? existing : { status: "new", hash: "hash" },
  });
  aliases.set("@/lib/catalog/queries", { getOrderProductsFreshByIds: async () => [] });
  aliases.set("@/lib/orders/prepare", { prepareOrder: () => freshAllowed
    ? { ok: true, value: prepared } : { ok: false } });
  aliases.set("@/lib/orders/preview-gate", { previewOrderAllowed: () => true });
  aliases.set("@/lib/orders/insert", { insertPreparedOrder: async () => insertStatus === "created"
    ? { status: "created", id, createdAt: created.createdAt } :
      insertStatus === "replayed" ? { status: "replayed", id } : { status: insertStatus } });
  aliases.set("@/lib/orders/notifications", notification);
  const { POST } = load("src/app/api/order-requests/route.ts");
  const post = (body = {}) => POST(new Request("https://preview.vercel.app/api/order-requests", {
    method: "POST", headers: { origin: "https://preview.vercel.app",
      "content-type": "application/json" }, body: JSON.stringify(body),
  }));
  process.env.VERCEL_URL = "preview.vercel.app";
  failedTelegram = false;
  telegram = 0;
  assert.equal((await post()).status, 201);
  assert.equal(telegram, 1);
  existing = { status: "same", id };
  const replay = await post();
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).request_id, id);
  assert.equal(telegram, 1);
  existing = { status: "conflict" };
  assert.equal((await post()).status, 409);
  existing = null;
  freshAllowed = false;
  assert.equal((await post()).status, 409);
  freshAllowed = true;
  insertStatus = "replayed";
  assert.equal((await post()).status, 200);
  insertStatus = "conflict";
  assert.equal((await post()).status, 409);
  insertStatus = "unavailable";
  assert.equal((await post()).status, 503);
  assert.equal((await post({ invalid: true })).status, 400);
  assert.equal(telegram, 1);
  insertStatus = "created";
  failedTelegram = true;
  assert.equal((await post()).status, 201);
  assert.equal(telegram, 2);
  // The temporary T054A review route was removed after owner PASS; the public
  // order API above retains the created/replay/conflict provider assertions.
  for (const name of keys) assert.ok(process.env[name]);
  const clientSource = fs.readFileSync(path.join(root, "src/app/(public)/checkout/CheckoutForm.tsx"), "utf8");
  assert.equal(/notifications|TELEGRAM_BOT_TOKEN/.test(clientSource), false);
  process.stdout.write("T054A Telegram: targeted harness PASS\n");
}
main().finally(() => { global.fetch = originalFetch; });
