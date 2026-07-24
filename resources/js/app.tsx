import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import '../css/app.css';
import LogoutModal from './components/logout-modal';
import { LogoutModalProvider } from './contexts/logout-modal-context';
import { initializeTheme } from './hooks/use-appearance';

createInertiaApp({
    // Template: "Page Title - LMIC" or just "LMIC" if no title is set
     title: (title) => `${title} - LMIC`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
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
                </LogoutModalProvider>
        );
    },
});

initializeTheme();
