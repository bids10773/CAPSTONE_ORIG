import { Head } from '@inertiajs/react';
import {
    Activity,
    CalendarDays,
    CalendarRange,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    ChartCard,
    ChartEmptyState,
    ChartTooltip,
    chartAxisProps,
    chartGridProps,
    chartLegendProps,
} from '@/components/analytics/chart-ui';
import AppLayout from '@/layouts/app-layout';

type Frequency = 'daily' | 'monthly';
type HistoryPoint = { period: string; count: number };
type ForecastPoint = {
    period: string;
    estimated_patients: number;
    lower_bound: number;
    upper_bound: number;
};
type Trend = {
    direction: 'increasing' | 'decreasing' | 'stable';
    change_percentage: number;
    current_average: number;
    previous_average: number;
};
type Forecast = {
    available: boolean;
    reason?: string;
    required_observations: number;
    available_observations: number;
    data: ForecastPoint[];
    metrics: null | {
        rmse: number;
        trend_per_period: number;
        projected_change_percentage: number;
        direction: string;
    };
    parameters: null | {
        method: string;
        season_length: number;
        horizon: number;
    };
};
type PatientVolumeData = {
    meta: {
        source: string;
        definition: string;
        method: string;
        disclaimer: string;
        generated_at: string;
    };
    filters: {
        start_date: string;
        end_date: string;
        daily_horizon: number;
        monthly_horizon: number;
    };
    summary: {
        total_patients_today: number;
        total_patients_this_month: number;
        selected_period_visits: number;
        selected_period_unique_patients: number;
    };
    daily: { history: HistoryPoint[]; trend: Trend; forecast: Forecast };
    monthly: { history: HistoryPoint[]; trend: Trend; forecast: Forecast };
    planning: { title: string; value: string; detail: string }[];
};

const formatPeriod = (period: string, frequency: Frequency) => {
    const value = frequency === 'monthly' ? `${period}-01` : period;
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: frequency === 'daily' ? 'numeric' : undefined,
        year: frequency === 'monthly' ? 'numeric' : undefined,
        timeZone: 'UTC',
    }).format(new Date(`${value}T00:00:00Z`));
};

function StatCard({
    label,
    value,
    detail,
    icon: Icon,
}: {
    label: string;
    value: number | string;
    detail: string;
    icon: typeof Activity;
}) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                        {label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                        {typeof value === 'number'
                            ? value.toLocaleString()
                            : value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {detail}
                    </p>
                </div>
                <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <Icon className="size-5" />
                </span>
            </div>
        </article>
    );
}

function TrendBadge({ trend }: { trend: Trend }) {
    const Icon = trend.direction === 'decreasing' ? TrendingDown : TrendingUp;
    const tone =
        trend.direction === 'increasing'
            ? 'bg-emerald-50 text-emerald-700'
            : trend.direction === 'decreasing'
              ? 'bg-rose-50 text-rose-700'
              : 'bg-slate-100 text-slate-600';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tone}`}
        >
            {trend.direction !== 'stable' && <Icon className="size-3.5" />}
            {trend.direction === 'stable'
                ? 'Stable'
                : `${Math.abs(trend.change_percentage)}% ${trend.direction}`}
        </span>
    );
}

function HistoryChart({
    title,
    frequency,
    history,
    trend,
}: {
    title: string;
    frequency: Frequency;
    history: HistoryPoint[];
    trend: Trend;
}) {
    const visible =
        frequency === 'daily' ? history.slice(-90) : history.slice(-36);

    return (
        <ChartCard
            title={title}
            description={`Actual attended patient visits${history.length > visible.length ? ` · latest ${visible.length} periods shown` : ''}`}
            action={<TrendBadge trend={trend} />}
        >
            {visible.length ? (
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={visible}
                            margin={{ top: 8, right: 8, left: -18, bottom: 8 }}
                        >
                            <CartesianGrid {...chartGridProps} />
                            <XAxis
                                {...chartAxisProps}
                                dataKey="period"
                                minTickGap={28}
                                tickFormatter={(value) =>
                                    formatPeriod(value, frequency)
                                }
                            />
                            <YAxis {...chartAxisProps} allowDecimals={false} />
                            <Tooltip
                                content={
                                    <ChartTooltip
                                        labelFormatter={(value) =>
                                            formatPeriod(
                                                String(value),
                                                frequency,
                                            )
                                        }
                                        unit="patients"
                                    />
                                }
                            />
                            <Bar
                                dataKey="count"
                                name="Actual patients"
                                fill="#287454"
                                radius={[5, 5, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <ChartEmptyState message="No attended patient visits were found in this date range." />
            )}
        </ChartCard>
    );
}

function ForecastChart({
    title,
    frequency,
    history,
    forecast,
}: {
    title: string;
    frequency: Frequency;
    history: HistoryPoint[];
    forecast: Forecast;
}) {
    const combined = useMemo(() => {
        const actualLimit = frequency === 'daily' ? 30 : 18;
        const firstForecastPeriod = forecast.data[0]?.period;
        const actual = history
            .filter(
                (point) =>
                    !firstForecastPeriod || point.period < firstForecastPeriod,
            )
            .slice(-actualLimit)
            .map((point) => ({
                period: point.period,
                actual: point.count,
                forecast: null as number | null,
                lower: null as number | null,
                upper: null as number | null,
            }));
        const bridge = actual.at(-1);
        if (bridge) bridge.forecast = bridge.actual;

        return [
            ...actual,
            ...forecast.data.map((point) => ({
                period: point.period,
                actual: null,
                forecast: point.estimated_patients,
                lower: point.lower_bound,
                upper: point.upper_bound,
            })),
        ];
    }, [forecast.data, frequency, history]);

    return (
        <ChartCard
            title={title}
            description="Actual patient counts compared with Holt-Winters estimates"
            action={
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Estimate
                </span>
            }
            footer={
                forecast.available
                    ? `Approximate 95% forecast range · RMSE ${forecast.metrics?.rmse ?? 0}`
                    : undefined
            }
        >
            {forecast.available ? (
                <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={combined}
                            margin={{ top: 8, right: 14, left: -18, bottom: 8 }}
                        >
                            <CartesianGrid {...chartGridProps} />
                            <XAxis
                                {...chartAxisProps}
                                dataKey="period"
                                minTickGap={24}
                                tickFormatter={(value) =>
                                    formatPeriod(value, frequency)
                                }
                            />
                            <YAxis {...chartAxisProps} allowDecimals={false} />
                            <Tooltip
                                content={
                                    <ChartTooltip
                                        labelFormatter={(value) =>
                                            formatPeriod(
                                                String(value),
                                                frequency,
                                            )
                                        }
                                        unit="patients"
                                    />
                                }
                            />
                            <Legend {...chartLegendProps} />
                            <Line
                                type="monotone"
                                dataKey="actual"
                                name="Actual"
                                stroke="#287454"
                                strokeWidth={3}
                                dot={false}
                                connectNulls={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="forecast"
                                name="Forecast estimate"
                                stroke="#2563eb"
                                strokeWidth={3}
                                strokeDasharray="7 5"
                                dot={false}
                                connectNulls={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="lower"
                                name="Lower estimate"
                                stroke="#93c5fd"
                                strokeWidth={1.5}
                                strokeDasharray="3 4"
                                dot={false}
                                connectNulls={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="upper"
                                name="Upper estimate"
                                stroke="#93c5fd"
                                strokeWidth={1.5}
                                strokeDasharray="3 4"
                                dot={false}
                                connectNulls={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <ChartEmptyState
                    message={`${forecast.reason} Available: ${forecast.available_observations}; required: ${forecast.required_observations}.`}
                />
            )}
        </ChartCard>
    );
}

export default function PatientVisitDashboard({
    initialData,
}: {
    initialData: PatientVolumeData;
}) {
    const [data, setData] = useState(initialData);
    const [frequency, setFrequency] = useState<Frequency>('daily');
    const [filters, setFilters] = useState(initialData.filters);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const selected = data[frequency];

    const applyFilters = async () => {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({
            start_date: filters.start_date,
            end_date: filters.end_date,
            daily_horizon: String(filters.daily_horizon),
            monthly_horizon: String(filters.monthly_horizon),
        });

        try {
            const response = await fetch(
                `/analytics/api/patient-volume?${params}`,
                {
                    headers: { Accept: 'application/json' },
                },
            );
            if (!response.ok) {
                const body = await response.json();
                throw new Error(
                    body.message || 'Unable to load patient volume analytics.',
                );
            }
            setData(await response.json());
        } catch (reason) {
            setError(
                reason instanceof Error
                    ? reason.message
                    : 'Unable to load patient volume analytics.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="Patient Volume Analytics" />
            <main className="min-h-screen bg-slate-50/70 px-4 py-6 sm:px-6 lg:px-8 dark:bg-slate-950">
                <div className="mx-auto w-full max-w-[1800px] space-y-6">
                    <header className="rounded-3xl bg-gradient-to-br from-[#173f31] to-[#2f7256] p-6 text-white shadow-lg sm:p-8">
                        <p className="text-xs font-bold tracking-[0.2em] text-emerald-100 uppercase">
                            Operations analytics
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            Patient Volume Summaries & Forecasting
                        </h1>
                        <p className="mt-3 max-w-4xl text-sm leading-6 text-emerald-50 sm:text-base">
                            Monitor actual attended visits and use Holt-Winters
                            seasonal estimates to support staffing, scheduling,
                            and resource planning.
                        </p>
                    </header>

                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                Start date
                                <input
                                    type="date"
                                    value={filters.start_date}
                                    max={filters.end_date}
                                    onChange={(event) =>
                                        setFilters({
                                            ...filters,
                                            start_date: event.target.value,
                                        })
                                    }
                                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                />
                            </label>
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                End date
                                <input
                                    type="date"
                                    value={filters.end_date}
                                    min={filters.start_date}
                                    max={new Date().toISOString().slice(0, 10)}
                                    onChange={(event) =>
                                        setFilters({
                                            ...filters,
                                            end_date: event.target.value,
                                        })
                                    }
                                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                />
                            </label>
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                Daily forecast
                                <select
                                    value={filters.daily_horizon}
                                    onChange={(event) =>
                                        setFilters({
                                            ...filters,
                                            daily_horizon: Number(
                                                event.target.value,
                                            ),
                                        })
                                    }
                                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                >
                                    {[7, 14, 30, 60].map((value) => (
                                        <option key={value} value={value}>
                                            {value} days
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                Monthly forecast
                                <select
                                    value={filters.monthly_horizon}
                                    onChange={(event) =>
                                        setFilters({
                                            ...filters,
                                            monthly_horizon: Number(
                                                event.target.value,
                                            ),
                                        })
                                    }
                                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                >
                                    {[3, 6, 12].map((value) => (
                                        <option key={value} value={value}>
                                            {value} months
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="flex items-end md:col-span-2">
                                <button
                                    type="button"
                                    onClick={applyFilters}
                                    disabled={loading}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#287454] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f6045] disabled:opacity-60"
                                >
                                    <RefreshCw
                                        className={`size-4 ${loading ? 'animate-spin' : ''}`}
                                    />
                                    {loading ? 'Updating…' : 'Apply filters'}
                                </button>
                            </div>
                        </div>
                        {error && (
                            <p className="mt-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </p>
                        )}
                    </section>

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Total patients today"
                            value={data.summary.total_patients_today}
                            detail="Attended visits today"
                            icon={CalendarDays}
                        />
                        <StatCard
                            label="Patients this month"
                            value={data.summary.total_patients_this_month}
                            detail="Attended visits this calendar month"
                            icon={CalendarRange}
                        />
                        <StatCard
                            label="Selected period visits"
                            value={data.summary.selected_period_visits}
                            detail="One count per attended appointment"
                            icon={Activity}
                        />
                        <StatCard
                            label="Unique patients"
                            value={data.summary.selected_period_unique_patients}
                            detail="Within the selected date range"
                            icon={Users}
                        />
                    </section>

                    <section className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                                Patient volume trends
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Switch between daily and monthly summaries.
                            </p>
                        </div>
                        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            {(['daily', 'monthly'] as Frequency[]).map(
                                (value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setFrequency(value)}
                                        className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize ${frequency === value ? 'bg-[#287454] text-white' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                    >
                                        {value}
                                    </button>
                                ),
                            )}
                        </div>
                    </section>

                    <HistoryChart
                        title={`${frequency === 'daily' ? 'Daily' : 'Monthly'} Patient Volume Chart`}
                        frequency={frequency}
                        history={selected.history}
                        trend={selected.trend}
                    />

                    <section className="grid gap-6 xl:grid-cols-2">
                        <HistoryChart
                            title="Daily Patient Volume"
                            frequency="daily"
                            history={data.daily.history}
                            trend={data.daily.trend}
                        />
                        <HistoryChart
                            title="Monthly Patient Volume"
                            frequency="monthly"
                            history={data.monthly.history}
                            trend={data.monthly.trend}
                        />
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                            Actual vs. forecasted patient volume
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Forecast lines are planning estimates and include an
                            approximate uncertainty range.
                        </p>
                    </section>
                    <section className="grid gap-6 xl:grid-cols-2">
                        <ForecastChart
                            title="Daily Patient Volume Forecast"
                            frequency="daily"
                            history={data.daily.history}
                            forecast={data.daily.forecast}
                        />
                        <ForecastChart
                            title="Monthly Patient Volume Forecast"
                            frequency="monthly"
                            history={data.monthly.history}
                            forecast={data.monthly.forecast}
                        />
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
                        <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                            Clinic planning support
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Use these estimates as one input to operational
                            decisions.
                        </p>
                        <div className="mt-5 grid gap-4 lg:grid-cols-3">
                            {data.planning.map((item) => (
                                <article
                                    key={item.title}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                                >
                                    <p className="text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                        {item.title}
                                    </p>
                                    <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                                        {item.value}
                                    </p>
                                    <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
                                        {item.detail}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <aside className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
                        <strong>{data.meta.source}.</strong>{' '}
                        {data.meta.definition} {data.meta.disclaimer}
                    </aside>
                </div>
            </main>
        </>
    );
}

PatientVisitDashboard.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);
