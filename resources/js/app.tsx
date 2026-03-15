import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';
import { LogoutModalProvider } from './contexts/logout-modal-context';
import LogoutModal from './components/logout-modal';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    // This template handles how titles look across the whole site
    title: (title) => title ? `${title} - LMIC` : 'LMIC',
    resolve: (name) => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <StrictMode>
                <LogoutModalProvider>
                    <App {...props} />
                    <LogoutModal />
                </LogoutModalProvider>
            </StrictMode>
        );
    },
});
// This will set light / dark mode on load...
initializeTheme();
