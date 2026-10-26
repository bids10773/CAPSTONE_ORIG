import { router } from '@inertiajs/react';
import type { Auth } from '@/types';

const DRAFT_PREFIX = 'clinical-form-draft:';
const OWNER_KEY = 'clinical-form-draft-owner:v2';

export function clinicalDraftStorageKey(userId: number | null, key: string) {
    return `${DRAFT_PREFIX}v2:${userId ?? 'guest'}:${key}`;
}

export function clearClinicalDrafts() {
    try {
        for (let index = sessionStorage.length - 1; index >= 0; index--) {
            const key = sessionStorage.key(index);
            if (key?.startsWith(DRAFT_PREFIX)) sessionStorage.removeItem(key);
        }
        sessionStorage.removeItem(OWNER_KEY);
    } catch {
        // Browser storage restrictions must not prevent logout or navigation.
    }
}

export function synchronizeClinicalDraftOwner(userId: number | null) {
    try {
        if (
            userId === null ||
            sessionStorage.getItem(OWNER_KEY) !== String(userId)
        ) {
            clearClinicalDrafts();
            if (userId !== null)
                sessionStorage.setItem(OWNER_KEY, String(userId));
        }
    } catch {
        // Draft persistence is optional when storage is unavailable.
    }
}

export function ownsClinicalDrafts(userId: number | null) {
    try {
        return (
            userId !== null &&
            sessionStorage.getItem(OWNER_KEY) === String(userId)
        );
    } catch {
        return false;
    }
}

export function initializeClinicalDraftSession(userId: number | null) {
    synchronizeClinicalDraftOwner(userId);

    return router.on('navigate', (event) => {
        const auth = event.detail.page.props.auth as Auth | undefined;
        synchronizeClinicalDraftOwner(auth?.user?.id ?? null);
    });
}
