import { allHistoryFields, bodyParts } from '@/lib/clinical-exam-fields';

export function ClinicalHistoryFindings({
    history,
    physical,
}: {
    history?: Record<string, unknown> | null;
    physical?: Record<string, unknown> | null;
}) {
    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
                <h2 className="text-xl font-bold text-foreground">
                    Medical history
                </h2>
                <dl className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
                    {allHistoryFields.map(([label, field]) => (
                        <div key={field}>
                            <dt className="font-semibold text-slate-700 dark:text-slate-300">
                                {label}
                            </dt>
                            <dd className="mt-2 max-w-prose text-base leading-7 break-words whitespace-pre-wrap text-foreground">
                                {String(history?.[field] || 'Not recorded')}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
                <h2 className="text-xl font-bold text-foreground">
                    Physical findings
                </h2>
                {!physical ? (
                    <p className="mt-4 text-muted-foreground">
                        Physical examination has not been recorded.
                    </p>
                ) : (
                    <>
                        <dl className="mt-5 grid gap-4 md:grid-cols-2">
                            {bodyParts.map(({ label, field }) => (
                                <div
                                    key={field}
                                    className={
                                        physical[field]
                                            ? 'rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/20'
                                            : 'rounded-xl border border-border p-4'
                                    }
                                >
                                    <dt className="font-semibold text-foreground">
                                        {label}
                                    </dt>
                                    <dd className="mt-2 text-base leading-7 break-words whitespace-pre-wrap text-foreground">
                                        {String(
                                            physical[field] ||
                                                (physical.is_completed
                                                    ? 'Normal'
                                                    : 'Not recorded'),
                                        )}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <h3 className="mt-6 font-semibold text-foreground">
                            Doctor’s remarks
                        </h3>
                        <p className="mt-2 max-w-prose text-base leading-7 break-words whitespace-pre-wrap text-foreground">
                            {String(physical.remarks || 'Not recorded')}
                        </p>
                    </>
                )}
            </section>
        </div>
    );
}
