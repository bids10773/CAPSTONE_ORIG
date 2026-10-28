export type DialogRequest = {
    id: number;
    kind: 'confirm' | 'prompt';
    message: string;
    defaultValue: string;
};

export function createDialogController() {
    let current: DialogRequest | null = null;
    let resolve: ((value: boolean | string | null) => void) | null = null;
    let nextId = 0;
    let generation = 0;
    const listeners = new Set<() => void>();
    const emit = () => listeners.forEach((listener) => listener());

    function request(
        kind: DialogRequest['kind'],
        message: string,
        defaultValue = '',
    ) {
        // A second click must not reuse an affirmative result and submit twice.
        if (current) return Promise.resolve(kind === 'confirm' ? false : null);
        return new Promise<boolean | string | null>((complete) => {
            resolve = complete;
            current = { id: ++nextId, kind, message, defaultValue };
            emit();
        });
    }

    function settle(id: number, value: boolean | string | null) {
        if (!current || current.id !== id) return;
        const complete = resolve;
        const result =
            current.kind === 'confirm'
                ? value === true
                : typeof value === 'string'
                  ? value
                  : null;
        current = null;
        resolve = null;
        emit();
        complete?.(result);
    }

    function cancel() {
        if (current)
            settle(current.id, current.kind === 'confirm' ? false : null);
    }

    return {
        getSnapshot: () => current,
        subscribe: (listener: () => void) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        confirm: async (message: string): Promise<boolean> =>
            (await request('confirm', message)) === true,
        prompt: async (
            message: string,
            defaultValue = '',
        ): Promise<string | null> => {
            const value = await request('prompt', message, defaultValue);
            return typeof value === 'string' ? value : null;
        },
        settle,
        cancel,
        reset: () => {
            generation++;
            cancel();
        },
        session: () => {
            const startedAt = generation;
            return () => startedAt === generation;
        },
    };
}
