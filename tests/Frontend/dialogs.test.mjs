import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
function controller() {
    const source = ts.transpileModule(readFileSync(path.join(root, 'resources/js/lib/dialog-controller.ts'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(`(function(module,exports){${source}\n})`)(module, module.exports);
    return module.exports.createDialogController();
}

test('confirmation waits for the user and preserves multiline messages', async () => {
    const dialogs = controller();
    let proceeded = false;
    const result = dialogs.confirm('Delete this record?\n\nThis cannot be undone.').then((confirmed) => { proceeded = confirmed; });
    await Promise.resolve();
    assert.equal(proceeded, false);
    const request = dialogs.getSnapshot();
    assert.equal(request.message, 'Delete this record?\n\nThis cannot be undone.');
    dialogs.settle(request.id, true);
    await result;
    assert.equal(proceeded, true);
    assert.equal(dialogs.getSnapshot(), null);
});

test('Cancel, Escape, close and backdrop dismissal resolve confirmation as false', async () => {
    const dialogs = controller();
    const result = dialogs.confirm('Finalize this report?');
    dialogs.cancel();
    assert.equal(await result, false);
});

test('prompts preserve input, empty strings and cancellation separately', async () => {
    const dialogs = controller();
    for (const value of ['Review reason', '', null]) {
        const result = dialogs.prompt('Remarks (optional)', 'Existing value');
        assert.equal(dialogs.getSnapshot().defaultValue, 'Existing value');
        dialogs.settle(dialogs.getSnapshot().id, value);
        assert.equal(await result, value);
    }
});

test('rapid repeated requests cannot produce duplicate confirmed actions', async () => {
    const dialogs = controller();
    let actions = 0;
    const first = dialogs.confirm('Delete patient?').then((ok) => { if (ok) actions++; });
    const duplicate = dialogs.confirm('Delete patient?').then((ok) => { if (ok) actions++; });
    dialogs.settle(dialogs.getSnapshot().id, true);
    await Promise.all([first, duplicate]);
    assert.equal(actions, 1);
});

test('stale close events cannot dismiss a subsequent prompt in a workflow', async () => {
    const dialogs = controller();
    const first = dialogs.confirm('Is the recipient an authorized representative?');
    const previous = dialogs.getSnapshot();
    dialogs.settle(previous.id, true);
    assert.equal(await first, true);
    const next = dialogs.prompt('Representative full name');
    const current = dialogs.getSnapshot();
    dialogs.settle(previous.id, false);
    assert.equal(dialogs.getSnapshot().id, current.id);
    dialogs.settle(current.id, 'Jane Doe');
    assert.equal(await next, 'Jane Doe');
});

test('navigation cancels pending dialogs and invalidates the previous workflow session', async () => {
    const dialogs = controller();
    const isCurrent = dialogs.session();
    const pending = dialogs.confirm('Is the recipient an authorized representative?');
    dialogs.reset();
    assert.equal(await pending, false);
    assert.equal(isCurrent(), false);
    assert.equal(dialogs.getSnapshot(), null);
    assert.equal(dialogs.session()(), true);
});

test('subscribers see a dialog open and close once', async () => {
    const dialogs = controller();
    const changes = [];
    const unsubscribe = dialogs.subscribe(() => changes.push(dialogs.getSnapshot()?.message ?? null));
    const result = dialogs.prompt('Cancellation reason');
    dialogs.cancel();
    assert.equal(await result, null);
    unsubscribe();
    assert.deepEqual(changes, ['Cancellation reason', null]);
});

function documentWorkflow() {
    const dialogs = controller();
    const requests = [];
    const source = ts.transpileModule(readFileSync(path.join(root, 'resources/js/pages/medical-documents/index.tsx'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    const element = (type, props) => ({ type, props });
    const mockedRequire = (name) => {
        if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element, Fragment: 'Fragment' };
        if (name === 'react') return { useState: (value) => [value, () => {}] };
        if (name === '@inertiajs/react') return { Head: 'Head', Link: 'Link', router: {
            post: (...args) => requests.push(args), get() {}, patch() {},
        } };
        if (name === '@/lib/dialogs') return {
            dialogs, confirmAction: dialogs.confirm, promptAction: dialogs.prompt, dialogSession: dialogs.session,
        };
        return new Proxy({ __esModule: true, default: 'Component' }, { get: (target, key) => target[key] ?? String(key) });
    };
    vm.runInNewContext(`(function(require,module,exports){${source}\n})`)(mockedRequire, module, module.exports);
    const tree = module.exports.default({
        documents: { data: [{ id: 7, title: 'Laboratory Report', status: 'ready_for_pickup', can: { release: true } }], links: [] },
        releaseMethods: { pickup: 'Pickup' },
    });
    function text(node) {
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(text).join('');
        return node?.props ? text(node.props.children) : '';
    }
    function find(node) {
        if (node?.type === 'button' && text(node).trim() === 'Record release') return node;
        for (const child of [node?.props?.children ?? node].flat(Infinity)) {
            if (child && child !== node && typeof child === 'object') { const found = find(child); if (found) return found; }
        }
    }
    const button = find(tree);
    assert.ok(button, 'Document release action is present');
    return { dialogs, requests, release: button.props.onClick };
}

const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
async function answer(dialogs, value) {
    assert.ok(dialogs.getSnapshot());
    dialogs.settle(dialogs.getSnapshot().id, value);
    await tick();
}

test('document release retains the original patient-recipient branch and optional remarks cancellation', async () => {
    const { dialogs, requests, release } = documentWorkflow();
    const pending = release();
    await answer(dialogs, false);
    assert.equal(dialogs.getSnapshot().message, 'Remarks (optional)');
    await answer(dialogs, null);
    await pending;
    assert.equal(requests.length, 1);
    assert.equal(requests[0][0], '/medical-documents/7/release');
    assert.equal(requests[0][1].recipient_type, 'patient');
    assert.equal(requests[0][1].remarks, null);
});

test('representative release waits for each original prompt and keeps the request payload', async () => {
    const { dialogs, requests, release } = documentWorkflow();
    const pending = release();
    await answer(dialogs, true);
    assert.equal(dialogs.getSnapshot().message, 'Representative full name');
    await answer(dialogs, 'Jane Doe');
    assert.equal(dialogs.getSnapshot().message, 'Identity/authorization verification details');
    await answer(dialogs, 'Verified authorization letter');
    await answer(dialogs, 'Released at reception');
    await pending;
    assert.equal(requests.length, 1);
    assert.equal(requests[0][1].recipient_name, 'Jane Doe');
    assert.equal(requests[0][1].representative_verification, 'Verified authorization letter');
    assert.equal(requests[0][1].recipient_type, 'authorized_representative');
    assert.equal(requests[0][1].release_method, 'pickup');
});

test('navigation during document release does not submit or open another prompt', async () => {
    const { dialogs, requests, release } = documentWorkflow();
    const pending = release();
    dialogs.reset();
    await tick();
    assert.equal(dialogs.getSnapshot(), null);
    assert.equal(requests.length, 0);
    await pending;
});

test('double clicking document release cannot bypass its recipient confirmation', async () => {
    const { dialogs, requests, release } = documentWorkflow();
    const first = release();
    const duplicate = release();
    await tick();
    assert.equal(requests.length, 0);
    await answer(dialogs, false);
    await answer(dialogs, '');
    await Promise.all([first, duplicate]);
    assert.equal(requests.length, 1);
});

function modalHost(dialogs, opener = null) {
    const source = ts.transpileModule(readFileSync(path.join(root, 'resources/js/components/confirmation-dialogs.tsx'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    const element = (type, props) => ({ type, props });
    const events = new Map();
    const mockedRequire = (name) => {
        if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element, Fragment: 'Fragment' };
        if (name === 'react') return {
            useState: (value) => [value, () => {}], useRef: () => ({ current: null }),
            useSyncExternalStore: (_subscribe, snapshot) => snapshot(), useEffect: (effect) => effect(),
        };
        if (name === '@/lib/dialogs') return { dialogs };
        if (name === '@inertiajs/react') return { router: { on: (event, callback) => {
            events.set(event, callback); return () => events.delete(event);
        } } };
        return new Proxy({}, { get: (_target, key) => String(key) });
    };
    vm.runInNewContext(`(function(require,module,exports){${source}\n})`, {
        document: { activeElement: opener },
        window: { setTimeout: (callback) => Promise.resolve().then(callback) },
        HTMLElement: class {},
    })(mockedRequire, module, module.exports);
    const host = module.exports.ConfirmationDialogs();
    return { tree: host.type(host.props), events };
}
function findType(node, type) {
    if (node?.type === type) return node;
    for (const child of [node?.props?.children ?? node].flat(Infinity)) {
        if (child && child !== node && typeof child === 'object') { const found = findType(child, type); if (found) return found; }
    }
}

test('modal close callbacks cancel the pending action and form submission confirms it', async () => {
    const dialogs = controller();
    const cancelled = dialogs.confirm('Delete this account?');
    modalHost(dialogs).tree.props.onOpenChange(false);
    assert.equal(await cancelled, false);

    const confirmed = dialogs.confirm('Finalize these results?');
    const { tree } = modalHost(dialogs);
    let prevented = false;
    findType(tree, 'form').props.onSubmit({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(await confirmed, true);
});

test('prompt modal provides the original message and input and cancels when navigation starts', async () => {
    const dialogs = controller();
    const pending = dialogs.prompt('Required reversal reason', 'Original reason');
    const { tree, events } = modalHost(dialogs);
    const input = findType(tree, 'Input');
    assert.equal(input.props['aria-label'], 'Required reversal reason');
    assert.equal(input.props.value, 'Original reason');
    events.get('start')();
    assert.equal(await pending, null);
});

test('modal dismissal returns keyboard focus to its connected opener', async () => {
    const dialogs = controller();
    let focused = false;
    const opener = { isConnected: true, focus() { focused = true; } };
    const pending = dialogs.confirm('Delete this account?');
    const { tree } = modalHost(dialogs, opener);
    const content = findType(tree, 'DialogContent');
    content.props.onOpenAutoFocus({ preventDefault() {} });
    tree.props.onOpenChange(false);
    content.props.onCloseAutoFocus({ preventDefault() {} });
    await pending;
    await tick();
    assert.equal(focused, true);
});

test('navigation does not restore focus to the previous page control', async () => {
    const dialogs = controller();
    let focused = false;
    const opener = { isConnected: true, focus() { focused = true; } };
    const pending = dialogs.confirm('Delete this account?');
    const { tree, events } = modalHost(dialogs, opener);
    const content = findType(tree, 'DialogContent');
    content.props.onOpenAutoFocus({ preventDefault() {} });
    events.get('start')();
    content.props.onCloseAutoFocus({ preventDefault() {} });
    await pending;
    await tick();
    assert.equal(focused, false);
});

function companyToggle() {
    const dialogs = controller();
    const requests = [];
    const source = ts.transpileModule(readFileSync(path.join(root, 'resources/js/pages/admin/companies/index.tsx'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    const element = (type, props) => ({ type, props });
    const mockedRequire = (name) => {
        if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element, Fragment: 'Fragment' };
        if (name === '@/lib/dialogs') return { confirmAction: dialogs.confirm };
        if (name === '@inertiajs/react') return { Head: 'Head', Link: 'Link', router: {
            patch: (...args) => requests.push(args),
        }, usePage: () => ({ props: { filters: {}, companies: {
            data: [{ id: 3, company_name: 'Test Company', status: 'active', account: [], created_at: '2026-10-28', appointments_count: 0 }],
            links: [], total: 1,
        } } }) };
        return new Proxy({ __esModule: true, default: 'Component' }, { get: (target, key) => target[key] ?? String(key) });
    };
    vm.runInNewContext(`(function(require,module,exports){${source}\n})`)(mockedRequire, module, module.exports);
    function find(node) {
        if (node?.props?.['aria-label'] === 'Deactivate Test Company') return node;
        for (const child of [node?.props?.children ?? node].flat(Infinity)) {
            if (child && child !== node && typeof child === 'object') { const found = find(child); if (found) return found; }
        }
    }
    const button = find(module.exports.default());
    assert.ok(button);
    return { dialogs, requests, click: () => {
        let prevented = false;
        const pending = button.props.onClick({ preventDefault() { prevented = true; } });
        // Inertia Link dispatches immediately after its synchronous click callback.
        if (button.type === 'Link' && !prevented) requests.push([button.props.href]);
        return pending;
    } };
}

test('company activation waits for confirmation and does nothing on Cancel', async () => {
    const { dialogs, requests, click } = companyToggle();
    const cancelled = click();
    assert.equal(requests.length, 0);
    await answer(dialogs, false);
    await cancelled;
    assert.equal(requests.length, 0);

    const confirmed = click();
    assert.equal(requests.length, 0);
    await answer(dialogs, true);
    await confirmed;
    assert.equal(requests.length, 1);
    assert.equal(requests[0][0], '/admin/companies/3/toggle-active');
});
