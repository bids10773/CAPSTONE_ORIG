import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';
import React from 'react';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../../resources/js/pages/admin/onsite-events/show.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function render(status = 'pending', server = false) {
    const portals = [];
    const body = {};
    const module = { exports: {} };
    const context = server ? {} : { document: { body } };
    vm.runInNewContext(`(function(require,module,exports){${code}\n})`, context)((name) => {
        if (name === 'react') return {
            ...React,
            useState: (initial) => [initial, () => {}],
            useSyncExternalStore: (_subscribe, clientSnapshot, serverSnapshot) =>
                server ? serverSnapshot() : clientSnapshot(),
        };
        if (name === 'react-dom') return {
            createPortal: (children, container) => {
                portals.push({ children, container });
                return null;
            },
        };
        if (name === '@inertiajs/react') return { Head: () => null, Link: () => null, router: {} };
        if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
        if (name === '@/components/ui/button') return { Button: () => null };
        if (name === '@/lib/appointment-date-time') return { formatEventDateRange: () => '' };
        if (name.startsWith('@/')) return { default: () => null };
        return require(name);
    }, module, module.exports);
    module.exports.default({
        event: { id: 182, status, appointment_date: '2026-11-06', onsite_staff: [], company: {} },
        attendance: { total: 5 },
        employees: { data: [], links: [] },
        staffing: {
            ready: false, missing_roles: [], masterlist_employee_count: 5,
            recommendations: Object.fromEntries(['doctor', 'medtech', 'radtech', 'receptionist'].map((role) =>
                [role, { required: true, recommended: 1 }])),
        },
        staffOptions: [],
    });
    return { portals, body };
}

test('pending approval controls escape isolated and animated page containers', () => {
    const { portals, body } = render();
    assert.equal(portals.length, 1, 'Approval panel must render outside the isolated masterlist section');
    assert.equal(portals[0].container, body);
    assert.equal(portals[0].children.props['aria-label'], 'Bulk appointment approval');
});

test('accepted appointments do not show floating approval controls', () => {
    assert.equal(render('accepted').portals.length, 0);
});

test('server rendering does not access document to mount approval controls', () => {
    assert.equal(render('pending', true).portals.length, 0);
});
