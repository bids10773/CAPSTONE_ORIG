import { CheckCircle2, Monitor, Moon, Sun } from 'lucide-react';
import type { ComponentType } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import type { Appearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

const choices: Array<{
    value: Appearance;
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
}> = [
    {
        value: 'light',
        title: 'Light',
        description: 'Use the bright clinic workspace.',
        icon: Sun,
    },
    {
        value: 'dark',
        title: 'Dark',
        description: 'Reduce glare in low-light environments.',
        icon: Moon,
    },
    {
        value: 'system',
        title: 'System',
        description: 'Follow your device appearance automatically.',
        icon: Monitor,
    },
];

export default function AppearanceTabs() {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
            {choices.map((choice) => {
                const Icon = choice.icon;
                const active = appearance === choice.value;

                return (
                    <button
                        key={choice.value}
                        type="button"
                        onClick={() => updateAppearance(choice.value)}
                        className={cn(
                            'relative rounded-2xl border p-5 text-left transition focus-visible:ring-4 focus-visible:ring-moss-500/20 focus-visible:outline-none',
                            active
                                ? 'border-moss-500 bg-moss-50 ring-1 ring-moss-500/20'
                                : 'border-border bg-card hover:border-moss-300 hover:bg-moss-50/60',
                        )}
                        aria-pressed={active}
                    >
                        <span className="flex size-11 items-center justify-center rounded-xl bg-background text-moss-700 shadow-sm">
                            <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <span className="mt-4 flex items-center gap-2">
                            <strong className="text-sm text-foreground">
                                {choice.title}
                            </strong>
                            {active && (
                                <CheckCircle2
                                    className="size-4 text-moss-600"
                                    aria-label="Active"
                                />
                            )}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {choice.description}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
