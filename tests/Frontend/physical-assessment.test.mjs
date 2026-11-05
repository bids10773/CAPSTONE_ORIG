import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);

test('a new xray form does not invent normal findings or an impression', () => {
    const code = ts.transpileModule(
        readFileSync(new URL('../../resources/js/pages/radtech/xray-report-form.tsx', import.meta.url), 'utf8'),
        { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
    ).outputText;
    const exports = {};
    let initial;
    const stub = () => null;
    vm.runInNewContext('(function(require,exports){' + code + '\n})')((name) => {
        if (name === 'lucide-react') return new Proxy({}, { get: () => stub });
        if (name === '@inertiajs/react') return { Head: stub, Link: stub, useForm: (data) => { initial = data; return { data, errors: {} }; } };
        if (name === '@/hooks/use-session-draft') return { useSessionDraft: () => ({ clearDraft() {} }) };
        if (name === '@/lib/appointment-date-time') return { formatAppointmentDate: () => 'Today' };
        if (name.startsWith('@/')) return { __esModule: true, default: stub };
        return require(name);
    }, exports);
    exports.default({ appointment: { id: 1, user: { first_name: 'Test', last_name: 'Patient' } }, xrayReport: null, locked: false });
    assert.equal(initial.chest_status, '');
    assert.equal(initial.chest_findings, '');
    assert.equal(initial.impression, '');
});

function assessment(value, completed) {
    const source = ts.transpileModule(
        readFileSync(new URL('../../resources/js/lib/physical-assessment.ts', import.meta.url), 'utf8'),
        { compilerOptions: { module: ts.ModuleKind.CommonJS } },
    ).outputText;
    const exports = {};
    vm.runInNewContext(source, { exports });
    return exports.physicalAssessment(value, completed);
}

test('an untouched physical finding is unselected rather than normal', () => {
    assert.equal(assessment(null, false).status, '');
    assert.equal(assessment('', false).finding, '');
});

test('completed historical exams retain normal findings', () => {
    assert.equal(assessment(null, true).status, 'normal');
    assert.equal(assessment('Tenderness', true).status, 'with_findings');
});

test('documented exceptions reopen with their reason and assessment state', () => {
    assert.equal(assessment('Not assessed: Patient declined', true).status, 'not_assessed');
    assert.equal(assessment('Not assessed: Patient declined', true).finding, 'Patient declined');
    assert.equal(assessment('Not applicable: Prior surgery', true).status, 'not_applicable');
    assert.equal(assessment('Not applicable: Prior surgery', true).finding, 'Prior surgery');
});

test('intake shows the reason for an unassessed measurement without inventing a reading', () => {
    const code = ts.transpileModule(
        readFileSync(new URL('../../resources/js/components/intake-measurements.tsx', import.meta.url), 'utf8'),
        { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
    ).outputText;
    const exports = {};
    vm.runInNewContext('(function(require,exports){' + code + '\n})')((name) => {
        if (name === '@/components/bmi-summary') return { BmiSummary: () => null };
        return require(name);
    }, exports);
    const html = renderToStaticMarkup(React.createElement(exports.IntakeMeasurements, {
        measurements: { weight: null, not_assessed: { weight: 'Unable to stand safely on scale' } },
    }));
    assert.match(html, /Not assessed: Unable to stand safely on scale/);
    assert.doesNotMatch(html, />0</);
});
