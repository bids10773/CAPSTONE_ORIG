import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
export const fixtureProps = {
    appointment: { id: 42, reference_code: 'APT0042' },
    patientSummary: { name: 'Sample Patient', age: 28, sex: 'Male', company: 'Sample Company', date: '2026-11-05' },
    interpretations: {},
    locked: false,
    drugVerificationPending: false,
    submitUrl: '/medtech/lab-results/42',
    sections: {
        cbc: { label: 'Complete Blood Count', column: 'cbc_results', fields: [
            { key: 'hemoglobin', label: 'Hemoglobin', type: 'number', options: [], normal: 'M 13–17; F 12–16', unit: 'g/dL', validation: { min: 0, max: 30, decimals: 2 }, reference: { male: [13, 17], female: [12, 16] } },
        ] },
        urinalysis: { label: 'Urinalysis', column: 'urinalysis_results', fields: [
            { key: 'color', label: 'Color', type: 'select', heading: 'Routine', options: ['Yellow', 'Amber'] },
        ] },
        fecalysis: { label: 'Fecalysis', column: 'fecalysis_results', fields: [
            { key: 'consistency', label: 'Consistency', type: 'select', options: ['Formed', 'Watery'] },
        ] },
    },
};

export function createLabHarness(props = fixtureProps, initialPreference, storageBlocked = false) {
    const states = [];
    const refs = [];
    const effects = [];
    const storage = new Map(initialPreference ? [['lmic-lab-form-layout', initialPreference]] : []);
    let stateIndex = 0;
    let refIndex = 0;
    let effectIndex = 0;
    let pending = [];
    let values;
    let transform = (data) => data;
    const requests = [];
    let responseOptions;
    let serverErrors = {};
    const react = { ...React,
        useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
        useRef: (initial) => (refs[refIndex++] ??= { current: initial }),
        useState: (initial) => {
            const index = stateIndex++;
            if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
            return [states[index], (next) => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
        },
        useEffect: (fn, deps) => {
            const index = effectIndex++;
            if (!effects[index] || deps.some((value, i) => !Object.is(value, effects[index][i]))) pending.push(fn);
            effects[index] = deps;
        },
    };
    const exports = {};
    const code = ts.transpileModule(readFileSync(new URL('../../../resources/js/pages/medtech/lab-results-form.tsx', import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const stub = () => null;
    const context = {
        window: { localStorage: {
            getItem: (key) => { if (storageBlocked) throw new Error('Storage unavailable'); return storage.get(key) ?? null; },
            setItem: (key, value) => { if (storageBlocked) throw new Error('Storage unavailable'); storage.set(key, value); },
        } },
        document: { getElementById: () => null },
        requestAnimationFrame: (fn) => fn(),
    };
    vm.runInNewContext('(function(require,exports){' + code + '\n})', context)((name) => {
        if (name === 'react') return react;
        if (name === 'lucide-react') return new Proxy({}, { get: () => stub });
        if (name === '@inertiajs/react') return {
            Head: stub,
            useForm: (initial) => {
                values ??= initial;
                return {
                    get data() { return values; }, get errors() { return serverErrors; }, processing: false, isDirty: true,
                    setData: (field, value) => { values = typeof field === 'function' ? field(values) : typeof field === 'object' ? field : { ...values, [field]: value }; },
                    transform: (fn) => { transform = fn; },
                    post: (url, options) => { responseOptions = options; requests.push({ url, data: JSON.parse(JSON.stringify(transform(values))) }); },
                };
            },
        };
        if (name === '@/hooks/use-session-draft') return { useSessionDraft: () => ({ clearDraft() {} }) };
        if (name === '@/components/ui/sidebar') return { useSidebar: () => ({ open: false, isMobile: false }) };
        if (name === '@/lib/dialogs') return { confirmAction: async () => true };
        if (name === '@/components/input-error') return { __esModule: true, default: ({ message }) => message ? React.createElement('p', { role: 'alert' }, message) : null };
        if (name.startsWith('@/')) return { __esModule: true, default: stub };
        return require(name);
    }, exports);

    return {
        requests,
        serverError(errors) { serverErrors = errors; responseOptions?.onError?.(errors); },
        render() {
            stateIndex = 0;
            refIndex = 0;
            effectIndex = 0;
            pending = [];
            const tree = exports.default(props);
            pending.forEach((fn) => fn());
            return tree;
        },
    };
}

export function nodes(tree, predicate) {
    const result = [];
    const visit = (node) => {
        if (!node || typeof node !== 'object') return;
        if (predicate(node)) result.push(node);
        [node.props?.children].flat(Infinity).forEach(visit);
    };
    visit(tree);
    return result;
}

export function textContent(node) {
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node !== 'object') return String(node);
    return [node.props?.children].flat(Infinity).map(textContent).join('');
}
