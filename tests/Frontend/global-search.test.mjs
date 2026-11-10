import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(
    new URL(
        '../../resources/js/components/global-search-results.tsx',
        import.meta.url,
    ),
    'utf8',
);
const code = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
    },
}).outputText;
const module = { exports: {} };
vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(
    (name) => {
        if (name === 'lucide-react')
            return new Proxy({}, { get: () => () => null });
        return require(name);
    },
    module,
    module.exports,
);
const { SearchHighlight, SearchCategories, SearchResultGroups } =
    module.exports;
const html = (component, props) =>
    renderToStaticMarkup(React.createElement(component, props));

function createSearchClient() {
    let states = [],
        refs = [],
        effects = [],
        memos = [];
    let stateIndex, refIndex, effectIndex, memoIndex, pending;
    let user = { id: 1, role: 'admin' },
        mountedKey;
    const timers = new Map(),
        requests = [],
        visits = [],
        posts = [];
    const documentListeners = new Map();
    let pageControls = [],
        viewportWidth = 1024,
        viewportHeight = 768;
    let nextTimer = 0;
    const react = {
        ...React,
        useState(initial) {
            const index = stateIndex++;
            if (!(index in states))
                states[index] =
                    typeof initial === 'function' ? initial() : initial;
            return [
                states[index],
                (value) => {
                    states[index] =
                        typeof value === 'function'
                            ? value(states[index])
                            : value;
                },
            ];
        },
        useRef: (value) => (refs[refIndex++] ??= { current: value }),
        useMemo(fn, deps) {
            const index = memoIndex++;
            if (
                !memos[index] ||
                deps.some((value, i) => !Object.is(value, memos[index].deps[i]))
            )
                memos[index] = { deps, value: fn() };
            return memos[index].value;
        },
        useCallback: (fn, deps) => react.useMemo(() => fn, deps),
        useEffect(fn, deps) {
            const index = effectIndex++;
            if (
                !effects[index] ||
                deps.some(
                    (value, i) => !Object.is(value, effects[index].deps[i]),
                )
            ) {
                pending.push(() => {
                    effects[index]?.cleanup?.();
                    effects[index] = { deps, cleanup: fn() };
                });
            }
        },
    };
    const exports = {};
    const source = readFileSync(
        new URL(
            '../../resources/js/components/global-search.tsx',
            import.meta.url,
        ),
        'utf8',
    );
    const code = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            jsx: ts.JsxEmit.ReactJSX,
            target: ts.ScriptTarget.ES2022,
        },
    }).outputText;
    vm.runInNewContext(`(function(require,exports){${code}\n})`, {
        AbortController,
        document: {
            body: {},
            getElementById: () => null,
            querySelectorAll: () => pageControls,
            addEventListener(type, fn) {
                documentListeners.set(type, fn);
            },
            removeEventListener(type, fn) {
                if (documentListeners.get(type) === fn)
                    documentListeners.delete(type);
            },
        },
        window: {
            get innerWidth() {
                return viewportWidth;
            },
            get innerHeight() {
                return viewportHeight;
            },
            addEventListener() {},
            removeEventListener() {},
            setTimeout(fn) {
                timers.set(++nextTimer, fn);
                return nextTimer;
            },
            clearTimeout: (id) => timers.delete(id),
        },
    })((name) => {
        if (name === 'react') return react;
        if (name === '@inertiajs/react')
            return {
                usePage: () => ({ props: { auth: { user } } }),
                router: { visit: (url) => visits.push(url) },
            };
        if (name === 'axios')
            return {
                default: {
                    isCancel: () => false,
                    get: (_url, options) =>
                        new Promise((resolve) =>
                            requests.push({ ...options, resolve }),
                        ),
                    post: (_url, data) => {
                        posts.push(data);
                        return Promise.resolve();
                    },
                },
            };
        if (name === 'lucide-react')
            return new Proxy({}, { get: () => () => null });
        if (name === 'react-dom')
            return { createPortal: (children) => children };
        if (name === '@/components/global-search-results')
            return module.exports;
        return require(name);
    }, exports);
    function expand(node) {
        if (Array.isArray(node)) return node.map(expand);
        if (!node || typeof node !== 'object') return node;
        if (typeof node.type === 'function')
            return expand(node.type(node.props));
        return {
            ...node,
            props: { ...node.props, children: expand(node.props?.children) },
        };
    }
    return {
        requests,
        visits,
        posts,
        setPageControls(controls) {
            pageControls = controls;
        },
        setViewport(width, height) {
            viewportWidth = width;
            viewportHeight = height;
        },
        dispatchDocument(type, event) {
            documentListeners.get(type)?.(event);
        },
        setUser(next) {
            user = next;
        },
        render() {
            const root = exports.GlobalSearch();
            if (mountedKey !== root.key) {
                effects.forEach((effect) => effect?.cleanup?.());
                states = [];
                refs = [];
                effects = [];
                memos = [];
                mountedKey = root.key;
            }
            stateIndex = refIndex = effectIndex = memoIndex = 0;
            pending = [];
            const tree = expand(root);
            pending.forEach((fn) => fn());
            return tree;
        },
        runTimers() {
            const callbacks = [...timers.values()];
            timers.clear();
            callbacks.forEach((fn) => fn());
        },
        async reply(index, data) {
            requests[index].resolve({ data });
            await new Promise((resolve) => setImmediate(resolve));
        },
    };
}

function find(node, predicate) {
    if (Array.isArray(node))
        return node.flatMap((item) => find(item, predicate));
    if (!node || typeof node !== 'object') return [];
    return [
        ...(predicate(node) ? [node] : []),
        ...find(node.props?.children, predicate),
    ];
}
const searchInput = (tree) =>
    find(tree, (node) => node.props?.role === 'combobox')[0];
const options = (tree) => find(tree, (node) => node.props?.role === 'option');
const event = (key) => ({ key, preventDefault() {} });
const categories = [
    { key: 'appointments', title: 'Appointments' },
    { key: 'patients', title: 'Patients' },
];
const response = (name) => ({
    categories,
    groups: [
        {
            key: 'patients',
            title: 'Patients',
            items: [
                {
                    id: `person-${name}`,
                    type: 'person',
                    title: name,
                    subtitle: 'Patient',
                    url: `/patients/${name}`,
                },
            ],
        },
    ],
});
function startSearch(client, query) {
    let tree = client.render();
    searchInput(tree).props.onFocus();
    tree = client.render();
    searchInput(tree).props.onChange({ target: { value: query } });
    client.render();
    client.runTimers();
}

test('empty non-modal dropdown shows only server-validated recent history and replays a fresh search', async () => {
    const client = createSearchClient();
    startSearch(client, '');
    assert.equal(client.requests[0].params.q, undefined);
    await client.reply(0, {
        categories,
        groups: [],
        recent: [{ query: 'Ada', category: 'patients' }],
    });
    let tree = client.render();
    assert.equal(options(tree).length, 1);
    assert.equal(
        find(tree, (node) => node.props?.['aria-label'] === 'Search categories')
            .length,
        0,
    );
    assert.equal(
        find(tree, (node) => node.props?.['data-search-popover'] === 'true')
            .length,
        1,
    );
    assert.equal(
        find(
            tree,
            (node) =>
                node.props?.['aria-modal'] || node.props?.role === 'dialog',
        ).length,
        0,
    );
    options(tree)[0].props.onClick();
    tree = client.render();
    assert.equal(searchInput(tree).props.value, 'Ada');
    assert.equal(options(tree).length, 0);
    assert.equal(client.visits.length, 0);
    client.runTimers();
    assert.equal(client.requests[1].params.q, 'Ada');
    assert.equal(client.requests[1].params.category, 'patients');
});

test('typing one character requests scoped results instead of showing history', async () => {
    const client = createSearchClient();
    startSearch(client, 'A');
    assert.equal(client.requests[0].params.q, 'A');
    await client.reply(0, response('Ada'));
    const tree = client.render();
    assert.equal(options(tree).length, 1);
    searchInput(tree).props.onKeyDown(event('Enter'));
    assert.equal(client.posts[0].q, 'A');
});

test('Escape and outside pointer or focus dismiss the dropdown without trapping dashboard focus', () => {
    for (const type of ['keydown', 'pointerdown', 'focusin']) {
        const client = createSearchClient();
        startSearch(client, 'Ada');
        assert.equal(searchInput(client.render()).props['aria-expanded'], true);
        client.dispatchDocument(
            type,
            type === 'keydown' ? event('Escape') : { target: {} },
        );
        const tree = client.render();
        assert.equal(searchInput(tree).props['aria-expanded'], false);
        assert.equal(
            find(tree, (node) => node.props?.['data-search-popover']).length,
            0,
        );
        assert.equal(client.requests[0].signal.aborted, true);
    }
});

test('same account changing company clears recent searches and query state', async () => {
    const client = createSearchClient();
    client.setUser({ id: 2, role: 'company', company_id: 1 });
    startSearch(client, '');
    await client.reply(0, {
        categories,
        groups: [],
        recent: [{ query: 'OldCompany', category: 'patients' }],
    });
    assert.equal(options(client.render()).length, 1);
    client.setUser({ id: 2, role: 'company', company_id: 2 });
    const tree = client.render();
    assert.equal(options(tree).length, 0);
    assert.equal(searchInput(tree).props['aria-expanded'], false);
});

test('Tab reaches dropdown controls and can return to the input or leave for the dashboard', async () => {
    const client = createSearchClient();
    startSearch(client, 'Ada');
    await client.reply(0, response('Ada'));
    const tree = client.render(),
        focused = [];
    const input = {
        tabIndex: 0,
        getClientRects: () => [{}],
        focus: () => focused.push('input'),
    };
    const next = {
        tabIndex: 0,
        getClientRects: () => [{}],
        focus: () => focused.push('dashboard'),
    };
    const first = { focus: () => focused.push('filter') },
        last = {};
    const panel = find(tree, (node) => node.props?.['data-search-popover'])[0];
    searchInput(tree).props.ref.current = input;
    panel.props.ref.current = {
        querySelector: () => first,
        querySelectorAll: () => [first, last],
        contains: () => false,
    };
    client.setPageControls([input, next]);
    searchInput(tree).props.onKeyDown(event('Tab'));
    panel.props.onKeyDown({ ...event('Tab'), shiftKey: true, target: first });
    panel.props.onKeyDown({ ...event('Tab'), shiftKey: false, target: last });
    assert.deepEqual(focused, ['filter', 'input', 'dashboard']);
    assert.equal(searchInput(client.render()).props['aria-expanded'], false);
});

test('the anchored dropdown stays within a narrow mobile viewport', () => {
    const client = createSearchClient();
    client.setViewport(360, 480);
    let tree = client.render();
    tree.props.ref.current = {
        getBoundingClientRect: () => ({ left: 80, bottom: 56, width: 90 }),
    };
    searchInput(tree).props.onFocus();
    tree = client.render();
    const panel = find(tree, (node) => node.props?.['data-search-popover'])[0];
    assert.equal(panel.props.style.top, 64);
    assert.equal(panel.props.style.left, 12);
    assert.equal(panel.props.style.width, 336);
    assert.ok(panel.props.style.maxHeight + panel.props.style.top < 480);
});

test('obsolete search responses cannot replace a newer query or remain visible during typing', async () => {
    const client = createSearchClient();
    startSearch(client, 'Ada');
    searchInput(client.render()).props.onChange({ target: { value: 'Bob' } });
    assert.equal(options(client.render()).length, 0);
    client.runTimers();
    assert.equal(client.requests[0].signal.aborted, true);
    await client.reply(1, response('Bob'));
    assert.equal(options(client.render()).length, 1);
    await client.reply(0, response('Ada'));
    const tree = client.render();
    searchInput(tree).props.onKeyDown(event('Enter'));
    assert.equal(client.visits[0], '/patients/Bob');
});

test('category filtering resets keyboard selection and navigates only current results', async () => {
    const client = createSearchClient();
    startSearch(client, 'Ada');
    await client.reply(0, response('Ada'));
    let tree = client.render();
    find(
        tree,
        (node) =>
            node.type === 'button' &&
            node.props['aria-pressed'] === false &&
            node.props.children?.includes?.('Patients'),
    )[0].props.onClick();
    assert.equal(options(client.render()).length, 0);
    client.runTimers();
    assert.equal(client.requests[1].params.category, 'patients');
    const next = response('Ada');
    next.groups[0].items.push({
        id: 'person-2',
        type: 'person',
        title: 'Adam',
        subtitle: 'Doctor',
        url: '/staff/2',
    });
    await client.reply(1, next);
    tree = client.render();
    searchInput(tree).props.onKeyDown(event('ArrowDown'));
    tree = client.render();
    assert.equal(
        searchInput(tree).props['aria-activedescendant'],
        'global-search-option-1',
    );
    searchInput(tree).props.onKeyDown(event('Enter'));
    assert.equal(client.visits[0], '/staff/2');
    assert.equal(options(client.render()).length, 0);
});

test('switching signed-in identity clears old categories, results, and pending requests', async () => {
    const client = createSearchClient();
    startSearch(client, 'Ada');
    await client.reply(0, response('Ada'));
    assert.equal(options(client.render()).length, 1);
    client.setUser({ id: 2, role: 'patient' });
    const tree = client.render();
    assert.equal(options(tree).length, 0);
    assert.equal(searchInput(tree).props.value, '');
    assert.equal(client.requests[0].signal.aborted, true);
    assert.equal(
        find(tree, (node) => node.props?.['aria-label'] === 'Search categories')
            .length,
        0,
    );
});

test('search highlights every literal match without changing case or interpreting regex characters', () => {
    const result = html(SearchHighlight, {
        text: 'Ada and ADAM',
        query: 'ada',
    });
    assert.match(result, /<mark[^>]*>Ada<\/mark> and <mark[^>]*>ADA<\/mark>M/);
    assert.match(
        html(SearchHighlight, { text: 'CBC (A+)', query: '(A+)' }),
        /<mark[^>]*>\(A\+\)<\/mark>/,
    );
    assert.equal(html(SearchHighlight, { text: 'Ada', query: '' }), 'Ada');
});

test('highlighted patient text remains escaped HTML', () => {
    const result = html(SearchHighlight, {
        text: '<img src=x onerror=alert(1)>',
        query: 'img',
    });
    assert.ok(result.includes('&lt;'));
    assert.ok(!result.includes('<img'));
});

test('search renders certificate document and staff categories and result types', () => {
    const categories = [
        { key: 'patients', title: 'Patients' },
        { key: 'staff', title: 'Staff' },
        { key: 'certificates', title: 'Certificates' },
        { key: 'documents', title: 'Documents' },
    ];
    const filters = html(SearchCategories, {
        categories,
        selected: 'staff',
        onSelect() {},
    });
    for (const category of categories)
        assert.ok(filters.includes(category.title));
    assert.ok(!filters.includes('People'));
    const result = html(SearchResultGroups, {
        groups: [
            {
                key: 'staff',
                title: 'Staff',
                items: ['staff', 'certificate', 'document'].map((type) => ({
                    id: type,
                    type,
                    title: `${type} search result`,
                    subtitle: 'Authorized result',
                    url: `/${type}`,
                })),
            },
        ],
        query: 'search',
        activeIndex: 0,
        onActivate() {},
        onNavigate() {},
    });
    assert.equal((result.match(/role="option"/g) ?? []).length, 3);
});

test('category controls only render server supplied categories and show the active filter', () => {
    const result = html(SearchCategories, {
        categories: [{ key: 'appointments', title: 'My appointments' }],
        selected: 'appointments',
        onSelect: () => {},
    });
    assert.match(result, /My appointments/);
    assert.match(result, /aria-pressed="true"/);
    assert.doesNotMatch(
        result,
        /Patients|Companies|Staff|Certificates|Documents|Emails|Files/,
    );
    assert.match(result, /All results/);
});

test('grouped result rows show names, context, highlights, and one keyboard selection', () => {
    const result = html(SearchResultGroups, {
        groups: [
            {
                key: 'patients',
                title: 'Patients',
                items: [
                    {
                        id: 'person-1',
                        type: 'person',
                        title: 'Ada Reyes',
                        subtitle: 'Patient · ada@example.test',
                        url: '/patients/1',
                    },
                    {
                        id: 'person-2',
                        type: 'person',
                        title: 'Adam Cruz',
                        subtitle: 'Doctor · adam@example.test',
                        url: '/staff/2',
                    },
                ],
            },
        ],
        query: 'ada',
        activeIndex: 1,
        onActivate: () => {},
        onNavigate: () => {},
    });
    assert.match(result, /Patients/);
    assert.match(result, /<mark[^>]*>Ada<\/mark> Reyes/);
    assert.match(result, /Patient/);
    assert.equal((result.match(/aria-selected="true"/g) ?? []).length, 1);
    assert.equal((result.match(/role="option"/g) ?? []).length, 2);
    assert.match(result, /id="global-search-option-1"/);
});
