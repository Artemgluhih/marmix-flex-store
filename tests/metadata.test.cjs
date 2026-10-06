const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, env, metadata) {
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    exports: module.exports, module, URL, process: { env },
    require(name) {
      if (name === '@/lib/seo/metadata') return metadata;
      if (name === 'next/font/google') return { Manrope: () => ({ variable: '' }), Prata: () => ({ variable: '' }) };
      return {};
    },
  }, { filename: file });
  return module.exports;
}
const helperFile = 'src/lib/seo/metadata.ts';
const routes = ['/', '/applications', '/about', '/delivery', '/contacts', '/privacy', '/terms', '/cart', '/checkout'];
const pageFile = route => `src/app/(public)/${route === '/' ? '' : route.slice(1) + '/'}page.tsx`;
let checks = 0;
for (const deployment of ['preview', 'development', undefined, 'production']) {
  const env = { SITE_URL: 'https://marmixflex.ru', VERCEL_ENV: deployment, NODE_ENV: 'production', VERCEL_URL: 'wrong-preview.vercel.app' };
  const helper = load(helperFile, env);
  const root = helper.createRootMetadata();
  assert.equal(root.metadataBase.toString(), 'https://marmixflex.ru/');
  assert.equal(root.alternates, undefined, 'root must not leak a homepage canonical into private routes');
  assert.equal(root.robots.index, deployment === 'production');
  const descriptions = new Set();
  for (const route of routes) {
    const metadata = load(pageFile(route), env, helper).metadata;
    const privateRoute = ['/privacy', '/terms', '/cart', '/checkout'].includes(route);
    const indexable = deployment === 'production' && !privateRoute;
    assert.equal(metadata.robots.index, indexable, `${deployment} ${route} index`);
    assert.equal(metadata.robots.follow, indexable, `${deployment} ${route} follow`);
    assert.ok(metadata.description.length > 20);
    assert.ok(!descriptions.has(metadata.description), `duplicate description ${route}`);
    descriptions.add(metadata.description);
    if (route === '/cart' || route === '/checkout') assert.equal(metadata.alternates, undefined);
    else assert.equal(metadata.alternates.canonical, `https://marmixflex.ru${route}`);
    checks++;
  }
  for (const file of ['src/app/admin/layout.tsx', 'src/app/admin/(workspace)/layout.tsx', 'src/app/admin/login/page.tsx']) {
    const metadata = load(file, env, helper).metadata;
    assert.equal(metadata.robots.index, false, file);
    assert.equal(metadata.robots.follow, false, file);
    assert.equal(metadata.alternates, undefined, file);
    checks++;
  }
}
for (const SITE_URL of [undefined, '', 'not-a-url', 'http://example.com', 'https://localhost', 'https://127.0.0.1', 'https://demo.vercel.app', 'https://user:password@example.com', 'https://example.com/path', 'https://example.com?utm=x', 'https://example.com/#fragment']) {
  assert.throws(() => load(helperFile, { SITE_URL }).getSiteUrl(), /SITE_URL/);
  checks++;
}
const otherOrigin = load(helperFile, { SITE_URL: ' https://example.com/ ', VERCEL_ENV: 'preview' });
assert.equal(otherOrigin.createStaticMetadata({ path: '/about', title: 'About', description: 'Example' }).alternates.canonical, 'https://example.com/about', 'SITE_URL must be the only canonical origin');
const home = load(pageFile('/'), { SITE_URL: 'https://marmixflex.ru', VERCEL_ENV: 'preview' }, otherOrigin).metadata;
assert.equal(home.title.absolute, 'Marmix Flex — декоративные отделочные материалы');
assert.match(fs.readFileSync(helperFile, 'utf8'), /import "server-only"/);
assert.doesNotMatch(fs.readFileSync(helperFile, 'utf8'), /SUPABASE|TELEGRAM|SECRET|NEXT_PUBLIC/);
console.log(`PASS: ${checks} environment/route/config checks; root canonical isolation; SITE_URL source; homepage absolute title; server-only boundary.`);
