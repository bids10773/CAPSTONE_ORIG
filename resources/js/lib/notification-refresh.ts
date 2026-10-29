/** Coalesce bursts while preserving events that arrive during an older fetch. */
export function createNotificationRefresh<T>(
    fetchValue: (signal: AbortSignal) => Promise<T>,
    publish: (value: T) => void,
) {
    let pending: Promise<void> | null = null;
    let dirty = false;
    let disposed = false;
    let controller: AbortController | null = null;

    const run = (): Promise<void> => {
        if (disposed) return Promise.resolve();
        dirty = true;
        if (pending) return pending;

        pending = (async () => {
            while (dirty && !disposed) {
                dirty = false;
                controller = new AbortController();
                const timeout = setTimeout(() => controller?.abort(), 10_000);
                try {
                    const value = await fetchValue(controller.signal);
                    if (!disposed) publish(value);
                } catch {
                    // Focus, reconnect and polling will retry transport failures.
                } finally {
                    clearTimeout(timeout);
                }
            }
        })().finally(() => {
            pending = null;
        });
        return pending;
    };

    return {
        run,
        activate: () => {
            disposed = false;
        },
        dispose: () => {
            disposed = true;
            controller?.abort();
        },
    };
}
