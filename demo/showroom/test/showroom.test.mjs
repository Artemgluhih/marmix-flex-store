import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { createApp } from '../server.mjs';

const password = 'integration-fixture-only';
const cookieHeader = response => response.headers.get('set-cookie').split(';')[0];
async function fixture(t, databasePath = ':memory:') {
  const server = createApp({ databasePath, password });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    server.emit('close');
  };
  t.after(close);
  const origin = 'http://127.0.0.1:3100';
  const send = (method, path, fields, headers) => new Promise((resolve, reject) => {
    const request = Readable.from(fields ? [Buffer.from(new URLSearchParams(fields).toString())] : []);
    Object.assign(request, { method, url: path, headers: { host: '127.0.0.1:3100', ...headers }, socket: { remoteAddress: '127.0.0.1' } });
    const responseHeaders = new Headers();
    const response = {
      setHeader: (name, value) => responseHeaders.set(name, value),
      writeHead(status, values = {}) {
        this.status = status;
        for (const [name, value] of Object.entries(values)) responseHeaders.set(name, value);
        this.headersSent = true;
        return this;
      },
      end(body) { resolve(new Response(body, { status: this.status, headers: responseHeaders })); },
    };
    server.listeners('request')[0](request, response).catch(reject);
  });
  const get = (path, cookie) => send('GET', path, null, { cookie });
  const post = (path, data, cookie, submittedOrigin = origin) => send('POST', path, data, {
    origin: submittedOrigin, cookie, 'content-type': 'application/x-www-form-urlencoded',
  });
  const login = async () => {
    const result = await post('/admin/login', { password });
    assert.equal(result.status, 303);
    assert.match(result.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
    return cookieHeader(result);
  };
  return { get, post, login, close };
}

test('публичные страницы, фильтры и отсутствующие товары', async t => {
  const { get } = await fixture(t);
  for (const path of ['/', '/catalog', '/about', '/applications', '/contacts', '/request', '/product/1']) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    const html = await res.text();
    assert.equal(html.match(/<h1>/g)?.length, 1, path);
  }
  assert.equal((await get('/product/999')).status, 404);
  assert.equal((await get('/style.css')).status, 200);
  const res = await get('/catalog?q=' + encodeURIComponent('аЗуР') + '&category=' + encodeURIComponent('Гибкий мрамор'));
  assert.match(await res.text(), /Азур/);
  assert.match(await (await get('/catalog?q=missing')).text(), /ничего не найдено/);
});

test('заявка поступает менеджеру, история статусов и заметка переживают перезапуск', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'marmix-test-'));
  const file = join(dir, 'app.sqlite');
  const { get, post, login, close } = await fixture(t, file);
  assert.equal((await get('/admin')).headers.get('location'), '/admin/login');
  assert.equal((await post('/request', { phone: 'abc' })).status, 400);
  const submitted = await post('/request', { name: 'Тестовый контакт', phone: '+7 000 000-00-00', city: 'Демо', message: 'Стена', product: '1' });
  assert.equal(submitted.status, 303);
  assert.equal(submitted.headers.get('location'), '/request/sent');
  const cookie = await login();
  assert.match(await (await get('/admin', cookie)).text(), /Тестовый контакт/);
  assert.match(await (await get('/admin/leads/1', cookie)).text(), /Азур/);
  assert.equal((await post('/admin/leads/1', { status: 'В работе', note: 'Проверить размеры' }, cookie)).status, 303);
  assert.equal((await post('/admin/products/1/delete', {}, cookie)).status, 303);
  assert.equal((await get('/product/1')).status, 404);
  await close();
  const second = await fixture(t, file);
  t.after(() => rm(dir, { recursive: true, force: true }));
  const restored = await second.get('/admin/leads/1', cookie);
  assert.match(await restored.text(), /История статусов[\s\S]*Новая[\s\S]*В работе[\s\S]*Проверить размеры/);
  assert.match(await (await second.get('/admin/leads/1', cookie)).text(), /Азур/);
  assert.equal((await second.get('/product/1')).status, 404);
});

test('товар создаётся черновиком, публикуется, редактируется и удаляется', async t => {
  const { get, post, login } = await fixture(t);
  const cookie = await login();
  const draft = { title: 'Демо & образец', category: 'Травертин', description: 'Образец для проверки' };
  const created = await post('/admin/products/new', draft, cookie);
  assert.equal(created.status, 303);
  const edit = created.headers.get('location');
  const item = edit.replace('/admin/products/', '/product/');
  assert.equal((await get(item)).status, 404);
  assert.equal((await post(edit, { ...draft, title: 'Изменённый & опубликованный', published: '1' }, cookie)).status, 303);
  assert.match(await (await get(item)).text(), /Изменённый &amp; опубликованный/);
  assert.equal((await post(edit, { ...draft, image: 'http://example.test/image' }, cookie)).status, 400);
  assert.equal((await post(edit + '/delete', {}, cookie)).status, 303);
  assert.equal((await get(item)).status, 404);
});

test('админ-панель требует вход, выход завершает сеанс, формы принимаются со своего источника', async t => {
  const { get, post, login } = await fixture(t);
  assert.equal((await post('/admin/login', { password: 'wrong' })).status, 401);
  assert.equal((await post('/admin/products/new', {})).headers.get('location'), '/admin/login');
  const cookie = await login();
  assert.equal((await get('/admin/products', cookie)).status, 200);
  assert.equal((await post('/admin/logout', {}, cookie, 'https://example.test')).status, 403);
  assert.equal((await get('/admin/products', cookie)).status, 200);
  assert.equal((await post('/admin/logout', {}, cookie)).status, 303);
  assert.equal((await get('/admin/products', cookie)).headers.get('location'), '/admin/login');
});
