import { categories, statuses } from './db.mjs';

export const escape = (value = '') => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const e = escape;
const links = [['/catalog', 'Каталог'], ['/applications', 'Применение'], ['/about', 'О компании'], ['/contacts', 'Контакты']];
const phone = '<a href="tel:+73462999676">+7 (346) 299-96-76</a>';
const brand = '<a class="brand" href="/" aria-label="Marmix Flex, главная"><span class="mark">M</span> MARMIX <b>FLEX</b></a>';
export function layout(title, content, admin = false, active = '') {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${e(title)} — Marmix Flex</title><link rel="stylesheet" href="/style.css"></head>
  <body><a class="skip" href="#main">К содержанию</a><header><div class="wrap top">${brand}<nav aria-label="Основная навигация">${(admin ? [['/admin','Заявки'], ['/admin/products','Товары'], ['/','Витрина']] : links).map(([href, label]) => `<a href="${href}" ${active === href ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>${admin ? '' : '<a class="button compact" href="/request">Рассчитать проект <span aria-hidden="true">↗</span></a>'}</div></header>
  <main id="main">${content}</main><footer><div class="wrap foot">${brand}<span>Гибкий мрамор и отделочные материалы</span>${phone}<a href="/admin">Вход для команды</a></div></footer></body></html>`;
}
const option = (value, selected) => `<option ${value === selected ? 'selected' : ''}>${e(value)}</option>`;
const image = (product) => product.image ? `<img alt="${e(product.title)}" src="${e(product.image)}" loading="lazy">` : '';
const texture = (product) => product.category === categories[1] ? 'sand' : product.category === categories[2] ? 'graphite' : 'azure';
const card = (product) => `<a class="card" href="/product/${product.id}"><div class="sample ${texture(product)}">${image(product)}</div><div class="cardBody"><small>${e(product.category)}</small><h3>${e(product.title)}</h3><span aria-hidden="true">↗</span></div></a>`;
const intro = (title, description = '') => `<div class="intro"><h1>${e(title)}</h1>${description ? `<p>${e(description)}</p>` : ''}</div>`;
export function home(products) {
  return `<section class="hero"><div class="wrap heroInner"><p class="eyebrow">Отделочные материалы для архитектуры и интерьеров</p><h1>Камень.<br>В новой <em>форме.</em></h1><p class="heroCopy">Гибкий мрамор и травертин для стен, колонн и акцентных поверхностей. Подберём фактуру и рассчитаем материал под ваш проект.</p><div class="actions"><a class="button" href="/catalog">Смотреть каталог <span aria-hidden="true">↗</span></a><a class="button ghost" href="/request">Получить расчёт</a></div></div></section>
  <div class="wrap"><div class="facts"><div><strong>1420 × 2840</strong><span>формат панели, мм</span></div><div><strong>4,0328 м²</strong><span>площадь одной панели</span></div><div><strong>С 2019 года</strong><span>на рынке отделочных материалов</span></div></div>
  <section class="section"><div class="sectionhead"><h2>Коллекция материалов</h2><a href="/catalog">Весь каталог ↗</a></div><div class="grid">${products.map(card).join('')}</div></section></div>`;
}
export function catalog(products, query, category) {
  return `<div class="wrap page">${intro('Каталог', 'Подберите фактуру для вашего проекта и отправьте заявку на расчёт.')}<form class="filters"><label>Поиск<input name="q" value="${e(query)}" placeholder="Название материала"></label><label>Категория<select name="category"><option value="">Все материалы</option>${categories.map(c => option(c, category)).join('')}</select></label><button class="button">Найти</button><a href="/catalog">Сбросить</a></form><div class="grid">${products.map(card).join('') || '<p>По вашему запросу ничего не найдено.</p>'}</div></div>`;
}
export function product(item) {
  return `<div class="wrap page"><a href="/catalog">← Каталог</a><div class="split product"><div class="sample ${texture(item)}">${image(item)}</div><div><p class="eyebrow">${e(item.category)}</p>${intro(item.title, item.description)}<a class="button" href="/request?product=${item.id}">Рассчитать материал ↗</a></div></div></div>`;
}
export const information = {
  '/about': ['О компании', `<p>Marmix Flex работает на рынке отделочных материалов с 2019 года. Компания поставляет гибкий мрамор и другие материалы для частных и коммерческих проектов.</p><p>Поможем выбрать фактуру и рассчитать количество материала по размерам вашей поверхности.</p>`],
  '/applications': ['Применение', `<div class="grid"><article><h2>Жилые интерьеры</h2><p>Акцентные стены, декоративные панели и облицовка колонн.</p></article><article><h2>Коммерческие пространства</h2><p>Стойки ресепшен, зоны ожидания и стены в кафе, офисах и шоурумах.</p></article><article><h2>Радиусные поверхности</h2><p>Подбор материала для арок, закруглений и других форм. Способ монтажа зависит от основания.</p></article></div>`],
  '/contacts': ['Контакты', `<div class="grid"><article><h2>Сургут</h2><p>ул. Декабристов, 1А</p><p>${phone}</p></article><article><h2>Москва</h2><p>Товарищеский переулок, 13, офис 4</p><p><a href="tel:+79825199676">+7 (982) 519-96-76</a></p></article></div>`],
};
export function info(title, body) {
  return `<div class="wrap page">${intro(title)}<div class="copy">${body}</div><a class="button" href="/request">Оставить заявку ↗</a></div>`;
}
const notice = (message) => message ? `<p role="alert" class="notice">${e(message)}</p>` : '';
export function requestForm(item, values = {}, error = '') {
  return `<div class="wrap page split"><div>${intro('Расчёт проекта', 'Укажите размеры и город. Команда сможет уточнить детали и подготовить расчёт материала.')}${item ? `<p>Материал <strong>${e(item.title)}</strong></p>` : ''}<p class="notice">Демонстрационная версия. Используйте вымышленные имя и телефон.</p></div>
  <form class="panel" method="post" action="/request">${notice(error)}<input type="hidden" name="product" value="${item?.id || ''}"><label>Имя<input name="name" maxlength="100" value="${e(values.name)}" required></label><label>Телефон<input type="tel" name="phone" maxlength="32" value="${e(values.phone)}" required></label><label>Город<input name="city" maxlength="100" value="${e(values.city)}"></label><label>Размеры и пожелания<textarea name="message" maxlength="2000" rows="4">${e(values.message)}</textarea></label><button class="button">Отправить демозаявку ↗</button></form></div>`;
}
export function login(error = '') {
  return `<div class="wrap page narrow">${intro('Вход в админ-панель')}<form method="post" class="panel">${notice(error)}<label>Пароль<input type="password" name="password" autocomplete="current-password" required></label><button class="button">Войти</button></form></div>`;
}
export function leads(rows, selected, counts) {
  return `<div class="wrap page">${intro('Заявки')}<div class="actions">${counts.map(c => `<a class="button ghost" href="/admin?status=${encodeURIComponent(c.status)}">${e(c.status)} · ${c.total}</a>`).join('')}</div><form class="filters"><label>Статус<select name="status"><option value="">Все заявки</option>${statuses.map(s => option(s, selected)).join('')}</select></label><button class="button">Показать</button><a href="/admin">Сбросить</a></form><div class="records">${rows.map(r => `<a class="record" href="/admin/leads/${r.id}"><strong>№${r.id} · ${e(r.name)}</strong><span>${e(r.product_title || 'Общий расчёт')}</span><span>${e(r.status)}</span></a>`).join('') || '<p>Заявок пока нет.</p>'}</div><form class="logout" method="post" action="/admin/logout"><button class="button ghost">Выйти</button></form></div>`;
}
export function lead(row, history) {
  return `<div class="wrap page"><a href="/admin">← Заявки</a>${intro('Заявка №' + row.id)}<div class="split"><section class="panel"><h2>${e(row.name)}</h2><p>${e(row.phone)} · ${e(row.city || 'город не указан')}</p><p>${e(row.product_title || 'Общий расчёт')}</p><p class="preserve">${e(row.message)}</p><small>${e(row.created)} UTC</small><h3>История статусов</h3><ul>${history.map(h => `<li>${e(h.status)} · ${e(h.created)} UTC</li>`).join('')}</ul></section><form method="post" class="panel"><label>Статус<select name="status">${statuses.map(s => option(s, row.status)).join('')}</select></label><label>Внутренняя заметка<textarea name="note" maxlength="2000" rows="5">${e(row.note)}</textarea></label><button class="button">Сохранить</button></form></div></div>`;
}
export function adminProducts(products) {
  return `<div class="wrap page">${intro('Товары')}<div class="actions"><a class="button" href="/admin/products/new">+ Добавить товар</a></div><div class="records">${products.map(p => `<a class="record" href="/admin/products/${p.id}"><strong>${e(p.title)}</strong><span>${e(p.category)}</span><span>${p.published ? 'Опубликован' : 'Черновик'}</span></a>`).join('') || '<p>Каталог пуст.</p>'}</div></div>`;
}
export function editProduct(item = {}, error = '') {
  return `<div class="wrap page narrow"><a href="/admin/products">← Товары</a>${intro(item.id ? 'Редактирование товара' : 'Новый товар')}<form method="post" class="panel">${notice(error)}<label>Название<input required maxlength="120" name="title" value="${e(item.title)}"></label><label>Категория<select name="category">${categories.map(c => option(c, item.category)).join('')}</select></label><label>Описание<textarea required name="description" maxlength="4000" rows="5">${e(item.description)}</textarea></label><label>Ссылка на фото (HTTPS)<input type="url" name="image" maxlength="1000" value="${e(item.image)}"></label><label class="check"><input type="checkbox" name="published" value="1" ${item.published ? 'checked' : ''}>Опубликовать в каталоге</label><button class="button">Сохранить</button></form>${item.id ? `<details class="logout"><summary>Удалить товар</summary><form method="post" action="/admin/products/${item.id}/delete"><p>Товар будет удалён. Название останется в ранее полученных заявках.</p><button class="button ghost">Подтвердить удаление</button></form></details>` : ''}</div>`;
}

export function messagePage(title, description, href, label) {
  return `<div class="wrap page">${intro(title, description)}<a class="button" href="${e(href)}">${e(label)}</a></div>`;
}
