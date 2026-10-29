import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function load() {
    const code = ts.transpileModule(readFileSync(new URL('../../resources/js/lib/notification-refresh.ts', import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(`(function(module,exports){${code}\n})`, { AbortController, setTimeout, clearTimeout })(module, module.exports);
    return module.exports.createNotificationRefresh;
}

test('events arriving during a refresh trigger a trailing refresh with the latest data', async () => {
    const create = load();
    let calls = 0;
    const releases = [];
    const published = [];
    const refresh = create(() => new Promise(resolve => { calls++; releases.push(resolve); }), value => published.push(value));
    const first = refresh.run();
    refresh.run();
    refresh.run();
    assert.equal(calls, 1);
    releases.shift()(1);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls, 2);
    releases.shift()(2);
    await first;
    assert.deepEqual(published, [1, 2]);
});

test('failed refreshes can retry and disposed account refreshes never publish', async () => {
    const create = load();
    let calls = 0;
    const values = [];
    const refresh = create(async () => { if (++calls === 1) throw new Error('offline'); return 2; }, value => values.push(value));
    await refresh.run();
    await refresh.run();
    assert.deepEqual(values, [2]);
    let release;
    const stale = create(() => new Promise(resolve => { release = resolve; }), value => values.push(value));
    const pending = stale.run();
    stale.dispose();
    release(3);
    await pending;
    assert.deepEqual(values, [2]);
});

test('full notification page refreshes its current list and queues live updates without cancelling form visits', () => {
    const code = ts.transpileModule(readFileSync(new URL('../../resources/js/pages/notifications/index.tsx', import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const listeners = new Map();
    const requests = [];
    let effect;
    const module = { exports: {} };
    const mocks = {
        '@inertiajs/react': { usePage: () => ({ props: { notifications: { data: [], links: [], total: 0 }, filter: 'unread', notificationCenter: { unreadCount: 0 } } }), router: { reload: options => requests.push(options) } },
        react: { useEffect: callback => { effect = callback; } },
        'react/jsx-runtime': { jsx: () => null, jsxs: () => null },
    };
    vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
        window: { addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: name => listeners.delete(name) },
    })(name => mocks[name] ?? {}, module, module.exports);
    module.exports.default();
    const cleanup = effect();
    const refresh = listeners.get('notification-center-refreshed');
    assert.equal(typeof refresh, 'function');
    refresh();
    refresh();
    assert.equal(requests.length, 1);
    assert.deepEqual(Array.from(requests[0].only), ['notifications', 'notificationCenter']);
    assert.equal(requests[0].async, true);
    requests[0].onFinish();
    assert.equal(requests.length, 2);
    refresh();
    cleanup();
    requests[1].onFinish();
    assert.equal(requests.length, 2);
    assert.equal(listeners.size, 0);
});
