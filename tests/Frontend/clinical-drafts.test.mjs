import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..',
);

class MemoryStorage {
    values = new Map();
    get length() {
        return this.values.size;
    }
    key(index) {
        return [...this.values.keys()][index] ?? null;
    }
    getItem(key) {
        return this.values.get(key) ?? null;
    }
    setItem(key, value) {
        this.values.set(key, String(value));
    }
    removeItem(key) {
        this.values.delete(key);
    }
}

function browser() {
    const storage = new MemoryStorage();
    let userId = 7;
    let effects = [];
    let refs = [];
    let effectIndex = 0;
    let refIndex = 0;
    let pending = [];
    let postOptions;
    const events = new Map();
    const router = {
        post: (_url, _body, options) => {
            postOptions = options;
        },
        on: (name, callback) => {
            events.set(name, callback);
            return () => events.delete(name);
        },
    };
    const react = {
        useRef: (value) => (refs[refIndex++] ??= { current: value }),
        useCallback: (fn) => fn,
        useState: (value) => [value, () => {}],
        useEffect: (fn, deps) => {
            const index = effectIndex++;
            if (
                !effects[index] ||
                deps.some((value, i) => !Object.is(value, effects[index][i]))
            )
                pending.push(fn);
            effects[index] = deps;
        },
    };
    const cache = new Map();
    const globals = {
        sessionStorage: storage,
        localStorage: new MemoryStorage(),
        Date,
        console,
    };
    function load(relative) {
        if (cache.has(relative)) return cache.get(relative);
        const module = { exports: {} };
        cache.set(relative, module.exports);
        const source = ts.transpileModule(
            readFileSync(path.join(root, relative), 'utf8'),
            {
                compilerOptions: {
                    module: ts.ModuleKind.CommonJS,
                    jsx: ts.JsxEmit.ReactJSX,
                    target: ts.ScriptTarget.ES2022,
                },
            },
        ).outputText;
        const mockedRequire = (name) => {
            if (name === 'react') return react;
            if (name === '@inertiajs/react')
                return {
                    router,
                    usePage: () => ({
                        props: {
                            auth: {
                                user: userId === null ? null : { id: userId },
                            },
                        },
                    }),
                };
            if (name === '@/contexts/logout-modal-context')
                return {
                    useLogoutModal: () => ({
                        isOpen: true,
                        userId,
                        closeModal() {},
                    }),
                };
            if (name === '@/routes')
                return { logout: () => ({ url: '/logout' }) };
            if (name.startsWith('@/components/ui/') || name === 'lucide-react')
                return new Proxy({}, { get: (_target, key) => String(key) });
            if (name.startsWith('@/lib/'))
                return load(`resources/js/${name.slice(2)}.ts`);
            return require(name);
        };
        vm.runInNewContext(
            '(function(require,module,exports){' + source + '\n})',
            globals,
        )(mockedRequire, module, module.exports);
        return module.exports;
    }
    const hook = load(
        'resources/js/hooks/use-session-draft.ts',
    ).useSessionDraft;
    return {
        storage,
        globals,
        load,
        setUser: (value) => {
            userId = value;
        },
        mount: () => {
            effects = [];
            refs = [];
        },
        render: (data, dirty, restore = () => {}, enabled = true) => {
            refIndex = 0;
            effectIndex = 0;
            pending = [];
            const result = hook(
                'physical-exam-42',
                data,
                dirty,
                restore,
                enabled,
            );
            for (const effect of pending) effect();
            return result;
        },
        logout: (outcome = 'onSuccess') => {
            const tree = load(
                'resources/js/components/logout-modal.tsx',
            ).default();
            function find(node) {
                if (node?.props?.['aria-busy'] === false && node.props.onClick)
                    return node;
                for (const child of [node?.props?.children].flat(Infinity)) {
                    const result =
                        child && typeof child === 'object' ? find(child) : null;
                    if (result) return result;
                }
                return null;
            }
            find(tree).props.onClick();
            postOptions[outcome]();
        },
        navigate: (id) =>
            events.get('navigate')?.({
                detail: {
                    page: {
                        props: { auth: { user: id === null ? null : { id } } },
                    },
                },
            }),
    };
}

function saveDraft(client) {
    client.render({}, false);
    client.render({ history: 'SYNTHETIC-PRIVATE-DRAFT' }, true);
}

test('the same clinician can restore an unsaved draft', () => {
    const client = browser();
    saveDraft(client);
    client.mount();
    const restored = [];
    client.render({}, false, (draft) => restored.push(draft));
    assert.equal(restored[0]?.history, 'SYNTHETIC-PRIVATE-DRAFT');
});

test('switching clinicians never restores or retains the previous clinician draft', () => {
    const client = browser();
    saveDraft(client);
    client.setUser(8);
    client.mount();
    const restored = [];
    client.render({}, false, (draft) => restored.push(draft));
    assert.equal(restored.length, 0);
    assert.equal(
        [...client.storage.values.values()].some((value) =>
            value.includes('SYNTHETIC-PRIVATE-DRAFT'),
        ),
        false,
    );
});

test('legacy drafts without account ownership are deleted instead of restored', () => {
    const client = browser();
    client.storage.setItem(
        'clinical-form-draft:v1:physical-exam-42',
        JSON.stringify({
            version: 1,
            savedAt: Date.now(),
            data: { history: 'LEGACY-PRIVATE' },
        }),
    );
    const restored = [];
    client.render({}, false, (draft) => restored.push(draft));
    assert.equal(restored.length, 0);
    assert.equal(
        client.storage.getItem('clinical-form-draft:v1:physical-exam-42'),
        null,
    );
});

test('successful logout deletes clinical drafts but leaves unrelated browser storage alone', () => {
    const client = browser();
    saveDraft(client);
    client.storage.setItem('unrelated-setting', 'keep');
    client.logout();
    assert.equal(
        [...client.storage.values.values()].some((value) =>
            value.includes('SYNTHETIC-PRIVATE-DRAFT'),
        ),
        false,
    );
    assert.equal(client.storage.getItem('unrelated-setting'), 'keep');
});

test('failed logout keeps the current clinician draft', () => {
    const client = browser();
    saveDraft(client);
    client.logout('onError');
    assert.equal(
        [...client.storage.values.values()].some((value) =>
            value.includes('SYNTHETIC-PRIVATE-DRAFT'),
        ),
        true,
    );
});

test('guest navigation clears clinical drafts and prevents a late save by the old form', () => {
    const client = browser();
    client
        .load('resources/js/lib/clinical-draft-storage.ts')
        .initializeClinicalDraftSession(7);
    saveDraft(client);
    client.navigate(null);
    client.render({ history: 'STALE-WRITE-AFTER-LOGOUT' }, true);
    assert.equal(
        [...client.storage.values.values()].some(
            (value) =>
                value.includes('PRIVATE') || value.includes('STALE-WRITE'),
        ),
        false,
    );
});

test('navigation clears drafts on identity change even without mounting another clinical form', () => {
    const client = browser();
    client
        .load('resources/js/lib/clinical-draft-storage.ts')
        .initializeClinicalDraftSession(7);
    saveDraft(client);
    client.navigate(7);
    assert.equal(
        [...client.storage.values.values()].some((value) =>
            value.includes('SYNTHETIC-PRIVATE-DRAFT'),
        ),
        true,
    );
    client.navigate(8);
    assert.equal(
        [...client.storage.values.values()].some((value) =>
            value.includes('SYNTHETIC-PRIVATE-DRAFT'),
        ),
        false,
    );
});

test('drafts expire and are removed on the next read', () => {
    const client = browser();
    saveDraft(client);
    const key = [...client.storage.values.keys()].find((key) =>
        key.startsWith('clinical-form-draft:'),
    );
    const draft = JSON.parse(client.storage.getItem(key));
    draft.savedAt = Date.now() - 25 * 60 * 60 * 1000;
    client.storage.setItem(key, JSON.stringify(draft));
    client.mount();
    const restored = [];
    client.render({}, false, (draft) => restored.push(draft));
    assert.equal(restored.length, 0);
    assert.equal(client.storage.getItem(key), null);
});

test('locked forms remove drafts and cannot save a new one', () => {
    const client = browser();
    saveDraft(client);
    client.render({ history: 'LOCKED-DRAFT' }, true, () => {}, false);
    assert.equal(
        [...client.storage.values.keys()].some((key) =>
            key.startsWith('clinical-form-draft:'),
        ),
        false,
    );
});

test('storage restrictions do not interrupt logout or clinical forms', () => {
    const client = browser();
    saveDraft(client);
    Object.defineProperty(client.globals, 'localStorage', {
        get() {
            throw new Error('Storage blocked');
        },
    });
    assert.doesNotThrow(() => client.logout());
    assert.equal(
        [...client.storage.values.values()].some((value) =>
            value.includes('SYNTHETIC-PRIVATE-DRAFT'),
        ),
        false,
    );
    Object.defineProperty(client.globals, 'sessionStorage', {
        get() {
            throw new Error('Storage blocked');
        },
    });
    client.mount();
    assert.doesNotThrow(() => client.render({}, true));
    assert.doesNotThrow(() => client.logout());
});
