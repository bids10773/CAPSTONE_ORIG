import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';
import React from 'react';
import ts from 'typescript';

const require = createRequire(import.meta.url);

function sidebar(isMobile, state = 'expanded') {
    let menu = null;
    let expanded = false;
    const primitive = () => null;
    const code = ts.transpileModule(
        readFileSync(
            new URL(
                '../../resources/js/components/app-sidebar.tsx',
                import.meta.url,
            ),
            'utf8',
        ),
        {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                jsx: ts.JsxEmit.ReactJSX,
                target: ts.ScriptTarget.ES2022,
            },
        },
    ).outputText;
    const exports = {};
    vm.runInNewContext(`(function(require,exports){${code}\n})`)((name) => {
        if (name === 'react')
            return {
                ...React,
                useState: () => [
                    menu,
                    (next) => {
                        menu = next;
                    },
                ],
            };
        if (name === '@inertiajs/react')
            return {
                Link: primitive,
                usePage: () => ({
                    props: { auth: { user: { role: 'admin' } } },
                    url: '/admin/dashboard',
                }),
            };
        if (name === '@/components/ui/sidebar')
            return new Proxy(
                {},
                {
                    get: (_, key) =>
                        key === 'useSidebar'
                            ? () => ({
                                  isMobile,
                                  state,
                                  isPinned: false,
                                  setPinned() {},
                                  setOpen: (next) => {
                                      expanded = next;
                                  },
                                  setOpenMobile() {},
                              })
                            : primitive,
                },
            );
        if (name === '@/components/ui/collapsible')
            return {
                Collapsible: 'collapsible',
                CollapsibleContent: primitive,
                CollapsibleTrigger: primitive,
            };
        if (name === 'lucide-react' || name.startsWith('@/'))
            return new Proxy({}, { get: () => primitive });
        if (name.startsWith('/public/')) return { default: '' };
        return require(name);
    }, exports);
    function findGroup(node) {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'collapsible') return node;
        for (const child of React.Children.toArray(node.props?.children)) {
            const found = findGroup(child);
            if (found) return found;
        }
    }
    return {
        group: () => findGroup(exports.AppSidebar({})),
        menu: () => menu,
        expanded: () => expanded,
    };
}

for (const [device, mobile] of [
    ['desktop', false],
    ['tablet', false],
    ['phone', true],
]) {
    test(`${device} sidebar groups open and close on activation`, () => {
        const ui = sidebar(mobile);
        ui.group().props.onOpenChange(true);
        assert.equal(ui.group().props.open, true);
        ui.group().props.onOpenChange(false);
        assert.equal(ui.group().props.open, false);
    });
}

test('tapping a collapsed desktop or tablet group exposes its hidden child links', () => {
    const ui = sidebar(false, 'collapsed');
    ui.group().props.onOpenChange(true);
    assert.equal(ui.expanded(), true);
    assert.equal(ui.group().props.open, true);
});
