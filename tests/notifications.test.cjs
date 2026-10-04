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
const { emailNotificationIdempotencyKey } = load("src/lib/orders/notifications/email.ts");
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

const keys = ["ORDER_NOTIFICATIONS_ENABLED", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID",
  "RESEND_API_KEY", "ORDER_NOTIFICATION_EMAIL_TO", "ORDER_NOTIFICATION_EMAIL_FROM"];
Object.assign(process.env, {
  VERCEL_ENV: "preview", ORDER_NOTIFICATIONS_ENABLED: "true",
  TELEGRAM_BOT_TOKEN: "synthetic-token", TELEGRAM_CHAT_ID: "-1234",
  RESEND_API_KEY: "synthetic-key", ORDER_NOTIFICATION_EMAIL_TO: "team@example.test",
  ORDER_NOTIFICATION_EMAIL_FROM: "sender@example.test",
});
const originalFetch = global.fetch;
let telegram = 0, email = 0, failedTelegram = false, failedEmail = false;
global.fetch = async (url, init) => {
  assert.equal(init.method, "POST");
  assert.equal(init.cache, "no-store");
  assert.ok(init.signal);
  if (String(url).includes("telegram.org")) {
    telegram++;
    const payload = JSON.parse(init.body);
    assert.equal(payload.chat_id, "-1234");
    assert.match(payload.text, /24\s?196,80 ₽/);
    assert.equal(payload.text.includes(prepared.requestHash), false);
    assert.equal(payload.parse_mode, undefined);
    return Response.json({ ok: !failedTelegram });
  }
  assert.equal(url, "https://api.resend.com/emails");
  email++;
  assert.equal(init.headers["Idempotency-Key"], "order-created-email/" + id);
  assert.equal(JSON.parse(init.body).text, formatOrderNotification(created).text);
  assert.equal(JSON.parse(init.body).html, undefined);
  return new Response(null, { status: failedEmail ? 503 : 200 });
};

async function main() {
  const message = formatOrderNotification(created);
  assert.equal(message.subject, "Новая заявка Marmix Flex · " + id);
  assert.match(message.text, /TEST_ONLY-SKU/);
  assert.match(message.text, /3 лист/);
  assert.match(message.text, /24\s?196,80 ₽/);
  assert.equal(message.text.includes(prepared.idempotencyKey), false);
  assert.equal(message.text.includes(prepared.requestHash), false);
  assert.equal(emailNotificationIdempotencyKey(id.toUpperCase()),
    emailNotificationIdempotencyKey(id));
  assert.deepEqual(notification.missingPreviewNotificationEnvNames(), []);
  await notification.notifyCreatedOrder(created);
  assert.deepEqual([telegram, email], [1, 1]);
  failedTelegram = true;
  await notification.notifyCreatedOrder(created);
  assert.deepEqual([telegram, email], [2, 2]);
  failedTelegram = false; failedEmail = true;
  await notification.notifyCreatedOrder(created);
  assert.deepEqual([telegram, email], [3, 3]);
  failedTelegram = true;
  await notification.notifyCreatedOrder(created);
  assert.deepEqual([telegram, email], [4, 4]);
  process.env.VERCEL_ENV = "production";
  await notification.notifyCreatedOrder(created);
  assert.deepEqual([telegram, email], [4, 4]);
  process.env.VERCEL_ENV = "preview";
  process.env.ORDER_NOTIFICATIONS_ENABLED = "false";
  assert.deepEqual(notification.missingPreviewNotificationEnvNames(), ["ORDER_NOTIFICATIONS_ENABLED"]);
  process.env.ORDER_NOTIFICATIONS_ENABLED = "true";
  delete process.env.RESEND_API_KEY;
  assert.deepEqual(notification.missingPreviewNotificationEnvNames(), ["RESEND_API_KEY"]);
  await notification.notifyCreatedOrder(created);
  assert.deepEqual([telegram, email], [4, 4]);
  process.env.RESEND_API_KEY = "synthetic-key";

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
  failedTelegram = failedEmail = false;
  telegram = email = 0;
  assert.equal((await post()).status, 201);
  assert.deepEqual([telegram, email], [1, 1]);
  existing = { status: "same", id };
  const replay = await post();
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).request_id, id);
  assert.deepEqual([telegram, email], [1, 1]);
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
  assert.deepEqual([telegram, email], [1, 1]);
  insertStatus = "created";
  failedTelegram = true;
  assert.equal((await post()).status, 201);
  failedTelegram = false; failedEmail = true;
  assert.equal((await post()).status, 201);
  failedTelegram = true;
  assert.equal((await post()).status, 201);
  assert.deepEqual([telegram, email], [4, 4]);
  for (const name of keys) assert.ok(process.env[name]);
  const clientSource = fs.readFileSync(path.join(root, "src/app/(public)/checkout/CheckoutForm.tsx"), "utf8");
  assert.equal(/notifications|TELEGRAM_BOT_TOKEN|RESEND_API_KEY/.test(clientSource), false);
  process.stdout.write("T054A notifications: targeted harness PASS\n");
}
main().finally(() => { global.fetch = originalFetch; });
