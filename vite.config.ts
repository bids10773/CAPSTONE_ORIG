import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;
                    if (
                        id.includes('/clsx/') ||
                        id.includes('/tailwind-merge/')
                    ) {
                        return 'vendor-utils';
                    }
                    if (id.includes('recharts') || id.includes('d3-')) {
                        return 'vendor-charts';
                    }
                    if (id.includes('framer-motion')) return 'vendor-motion';
                    if (id.includes('/@inertiajs/') || id.includes('/axios/')) {
                        return 'vendor-inertia';
                    }
                    if (
                        id.includes('/@radix-ui/') ||
                        id.includes('/@floating-ui/') ||
                        id.includes('/@headlessui/')
                    ) {
                        return 'vendor-ui';
                    }
                    if (
                        id.includes('/@laravel/echo-react/') ||
                        id.includes('/laravel-echo/') ||
                        id.includes('/pusher-js/')
                    ) {
                        return 'vendor-realtime';
                    }
                    if (
                        id.includes('/react/') ||
                        id.includes('/react-dom/') ||
                        id.includes('/scheduler/') ||
                        id.includes('/use-sync-external-store/')
                    ) {
                        return 'vendor-react';
                    }
                    if (id.includes('/lucide-react/')) return 'vendor-icons';
                },
            },
        },
    },
});
