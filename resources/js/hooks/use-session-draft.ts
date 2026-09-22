import { useCallback, useEffect, useRef } from 'react';

const DRAFT_LIFETIME_MS = 24 * 60 * 60 * 1000;

type StoredDraft<T> = {
    version: 1;
    savedAt: number;
    data: T;
};

export function useSessionDraft<T extends object>(
    key: string,
    data: T,
    isDirty: boolean,
    restore: (draft: T) => void,
    enabled = true,
) {
    const storageKey = `clinical-form-draft:v1:${key}`;
    const restoreRef = useRef(restore);
    const clearedRef = useRef(false);
    const loadedKeyRef = useRef<string | null>(null);
    const skipNextSaveRef = useRef(true);

    useEffect(() => {
        restoreRef.current = restore;
    }, [restore]);

    useEffect(() => {
        clearedRef.current = false;
        loadedKeyRef.current = storageKey;
        skipNextSaveRef.current = true;

        try {
            if (!enabled) {
                sessionStorage.removeItem(storageKey);
            } else {
                const raw = sessionStorage.getItem(storageKey);
                if (raw) {
                    const stored = JSON.parse(raw) as StoredDraft<T>;
                    if (
                        stored &&
                        stored.version === 1 &&
                        typeof stored.savedAt === 'number' &&
                        Date.now() - stored.savedAt < DRAFT_LIFETIME_MS &&
                        stored.data &&
                        typeof stored.data === 'object'
                    ) {
                        restoreRef.current(stored.data);
                    } else {
                        sessionStorage.removeItem(storageKey);
                    }
                }
            }
        } catch {
            // Storage may be unavailable; the form remains usable without a draft.
        }
    }, [enabled, storageKey]);

    useEffect(() => {
        if (
            loadedKeyRef.current !== storageKey ||
            !enabled ||
            clearedRef.current
        )
            return;
        if (skipNextSaveRef.current) {
            // Wait for restored values to reach the form before writing a draft.
            skipNextSaveRef.current = false;
            return;
        }

        try {
            if (isDirty) {
                sessionStorage.setItem(
                    storageKey,
                    JSON.stringify({ version: 1, savedAt: Date.now(), data }),
                );
            } else {
                sessionStorage.removeItem(storageKey);
            }
        } catch {
            // A storage quota or browser setting must not block data entry.
        }
    }, [data, enabled, isDirty, storageKey]);

    const clearDraft = useCallback(() => {
        clearedRef.current = true;
        try {
            sessionStorage.removeItem(storageKey);
        } catch {
            // A successful server save already has the authoritative data.
        }
    }, [storageKey]);

    return { clearDraft };
}
