import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../../resources/js/pages/dashboard.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(`${source}\nexport { careSteps };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const module = { exports: {} };
vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(
    (name) => name === '@inertiajs/react' || name === 'lucide-react' || name.startsWith('@/') ? {} : require(name),
    module, module.exports,
);
const { careSteps } = module.exports;

test('PE alone shows physical examination without laboratory or X-ray', () => {
    const labels = careSteps({ service_types: ['PE'], status: 'pending' }).map((step) => step.label);
    assert.ok(labels.includes('Physical exam'));
    assert.ok(!labels.includes('Laboratory'));
    assert.ok(!labels.includes('X-ray'));
    assert.ok(!labels.includes('Final clearance'));
});

test('only requested additional services appear in the care stages', () => {
    for (const [services, laboratory, xray] of [
        [['PE', 'CBC'], true, false],
        [['PE', 'X-Ray'], false, true],
        [['PE', 'CBC', 'X-Ray'], true, true],
        [['CBC'], true, false],
    ]) {
        const labels = careSteps({ service_types: services, status: 'pending' }).map((step) => step.label);
        assert.equal(labels.includes('Laboratory'), laboratory, services.join(', '));
        assert.equal(labels.includes('X-ray'), xray, services.join(', '));
    }
});

test('X-ray is the current stage when requested without laboratory tests', () => {
    const steps = careSteps({ service_types: ['PE', 'X-Ray'], status: 'for_xray' });
    assert.equal(steps.find((step) => step.current)?.label, 'X-ray');
    assert.ok(steps.find((step) => step.label === 'Physical exam')?.completed);
});
