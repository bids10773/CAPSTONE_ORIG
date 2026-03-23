import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';
import { LogoutModalProvider } from './contexts/logout-modal-context';
import LogoutModal from './components/logout-modal';

// Pulls from VITE_APP_NAME in .env or defaults to 'LMIC'
const appName = import.meta.env.VITE_APP_NAME || 'LMIC';

createInertiaApp({
    // Template: "Page Title - LMIC" or just "LMIC" if no title is set
     title: (title) => `${title} - LMIC`,
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

initializeTheme();
