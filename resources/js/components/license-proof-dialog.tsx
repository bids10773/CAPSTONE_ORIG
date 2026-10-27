import { Download, ExternalLink, Eye } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export function LicenseProofDialog({
    staffId,
    name,
    licenseNumber,
    children,
}: {
    staffId: number;
    name: string;
    licenseNumber: string | null;
    children: ReactNode;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" className="gap-2">
                    <Eye className="size-4" /> View proof
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-5xl">
                <DialogHeader className="pr-8 text-left">
                    <DialogTitle>Review PRC proof</DialogTitle>
                    <DialogDescription>
                        {name} · License {licenseNumber || 'not recorded'}.
                        Check both sides before verifying. Select an image to
                        open it at full size.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 md:grid-cols-2">
                    {(['front', 'back'] as const).map((side) => (
                        <LicenseProofImage
                            key={`${staffId}-${side}`}
                            staffId={staffId}
                            side={side}
                        />
                    ))}
                </div>
                <div className="border-t border-border pt-4">{children}</div>
            </DialogContent>
        </Dialog>
    );
}

function LicenseProofImage({
    staffId,
    side,
}: {
    staffId: number;
    side: 'front' | 'back';
}) {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
        'loading',
    );
    const url = `/admin/staff/${staffId}/license-document/${side}`;
    const previewUrl = `${url}?preview=1`;
    const label = side === 'front' ? 'ID front' : 'ID back';

    return (
        <section className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{label}</h3>
                <Button variant="outline" size="sm" asChild>
                    <a href={url}>
                        <Download className="size-4" /> Download {side}
                    </a>
                </Button>
            </div>
            <div className="relative flex min-h-52 items-center justify-center rounded-xl border border-border bg-muted/30 p-3">
                {status === 'loading' && (
                    <p
                        role="status"
                        className="absolute text-sm text-muted-foreground"
                    >
                        Loading {side} image…
                    </p>
                )}
                {status === 'error' ? (
                    <div role="alert" className="space-y-3 text-center">
                        <p className="text-sm text-muted-foreground">
                            Unable to load the {side} image. Try again or use
                            Download {side} to inspect the file.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setStatus('loading')}
                        >
                            Retry {side} preview
                        </Button>
                    </div>
                ) : (
                    <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        aria-label={`Open PRC ID ${side} at full size in a new tab`}
                    >
                        <img
                            src={previewUrl}
                            alt={`Submitted PRC ID ${side}`}
                            onLoad={() => setStatus('loaded')}
                            onError={() => setStatus('error')}
                            className={`mx-auto max-h-[55vh] w-full object-contain ${status === 'loading' ? 'opacity-0' : ''}`}
                        />
                    </a>
                )}
            </div>
            {status === 'loaded' && (
                <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded text-xs text-muted-foreground underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                    Open {side} at full size <ExternalLink className="size-3" />
                    <span className="sr-only">(opens in a new tab)</span>
                </a>
            )}
        </section>
    );
}
