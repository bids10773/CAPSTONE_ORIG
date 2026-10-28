import { router } from '@inertiajs/react';
import { CircleHelp } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { DialogRequest } from '@/lib/dialog-controller';
import { dialogs } from '@/lib/dialogs';

type FocusOrigin = { element: HTMLElement; isCurrent: () => boolean };

export function ConfirmationDialogs() {
    const openerRef = useRef<FocusOrigin | null>(null);
    const request = useSyncExternalStore(
        dialogs.subscribe,
        dialogs.getSnapshot,
        () => null,
    );
    useEffect(() => {
        const stopStart = router.on('start', () => dialogs.reset());
        const stopNavigate = router.on('navigate', () => dialogs.reset());
        return () => {
            stopStart();
            stopNavigate();
            dialogs.reset();
        };
    }, []);
    return request ? (
        <ConfirmationDialog
            key={request.id}
            request={request}
            openerRef={openerRef}
        />
    ) : null;
}

function ConfirmationDialog({
    request,
    openerRef,
}: {
    request: DialogRequest;
    openerRef: RefObject<FocusOrigin | null>;
}) {
    const [value, setValue] = useState(request.defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const isPrompt = request.kind === 'prompt';
    const dismiss = () => dialogs.settle(request.id, isPrompt ? null : false);

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) dismiss();
            }}
        >
            <DialogContent
                className="sm:max-w-md"
                overlayClassName="z-[120]"
                style={{ zIndex: 121 }}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    if (!openerRef.current) {
                        const element =
                            document.activeElement as HTMLElement | null;
                        if (element && typeof element.focus === 'function') {
                            openerRef.current = {
                                element,
                                isCurrent: dialogs.session(),
                            };
                        }
                    }
                    if (isPrompt) {
                        inputRef.current?.focus();
                        inputRef.current?.select();
                    } else cancelRef.current?.focus();
                }}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    // A follow-up prompt keeps the same opener; navigation invalidates it.
                    window.setTimeout(() => {
                        if (dialogs.getSnapshot()) return;
                        const origin = openerRef.current;
                        openerRef.current = null;
                        if (origin?.isCurrent() && origin.element.isConnected)
                            origin.element.focus();
                    }, 0);
                }}
            >
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        dialogs.settle(request.id, isPrompt ? value : true);
                    }}
                    className="space-y-5"
                >
                    <DialogHeader>
                        <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-moss-100 text-moss-700 dark:bg-moss-950 dark:text-moss-200">
                            <CircleHelp className="size-5" aria-hidden="true" />
                        </span>
                        <DialogTitle>
                            {isPrompt
                                ? 'Additional information'
                                : 'Confirm action'}
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-6 whitespace-pre-wrap">
                            {request.message}
                        </DialogDescription>
                    </DialogHeader>
                    {isPrompt && (
                        <Input
                            ref={inputRef}
                            aria-label={request.message}
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                        />
                    )}
                    <DialogFooter>
                        <Button
                            ref={cancelRef}
                            type="button"
                            variant="outline"
                            onClick={dismiss}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">Confirm</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
