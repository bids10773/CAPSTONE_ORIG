import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cache = new Map();
function load(relative) {
    if (cache.has(relative)) return cache.get(relative);
    const code = ts.transpileModule(readFileSync(path.join(root, relative), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const module = { exports: {} };
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(
        (name) => {
            if (!name.startsWith('@/')) return require(name);
            const base = `resources/js/${name.slice(2)}`;
            return load(existsSync(path.join(root, `${base}.tsx`)) ? `${base}.tsx` : `${base}.ts`);
        }, module, module.exports,
    );
    cache.set(relative, module.exports);
    return module.exports;
}

test('adult BMI categories handle boundaries and missing measurements', () => {
    const { getBmiClassification } = load('resources/js/lib/bmi.ts');
    for (const [bmi, expected] of [
        [18.4, 'Underweight'], [18.5, 'Normal weight'], [24.9, 'Normal weight'],
        [25, 'Overweight'], [29.9, 'Overweight'], [30, 'Obesity'], [40, 'Obesity'],
        ['22.5', 'Normal weight'], [null, null], [undefined, null], ['', null],
        [' ', null], [0, null], [-1, null], [NaN, null], [Infinity, null], ['invalid', null],
    ]) assert.equal(getBmiClassification(bmi), expected, String(bmi));
});

test('intake measurements render labeled text values with BMI classification and no form inputs', () => {
    const { IntakeMeasurements } = load('resources/js/components/intake-measurements.tsx');
    const html = renderToStaticMarkup(React.createElement(IntakeMeasurements, {
        measurements: { height: 170, weight: 65, bmi: '22.5', systolic_pressure: 120,
            diastolic_pressure: 80, heart_rate: 72, respiratory_rate: 16,
            temperature: '36.7', oxygen_saturation: 98, visual_acuity: '20/20 OU', hearing: 'Normal bilateral' },
    }));
    assert.match(html, /Normal weight/);
    assert.match(html, /20\/20 OU/);
    assert.match(html, /Normal bilateral/);
    assert.match(html, /Blood pressure/);
    assert.match(html, /120\/80/);
    assert.match(html, /170/);
    assert.match(html, /22\.5/);
    assert.equal((html.match(/<dt\b/g) ?? []).length, 9);
    assert.equal((html.match(/<dd\b/g) ?? []).length, 9);
    assert.doesNotMatch(html, /<input\b|<textarea\b|<select\b/);
});

test('missing intake results are not invented', () => {
    const { IntakeMeasurements } = load('resources/js/components/intake-measurements.tsx');
    const html = renderToStaticMarkup(React.createElement(IntakeMeasurements));
    assert.match(html, /Not recorded/);
    assert.doesNotMatch(html, /Normal weight|value="0"|value="120/);
});

test('clinical review shows full history and findings without hiding or truncating text', () => {
    const { ClinicalHistoryFindings } = load('resources/js/components/clinical-history-findings.tsx');
    const longHistory = 'Symptoms described by the patient. '.repeat(20);
    const html = renderToStaticMarkup(React.createElement(ClinicalHistoryFindings, {
        history: { present_illness: longHistory, allergies: 'Penicillin', medical_examination_id: 123456 },
        physical: { is_completed: true, lungs: 'Wheezing in both lungs', remarks: 'Review after laboratory results' },
    }));
    assert.match(html, /Medical history/);
    assert.match(html, /Physical findings/);
    assert.ok(html.includes(longHistory));
    assert.match(html, /Penicillin/);
    assert.match(html, /Wheezing in both lungs/);
    assert.match(html, /Review after laboratory results/);
    assert.doesNotMatch(html, /<details|truncate|line-clamp|123456/);
});

test('normal findings use a compact status selector without an empty notes field', () => {
    const { PhysicalFindingRow } = load('resources/js/components/physical-finding-row.tsx');
    const html = renderToStaticMarkup(React.createElement(PhysicalFindingRow, {
        field: 'lungs', label: 'Lungs', status: 'normal', finding: '',
        onStatusChange() {}, onFindingChange() {},
    }));
    assert.match(html, /Lungs/);
    assert.match(html, /<select/);
    assert.match(html, /selected="" value="normal"|value="normal" selected=""/);
    assert.doesNotMatch(html, /<textarea|<button/);
});

test('abnormal findings display their editable note and validation error', () => {
    const { PhysicalFindingRow } = load('resources/js/components/physical-finding-row.tsx');
    const html = renderToStaticMarkup(React.createElement(PhysicalFindingRow, {
        field: 'lungs', label: 'Lungs', status: 'with_findings', finding: 'Wheezing in both lungs',
        error: 'Please document the finding.', onStatusChange() {}, onFindingChange() {},
    }));
    assert.match(html, /<textarea/);
    assert.match(html, /Wheezing in both lungs/);
    assert.match(html, /Please document the finding/);
    assert.match(html, /aria-invalid="true"/);
});
