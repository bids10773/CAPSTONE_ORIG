import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../../resources/js/pages/appointments/show.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const module = { exports: {} };
vm.runInThisContext(`(function(require,module,exports){${code}\n})`)((name) => {
    if (name === '@inertiajs/react') return {
        Head: () => null,
        Link: ({ children, href, ...props }) => React.createElement('a', { href, ...props }, children),
        usePage: () => ({ props: { auth: { user: { role: 'patient' } } } }),
    };
    if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
    if (name === '@/layouts/app-layout') return { default: ({ children }) => children };
    if (name === '@/lib/appointment-status') return { appointmentStatusLabel: (status) => status };
    if (name.startsWith('@/')) return {};
    return require(name);
}, module, module.exports);

function record(purpose, services = ['PE'], laboratorySections = {}) {
    return renderToStaticMarkup(React.createElement(module.exports.default, {
        appointment: {
            id: 1, reference_code: 'APT0001', appointment_date: '2026-10-30', status: 'pending',
            examination_purpose: purpose, service_types: services,
            user: { first_name: 'Ana', last_name: 'Cruz', patient_profile: {} },
        },
        appointmentsIndexUrl: '/appointments', completePeReadyForPickup: false, laboratorySections,
    }));
}

test('consultation requests show the certificate instead of a complete examination report', () => {
    const html = record('medical_clearance');
    assert.match(html, /Medical Certificate/);
    assert.doesNotMatch(html, /Complete Medical Examination Report/);
});

test('PE-only visits show a physical examination report without automatic other services', () => {
    const html = record(null);
    assert.match(html, /Physical Examination Report/);
    assert.doesNotMatch(html, /Complete Medical Examination Report|Laboratory Report|X-Ray Report/);
});

test('consultations show separate reports for additional requested services', () => {
    const html = record('medical_clearance', ['PE', 'CBC', 'X-Ray'], { cbc: { label: 'CBC', column: 'cbc_results' } });
    assert.match(html, /Medical Certificate/);
    assert.match(html, /Laboratory Report/);
    assert.match(html, /X-Ray Report/);
    assert.doesNotMatch(html, /Complete Medical Examination Report/);
});

test('explicit pre-employment and annual packages retain a complete examination report', () => {
    for (const purpose of ['pre_employment', 'annual_pe']) {
        assert.match(record(purpose), /Complete Medical Examination Report/);
    }
});
