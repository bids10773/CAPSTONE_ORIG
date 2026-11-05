import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLabHarness, fixtureProps, nodes, textContent } from './helpers/lab-form-harness.mjs';

const button = (tree, text) => nodes(tree, (node) => node.type === 'button' && textContent(node).trim() === text)[0];
const tab = (tree, key) => nodes(tree, (node) => node.props.role === 'tab' && node.props['aria-controls'] === `lab-panel-${key}`)[0];
const input = (tree, id) => nodes(tree, (node) => node.props.id === id)[0];
const visiblePanels = (tree) => nodes(tree, (node) => node.props.role === 'tabpanel' && !node.props.hidden).map((node) => node.props.id);

test('the compact workspace initially shows one test and offers the original layout', () => {
    const client = createLabHarness();
    const tree = client.render();
    assert.equal(nodes(tree, (node) => node.props.role === 'tab').length, 3);
    assert.deepEqual(visiblePanels(tree), ['lab-panel-cbc']);
    assert.ok(button(tree, 'Original layout'));
    assert.ok(button(tree, 'Save draft'));
    assert.ok(button(tree, 'Finalize Laboratory Report'));
});

test('tab changes and reverting the layout preserve entered values and draft payloads', () => {
    const client = createLabHarness();
    let tree = client.render();
    input(tree, 'cbc-hemoglobin').props.onChange({ target: { value: '14.2' } });
    tab(tree, 'urinalysis').props.onClick();
    tree = client.render();
    assert.deepEqual(visiblePanels(tree), ['lab-panel-urinalysis']);
    input(tree, 'urinalysis-color').props.onChange({ target: { value: 'Yellow' }, currentTarget: { form: null } });
    button(tree, 'Original layout').props.onClick();
    tree = client.render();
    assert.equal(input(tree, 'cbc-hemoglobin').props.value, '14.2');
    assert.equal(input(tree, 'urinalysis-color').props.value, 'Yellow');
    assert.ok(button(tree, 'Tabbed layout'));
    button(tree, 'Save draft').props.onClick();
    assert.equal(client.requests[0].data.results.cbc.hemoglobin, '14.2');
    assert.equal(client.requests[0].data.results.urinalysis.color, 'Yellow');
    assert.equal(client.requests[0].data.finalize, false);
});

test('finalization opens a tab containing invalid results instead of hiding its errors', async () => {
    const client = createLabHarness();
    let tree = client.render();
    tab(tree, 'fecalysis').props.onClick();
    tree = client.render();
    await button(tree, 'Finalize Laboratory Report').props.onClick();
    tree = client.render();
    assert.deepEqual(visiblePanels(tree), ['lab-panel-cbc']);
    const panel = nodes(tree, (node) => node.props.id === 'lab-panel-cbc')[0];
    assert.ok(nodes(panel, (node) => node.props.message?.includes('Complete this result')).length);
    assert.equal(client.requests.length, 0);
});

test('an original-layout preference is restored on the next visit', () => {
    const client = createLabHarness(undefined, 'all');
    client.render();
    const tree = client.render();
    assert.ok(button(tree, 'Tabbed layout'));
    assert.equal(nodes(tree, (node) => node.props.role === 'tabpanel' && node.props.hidden).length, 0);
});

test('clearing existing remarks keeps the remarks editor open', () => {
    const client = createLabHarness({ ...fixtureProps, labResult: { remarks: 'Existing note' } });
    let tree = client.render();
    assert.equal(nodes(tree, (node) => node.type === 'details')[0].props.open, true);
    input(tree, 'remarks').props.onChange({ target: { value: '' } });
    tree = client.render();
    assert.equal(nodes(tree, (node) => node.type === 'details')[0].props.open, true);
});

test('keyboard navigation selects the next tab and wraps back to the first', () => {
    const client = createLabHarness();
    let tree = client.render();
    tab(tree, 'cbc').props.onKeyDown({ key: 'End', preventDefault() {} });
    tree = client.render();
    assert.deepEqual(visiblePanels(tree), ['lab-panel-fecalysis']);
    tab(tree, 'fecalysis').props.onKeyDown({ key: 'ArrowRight', preventDefault() {} });
    tree = client.render();
    assert.deepEqual(visiblePanels(tree), ['lab-panel-cbc']);
    assert.equal(tab(tree, 'cbc').props.tabIndex, 0);
    assert.equal(tab(tree, 'urinalysis').props.tabIndex, -1);
});

test('server validation errors activate their test tab', () => {
    const client = createLabHarness();
    let tree = client.render();
    tab(tree, 'fecalysis').props.onClick();
    tree = client.render();
    button(tree, 'Save draft').props.onClick();
    client.serverError({ 'results.urinalysis.color': 'Review the selected result.' });
    tree = client.render();
    assert.deepEqual(visiblePanels(tree), ['lab-panel-urinalysis']);
    assert.match(textContent(tab(tree, 'urinalysis')), /1 errors/);
});

test('successful finalization submits every tab together', async () => {
    const client = createLabHarness();
    let tree = client.render();
    for (const [id, value] of [['cbc-hemoglobin', '14.2'], ['urinalysis-color', 'Yellow'], ['fecalysis-consistency', 'Formed']]) {
        input(tree, id).props.onChange({ target: { value }, currentTarget: { form: null } });
    }
    tree = client.render();
    await button(tree, 'Finalize Laboratory Report').props.onClick();
    assert.equal(client.requests[0].data.finalize, true);
    assert.deepEqual(client.requests[0].data.results, {
        cbc: { hemoglobin: '14.2' }, urinalysis: { color: 'Yellow' }, fecalysis: { consistency: 'Formed' },
    });
});

test('the original layout remains available when browser storage is blocked', () => {
    const client = createLabHarness(undefined, undefined, true);
    let tree = client.render();
    button(tree, 'Original layout').props.onClick();
    tree = client.render();
    assert.ok(button(tree, 'Tabbed layout'));
    assert.equal(nodes(tree, (node) => node.props.role === 'tabpanel' && node.props.hidden).length, 0);
});

test('locked reports stay read only in both layouts', () => {
    const client = createLabHarness({ ...fixtureProps, locked: true });
    let tree = client.render();
    assert.equal(input(tree, 'cbc-hemoglobin').props.disabled, true);
    assert.equal(button(tree, 'Save draft'), undefined);
    assert.equal(button(tree, 'Finalize Laboratory Report'), undefined);
    button(tree, 'Original layout').props.onClick();
    tree = client.render();
    assert.equal(input(tree, 'cbc-hemoglobin').props.disabled, true);
});

test('drug verification keeps other tests disabled and preserves its save action', () => {
    const client = createLabHarness({ ...fixtureProps, drugVerificationPending: true, sections: {
        ...fixtureProps.sections,
        drug_test: { label: 'Drug Test', column: 'drug_test_results', fields: [
            { key: 'methamphetamine', label: 'Methamphetamine', type: 'select', options: ['Negative', 'Positive'] },
        ] },
    } });
    const tree = client.render();
    assert.equal(input(tree, 'cbc-hemoglobin').props.disabled, true);
    assert.equal(input(tree, 'drug_test-methamphetamine').props.disabled, false);
    assert.ok(button(tree, 'Save Verification Update'));
});
