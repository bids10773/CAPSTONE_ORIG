import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function CancelAppointmentDialog({
    appointment,
    onClose,
    onCancelled,
}: {
    appointment: { id: number; reference_code: string };
    onClose: () => void;
    onCancelled: () => void;
}) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);

    return (
        <Dialog open onOpenChange={(open) => !open && !processing && onClose()}>
            <DialogContent className="max-w-lg rounded-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Cancel appointment {appointment.reference_code}
                    </DialogTitle>
                    <DialogDescription>
                        Enter a reason for cancelling. It will be saved with the
                        appointment and shared with the requester.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (processing) return;
                        if (!reason.trim()) {
                            setError('Enter a cancellation reason.');
                            return;
                        }
                        setError('');
                        setProcessing(true);
                        router.patch(
                            `/admin/appointments/${appointment.id}/status`,
                            {
                                status: 'cancelled',
                                cancellation_reason: reason.trim(),
                            },
                            {
                                preserveScroll: true,
                                onSuccess: onCancelled,
                                onError: (errors) =>
                                    setError(
                                        String(
                                            errors.cancellation_reason ??
                                                Object.values(errors)[0] ??
                                                'Unable to cancel this appointment.',
                                        ),
                                    ),
                                onFinish: () => setProcessing(false),
                            },
                        );
                    }}
                >
                    <label
                        htmlFor="admin-cancellation-reason"
                        className="block text-sm font-semibold"
                    >
                        Cancellation reason
                    </label>
                    <textarea
                        id="admin-cancellation-reason"
                        value={reason}
                        onChange={(event) => {
                            setReason(event.target.value);
                            setError('');
                        }}
                        required
                        maxLength={500}
                        rows={4}
                        disabled={processing}
                        aria-invalid={Boolean(error)}
                        aria-describedby={
                            error ? 'admin-cancellation-error' : undefined
                        }
                        placeholder="Explain why this appointment is being cancelled"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    />
                    {error && (
                        <p
                            id="admin-cancellation-error"
                            role="alert"
                            className="text-sm text-red-600"
                        >
                            {error}
                        </p>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
                            onClick={onClose}
                        >
                            Keep appointment
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={processing || !reason.trim()}
                        >
                            {processing ? 'Cancelling…' : 'Cancel appointment'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
