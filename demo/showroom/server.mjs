import { createServer } from 'node:http';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { categories, statuses, openDatabase } from './db.mjs';
import * as view from './views.mjs';

const css = readFileSync(new URL('./style.css', import.meta.url));
const digest = value => createHash('sha256').update(value).digest();
const texts = {
  400: ['Проверьте данные', 'Обновите страницу и повторите действие.'],
  403: ['Действие недоступно', 'Откройте форму на этом сайте.'],
  404: ['Страница не найдена', 'Вернитесь на главную или откройте каталог.'],
  405: ['Действие недоступно', 'Откройте страницу через меню.'],
  413: ['Форма слишком большая', 'Сократите текст и повторите отправку.'],
  415: ['Формат формы не поддерживается', 'Откройте форму через сайт.'],
  429: ['Слишком много попыток', 'Повторите позже.'],
  500: ['Ошибка сервера', 'Повторите через несколько минут.'],
};
const cookieName = 'marmix_session';
const sessionLifetime = 8 * 60 * 60;
const field = (form, key) => (form.get(key) || '').trim();
const itemId = value => /^\d{1,15}$/.test(value) && Number(value) > 0 ? Number(value) : null;
const sessionId = req => req.headers.cookie?.match(/(?:^|;\s*)marmix_session=([a-f0-9]{64})(?:;|$)/)?.[1];

function redirect(res, location) {
  res.writeHead(303, { Location: location }).end();
}
function errorPage(res, status) {
  const [title, description] = texts[status];
  page(res, title, view.info(title, '<p>' + description + '</p>'), status);
}
function page(res, title, body, status = 200, admin = false, active = '') {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' }).end(view.layout(title, body, admin, active));
}
async function readForm(req) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/x-www-form-urlencoded') {
    throw Object.assign(new Error(), { status: 415 });
  }
  const chunks = [];
  let size = 0;
  for await (const buffer of req) {
    size += buffer.length;
    if (size <= 64 * 1024) chunks.push(buffer);
  }
  if (size > 64 * 1024) throw Object.assign(new Error(), { status: 413 });
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}
function validImage(image) {
  if (!image) return true;
  try {
    const url = new URL(image);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}
function transaction(db, mutate) {
  db.exec('BEGIN IMMEDIATE');
  try {
    mutate();
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function createApp({ databasePath, password, origin, secure = false }) {
  if (typeof password !== 'string' || password.length < 12) throw new Error('Укажите ADMIN_PASSWORD длиной от 12 символов.');
  const configuredOrigin = origin && new URL(origin);
  if (configuredOrigin && !['http:', 'https:'].includes(configuredOrigin.protocol)) throw new Error('PUBLIC_ORIGIN: укажите HTTP(S) адрес.');
  const db = openDatabase(databasePath);
  const expectedPassword = digest(password);
  const now = () => Math.floor(Date.now() / 1000);
  const allProducts = db.prepare('SELECT * FROM products ORDER BY id DESC');
  const publicProducts = db.prepare('SELECT * FROM products WHERE published = 1 ORDER BY id');
  const getProduct = db.prepare('SELECT * FROM products WHERE id = ?');
  const getPublicProduct = db.prepare('SELECT * FROM products WHERE id = ? AND published = 1');
  const getLead = db.prepare('SELECT * FROM leads WHERE id = ?');
  const insertHistory = db.prepare('INSERT INTO lead_history (lead_id, status) VALUES (?, ?)');
  const attempts = new Map();
  const windowMs = 10 * 60 * 1000;
  function limited(req, type, max) {
    const current = Date.now();
    for (const [key, value] of attempts) if (current >= value.until) attempts.delete(key);
    const key = type + ':' + req.socket.remoteAddress;
    const entry = attempts.get(key) || { count: 0, until: current + windowMs };
    entry.count += 1;
    attempts.set(key, entry);
    return entry.count > max;
  }
  const cookie = (value, age) => cookieName + '=' + value + '; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=' + age + (secure ? '; Secure' : '');

  const server = createServer(async (req, res) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' https:; style-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    try {
      const url = new URL(req.url, 'http://internal');
      const path = url.pathname;
      const post = req.method === 'POST';
      if (!post && req.method !== 'GET') return errorPage(res, 405);
      if (post && req.headers.origin !== (configuredOrigin?.origin || 'http://' + req.headers.host)) return errorPage(res, 403);
      if (!post && path === '/style.css') return res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' }).end(css);
      if (!post && path === '/') return page(res, 'Гибкий мрамор и травертин', view.home(publicProducts.all().slice(0, 3)));
      if (!post && path === '/catalog') {
        const query = (url.searchParams.get('q') || '').trim().slice(0, 120);
        const category = categories.find(c => c === url.searchParams.get('category')) || '';
        const needle = query.toLocaleLowerCase('ru');
        const products = publicProducts.all().filter(p => (!category || p.category === category) && p.title.toLocaleLowerCase('ru').includes(needle));
        return page(res, 'Каталог', view.catalog(products, query, category), 200, false, path);
      }
      const productMatch = path.match(/^\/product\/(\d+)$/);
      if (!post && productMatch) {
        const item = getPublicProduct.get(itemId(productMatch[1]));
        return item ? page(res, item.title, view.product(item)) : errorPage(res, 404);
      }
      if (!post && Object.hasOwn(view.information, path)) {
        const [title, content] = view.information[path];
        return page(res, title, view.info(title, content), 200, false, path);
      }
      if (!post && path === '/request/sent') return page(res, 'Заявка принята', view.messagePage('Заявка принята', 'Демозаявка появилась в панели управления.', '/catalog', 'Вернуться в каталог'));
      if (path === '/request') {
        if (!post) return page(res, 'Расчёт проекта', view.requestForm(getPublicProduct.get(itemId(url.searchParams.get('product') || ''))));
        if (limited(req, 'request', 30)) return errorPage(res, 429);
        const form = await readForm(req);
        const values = Object.fromEntries(['name','phone','city','message'].map(key => [key, field(form, key)]));
        const product = field(form, 'product');
        const item = getPublicProduct.get(itemId(product));
        const phoneDigits = values.phone.replace(/\D/g, '');
        const error = product && !item ? 'Материал больше недоступен. Выберите другой в каталоге.' :
          values.name.length < 2 || values.name.length > 100 || !/^[+\d() .-]{7,32}$/.test(values.phone) || phoneDigits.length < 7 || phoneDigits.length > 15 || values.city.length > 100 || values.message.length > 2000 ?
            'Проверьте имя, телефон и длину полей.' : '';
        if (error) return page(res, 'Расчёт проекта', view.requestForm(item, values, error), 400);
        transaction(db, () => {
          const result = db.prepare('INSERT INTO leads (product_id, product_title, name, phone, city, message) VALUES (?, ?, ?, ?, ?, ?)').run(item?.id ?? null, item?.title ?? null, values.name, values.phone, values.city, values.message);
          insertHistory.run(result.lastInsertRowid, statuses[0]);
        });
        return redirect(res, '/request/sent');
      }
      if (path === '/admin/login') {
        if (!post) return page(res, 'Вход', view.login(), 200, true);
        if (limited(req, 'login', 15)) return errorPage(res, 429);
        const form = await readForm(req);
        if (!timingSafeEqual(digest(form.get('password') || ''), expectedPassword)) return page(res, 'Вход', view.login('Неверный пароль.'), 401, true);
        const token = randomBytes(32).toString('hex');
        db.prepare('DELETE FROM sessions WHERE expires <= ?').run(now());
        db.prepare('INSERT INTO sessions VALUES (?, ?)').run(digest(token).toString('hex'), now() + sessionLifetime);
        res.setHeader('Set-Cookie', cookie(token, sessionLifetime));
        return redirect(res, '/admin');
      }
      if (path !== '/admin' && !path.startsWith('/admin/')) return errorPage(res, 404);
      const token = sessionId(req);
      const key = token ? digest(token).toString('hex') : '';
      if (!key || !db.prepare('SELECT 1 FROM sessions WHERE id = ? AND expires > ?').get(key, now())) return redirect(res, '/admin/login');
      if (post && path === '/admin/logout') {
        db.prepare('DELETE FROM sessions WHERE id = ?').run(key);
        res.setHeader('Set-Cookie', cookie('', 0));
        return redirect(res, '/admin/login');
      }
      if (!post && path === '/admin') {
        const status = statuses.find(s => s === url.searchParams.get('status')) || '';
        const rows = status ? db.prepare('SELECT * FROM leads WHERE status = ? ORDER BY id DESC').all(status) :
          db.prepare('SELECT * FROM leads ORDER BY id DESC').all();
        const counts = db.prepare('SELECT status, count(*) AS total FROM leads GROUP BY status').all();
        return page(res, 'Заявки', view.leads(rows, status, statuses.map(s => counts.find(c => c.status === s) || { status: s, total: 0 })), 200, true, path);
      }
      const leadMatch = path.match(/^\/admin\/leads\/(\d+)$/);
      if (leadMatch) {
        const id = itemId(leadMatch[1]);
        const row = getLead.get(id);
        if (!row) return errorPage(res, 404);
        if (!post) return page(res, 'Заявка №' + id, view.lead(row, db.prepare('SELECT * FROM lead_history WHERE lead_id = ? ORDER BY id').all(id)), 200, true, '/admin');
        const form = await readForm(req);
        const status = field(form, 'status');
        const note = field(form, 'note');
        if (!statuses.includes(status) || note.length > 2000) return errorPage(res, 400);
        transaction(db, () => {
          if (getLead.get(id).status !== status) insertHistory.run(id, status);
          db.prepare('UPDATE leads SET status = ?, note = ? WHERE id = ?').run(status, note, id);
        });
        return redirect(res, path);
      }
      if (!post && path === '/admin/products') return page(res, 'Товары', view.adminProducts(allProducts.all()), 200, true, path);
      const productAdmin = path.match(/^\/admin\/products\/(new|\d+)(\/delete)?$/);
      if (!productAdmin) return errorPage(res, 404);
      const create = productAdmin[1] === 'new';
      const id = create ? null : itemId(productAdmin[1]);
      const item = create ? {} : getProduct.get(id);
      if (!item) return errorPage(res, 404);
      if (productAdmin[2]) {
        if (!post || create) return errorPage(res, 404);
        db.prepare('DELETE FROM products WHERE id = ?').run(id);
        return redirect(res, '/admin/products');
      }
      const editPage = (values, error, status) => page(res, create ? 'Новый товар' : 'Редактирование товара', view.editProduct(values, error), status, true, '/admin/products');
      if (!post) return editPage(item, '', 200);
      const form = await readForm(req);
      const title = field(form, 'title');
      const category = field(form, 'category');
      const description = field(form, 'description');
      const image = field(form, 'image');
      const published = Number(field(form, 'published') === '1');
      if (!title || title.length > 120 || !categories.includes(category) || !description || description.length > 4000 || image.length > 1000 || !validImage(image)) {
        return editPage({ id, title, category, description, image, published }, 'Проверьте название, описание, категорию и HTTPS-ссылку на фото.', 400);
      }
      if (create) {
        const result = db.prepare('INSERT INTO products (title, category, description, image, published) VALUES (?, ?, ?, ?, ?)').run(title, category, description, image, published);
        return redirect(res, '/admin/products/' + result.lastInsertRowid);
      }
      const result = db.prepare('UPDATE products SET title = ?, category = ?, description = ?, image = ?, published = ? WHERE id = ?').run(title, category, description, image, published, id);
      return result.changes ? redirect(res, path) : errorPage(res, 404);
    } catch (error) {
      if (!error.status) console.error('Marmix request failed:', error.code || error.name);
      if (!res.headersSent && !res.destroyed) errorPage(res, error.status || 500);
    }
  });
  server.on('close', () => db.close());
  return server;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const host = process.env.HOST || '127.0.0.1';
  const origin = process.env.PUBLIC_ORIGIN;
  const secure = origin?.startsWith('https://');
  if (host !== '127.0.0.1' && !secure) throw new Error('Для сетевого запуска требуется PUBLIC_ORIGIN с HTTPS.');
  const server = createApp({
    databasePath: process.env.DATABASE_PATH || fileURLToPath(new URL('./data/showroom.sqlite', import.meta.url)),
    password: process.env.ADMIN_PASSWORD, origin, secure,
  });
  server.listen(Number(process.env.PORT || 3100), host, () => console.log('Marmix Flex: ' + (origin || 'http://' + host + ':' + server.address().port)));
}