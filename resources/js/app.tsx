import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import '../css/app.css';
import LogoutModal from './components/logout-modal';
import { LogoutModalProvider } from './contexts/logout-modal-context';
import { initializeTheme } from './hooks/use-appearance';
configureEcho({
    broadcaster: 'reverb',
});

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
    './pages/radtech/xray-report-form.tsx': () =>
        import('./pages/radtech/xray-report-form'),
};

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
        const root = createRoot(el);
        const pageProps = props.initialPage.props as {
            auth?: { user?: { id?: number } };
        };

        root.render(
            <LogoutModalProvider>
                <App {...props} />
                <LogoutModal userId={pageProps.auth?.user?.id} />
                <Toaster position="top-right" richColors />
            </LogoutModalProvider>,
        );
    },
});

initializeTheme();
