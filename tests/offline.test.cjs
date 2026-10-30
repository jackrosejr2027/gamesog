const fs = require('fs'), vm = require('vm'), assert = require('assert');
const origin = 'https://arcade.test/';
const handlers = {}, stored = new Map(), deleted = [];
let activated = false, claimed = false, networkCalls = 0, failPath = null;
class LocalRequest extends Request {
  constructor(input, init) { super(new URL(input instanceof Request ? input.url : input, origin), init); }
}
const key = input => new URL(input instanceof Request ? input.url : input, origin).href;
const cache = {
  async add(request) {
    const path = new URL(request.url).pathname.slice(1) || 'index.html';
    if (path === failPath) throw Error('Unavailable: ' + path);
    assert(fs.existsSync(path), 'Missing offline asset: ' + path);
    assert.equal(request.cache, 'reload');
    stored.set(key(request), new Response(path));
  },
  async put(request, response) { stored.set(key(request), response); }
};
const caches = {
  async open() { return cache; },
  async match(request) { return stored.get(key(request)); },
  async keys() { return ['card-arcade-2.2.0-motion', 'unrelated-app']; },
  async delete(name) { deleted.push(name); }
};
const ctx = { URL, Request: LocalRequest, Response, caches,
  fetch: async () => { networkCalls++; throw Error('Offline'); },
  self: { location: { origin: new URL(origin).origin, href: origin + 'sw.js' },
    addEventListener: (name, fn) => handlers[name] = fn,
    skipWaiting: async () => { activated = true; },
    clients: { claim: async () => { claimed = true; } } }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('sw.js', 'utf8'), ctx);
const files = vm.runInContext('FILES', ctx);
(async () => {
  let pending;
  handlers.install({ waitUntil: p => pending = p }); await pending;
  assert(activated);
  const expected = ['index.html', 'demo.html', 'js/board-worker.js', 'vendor/chess.js',
    'downloads/offllinecodebbase.zip'];
  for (const folder of ['ordinary', 'pullcrest']) {
    for (const file of fs.readdirSync(folder)) if (file.endsWith('.json')) expected.push(folder + '/' + file);
    for (const file of fs.readdirSync(folder + '/art')) expected.push(folder + '/art/' + file);
  }
  for (const page of ['index.html', 'demo.html']) {
    for (const match of fs.readFileSync(page, 'utf8').matchAll(/(?:src|href)="([^"]+)"/g)) {
      assert(!match[1].includes('://') && !match[1].startsWith('//'), 'External dependency: ' + match[1]);
      expected.push(match[1]);
    }
  }
  for (const path of expected) assert(files.includes(path), 'Not precached: ' + path);
  handlers.activate({ waitUntil: p => pending = p }); await pending;
  assert(claimed); assert.deepEqual(deleted, ['card-arcade-2.2.0-motion']);
  for (const path of [...new Set(expected), 'demo.html?game=ordinary', 'demo.html?game=pullcrest', 'index.html?installed=1', 'js/game-sessions.js?v=1.0', 'mobile.css?v=1.0']) {
    let response;
    handlers.fetch({ request: new LocalRequest(path), respondWith: p => response = p, waitUntil() {} });
    assert((await response).ok, 'Unavailable offline: ' + path);
  }
  assert.equal(networkCalls, 0, 'Offline features must not need network fallback');
  activated = false; failPath = 'downloads/offllinecodebbase.zip';
  handlers.install({ waitUntil: p => pending = p }); await pending;
  assert(activated, 'Extracted local copies install without a recursive ZIP');
  activated = false; failPath = 'ordinary/cards-creature.json';
  handlers.install({ waitUntil: p => pending = p });
  await assert.rejects(pending, /Unavailable/);
  assert(!activated, 'Incomplete required catalogs must not activate');
  console.log('PASS: complete offline inventory, all local dependencies, catalogs, art, demos, ZIP, scoped cache cleanup and zero-network cached requests.');
})().catch(error => { console.error(error); process.exitCode = 1; });
