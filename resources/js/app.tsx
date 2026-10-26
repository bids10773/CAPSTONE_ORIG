import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { ComponentType } from 'react';
import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import '../css/app.css';
import {
    LogoutModalProvider,
    useLogoutModal,
} from './contexts/logout-modal-context';
import { initializeTheme, useAppearance } from './hooks/use-appearance';
import { initializeClinicalDraftSession } from './lib/clinical-draft-storage';
import type { Auth } from './types';

const LogoutModal = lazy(() => import('./components/logout-modal'));

function LazyLogoutModal() {
    const { isOpen } = useLogoutModal();

    if (!isOpen) return null;

    return (
        <Suspense fallback={null}>
            <LogoutModal />
        </Suspense>
    );
}

// Keeping the glob options explicit makes Vite rebuild the Inertia page map
// whenever a new page module is added during development.
type InertiaPageModule = { default: ComponentType<never> };

const pages: Record<string, () => Promise<InertiaPageModule>> = {
    ...import.meta.glob<InertiaPageModule>('./pages/**/*.tsx', {
        eager: false,
    }),
    './pages/receptionist/onsite-events/attendance.tsx': () =>
        import('./pages/receptionist/onsite-events/attendance'),
    './pages/staff/onsite-events/show.tsx': () =>
        import('./pages/staff/onsite-events/show'),
    './pages/staff/patient-records/index.tsx': () =>
        import('./pages/staff/patient-records/index'),
    './pages/staff/patient-records/show.tsx': () =>
        import('./pages/staff/patient-records/show'),
    './pages/admin/staff/edit.tsx': () => import('./pages/admin/staff/edit'),
    './pages/admin/patient-visits/index.tsx': () =>
        import('./pages/admin/patient-visits/index'),
    './pages/company/bulk-appointments/index.tsx': () =>
        import('./pages/company/bulk-appointments/index'),
    './pages/medical-documents/index.tsx': () =>
        import('./pages/medical-documents/index'),
    './pages/medical-documents/patient.tsx': () =>
        import('./pages/medical-documents/patient'),
    './pages/receptionist/vital-signs.tsx': () =>
        import('./pages/receptionist/vital-signs'),
    './pages/radtech/xray-report-form.tsx': () =>
        import('./pages/radtech/xray-report-form'),
};

function ThemeAwareToaster() {
    const { resolvedAppearance } = useAppearance();

    return (
        <Toaster
            position="top-right"
            richColors
            theme={resolvedAppearance}
            toastOptions={{
                classNames: {
                    toast: 'border-border bg-popover text-popover-foreground',
                    description: 'text-muted-foreground',
                    actionButton:
                        'bg-primary text-primary-foreground hover:bg-primary/90',
                    cancelButton:
                        'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                },
            }}
        />
    );
}

createInertiaApp({
    // Template: "Page Title - LMIC" or just "LMIC" if no title is set
    title: (title) => `${title} - LMIC`,
    resolve: (name) => {
        const normalizedName = name
            .replaceAll('\\', '/')
            .replace(/\/?\.tsx$/, '')
            .replace(/\/+$/, '');

        return resolvePageComponent(`./pages/${normalizedName}.tsx`, pages);
    },
    setup({ el, App, props }) {
        const auth = props.initialPage.props.auth as Auth | undefined;
        initializeClinicalDraftSession(auth?.user?.id ?? null);
        const root = createRoot(el);
        root.render(
            <LogoutModalProvider>
                <App {...props} />
                <LazyLogoutModal />
                <ThemeAwareToaster />
            </LogoutModalProvider>,
        );
    },
});

initializeTheme();
