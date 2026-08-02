import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
} from 'react';
import type { ReactNode } from 'react';

interface LogoutModalContextValue {
    isOpen: boolean;
    openModal: (trigger?: HTMLElement | null) => void;
    closeModal: () => void;
}

const LogoutModalContext = createContext<LogoutModalContextValue | undefined>(
    undefined,
);

export function LogoutModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLElement | null>(null);

    const openModal = useCallback((trigger?: HTMLElement | null) => {
        triggerRef.current = trigger ?? null;
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);

        window.requestAnimationFrame(() => {
            const originalTrigger = triggerRef.current;
            const accountMenuTrigger = document.querySelector<HTMLElement>(
                '[data-test="navbar-user-menu-button"]',
            );
            (originalTrigger?.isConnected
                ? originalTrigger
                : accountMenuTrigger
            )?.focus();
            triggerRef.current = null;
        });
    }, []);

    return (
        <LogoutModalContext.Provider value={{ isOpen, openModal, closeModal }}>
            {children}
        </LogoutModalContext.Provider>
    );
}

export function useLogoutModal(): LogoutModalContextValue {
    const context = useContext(LogoutModalContext);
    if (!context) {
        throw new Error(
            'useLogoutModal must be used within a LogoutModalProvider',
        );
    }
    return context;
}
