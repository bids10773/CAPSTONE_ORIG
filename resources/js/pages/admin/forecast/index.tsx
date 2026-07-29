import { Head } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    CalendarRange,
    ChartNoAxesCombined,
    Info,
    Layers3,
    RefreshCw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import AppLayout from '@/layouts/app-layout';
import type { DiseaseForecast, ForecastDashboardData } from '@/types/forecast';

const COLORS = [
    '#237a57',
    '#2563eb',
    '#7c3aed',
    '#e11d48',
    '#d97706',
    '#0891b2',
];
const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];
const monthLabel = (month: string) =>
    new Intl.DateTimeFormat('en', {
        month: 'short',
        year: '2-digit',
        timeZone: 'UTC',
    }).format(new Date(`${month}-01T00:00:00Z`));
const number = (value: number) => Math.round(value).toLocaleString();

function SummaryCard({
    label,
    value,
    detail,
    icon: Icon,
}: {
    label: string;
    value: string | number | null;
    detail?: string;
    icon: typeof Activity;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        {label}
                    </p>
                    <p className="mt-2 truncate text-xl font-bold text-slate-950">
                        {value ?? '—'}
                    </p>
                    {detail && (
                        <p className="mt-1 text-xs text-slate-500">{detail}</p>
                    )}
                </div>
                <span className="rounded-xl bg-moss-50 p-2.5 text-moss-700">
                    <Icon className="size-5" />
                </span>
            </div>
        </div>
    );
}

function CombinedChart({ disease }: { disease: DiseaseForecast }) {
    const data = useMemo(() => {
        const history = disease.history.map((point) => ({
            month: point.month,
            actual: point.cases,
            fitted: point.fitted_cases,
        }));
        const last = history.at(-1);
        return [
            ...history,
            ...disease.forecast.map((point, index) => ({
                month: point.month,
                forecast: point.predicted_cases,
                lower: point.lower_bound,
                upper: point.upper_bound,
                ...(index === 0 && last ? { actual: last.actual } : {}),
            })),
        ];
    }, [disease]);

    return (
        <ResponsiveContainer width="100%" height={340}>
            <ComposedChart
                data={data}
                margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                />
                <XAxis
                    dataKey="month"
                    tickFormatter={monthLabel}
                    minTickGap={35}
                    tick={{ fontSize: 11 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                    labelFormatter={(value) => monthLabel(String(value))}
                    formatter={(value, name) => [
                        number(Number(value)),
                        String(name),
                    ]}
                />
                <Legend />
                <Area
                    dataKey="upper"
                    name="95% upper bound"
                    stroke="none"
                    fill="#bfdbfe"
                    fillOpacity={0.45}
                />
                <Area
                    dataKey="lower"
                    name="95% lower bound"
                    stroke="none"
                    fill="#fff"
                    fillOpacity={1}
                />
                <Line
                    dataKey="actual"
                    name="Historical cases"
                    stroke="#237a57"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls
                />
                <Line
                    dataKey="fitted"
                    name="Model fit"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    dot={false}
                />
                <Line
                    dataKey="forecast"
                    name="Forecast"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    strokeDasharray="7 4"
                    dot={{ r: 3 }}
                    connectNulls
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

export default function ForecastDashboard({
    initialData,
}: {
    initialData: ForecastDashboardData;
}) {
    const [data, setData] = useState(initialData);
    const [disease, setDisease] = useState(
        initialData.filters.selected_disease ?? '',
    );
    const [year, setYear] = useState(
        initialData.filters.selected_year?.toString() ?? '',
    );
    const [horizon, setHorizon] = useState(
        initialData.filters.horizon.toString(),
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const selected = data.diseases[0];

    const years = useMemo(
        () =>
            [
                ...new Set(
                    initialData.history.map((row) =>
                        Number(row.month.slice(0, 4)),
                    ),
                ),
            ]
                .filter(Boolean)
                .sort((a, b) => b - a),
        [initialData.history],
    );

    const applyFilters = async () => {
        setLoading(true);
        setError('');
        const params = new URLSearchParams();
        if (disease) params.set('disease', disease);
        if (year) params.set('year', year);
        params.set('horizon', horizon);
        try {
            const response = await fetch(`/admin/api/forecast?${params}`, {
                headers: { Accept: 'application/json' },
            });
            const body = await response.json();
            if (!response.ok)
                throw new Error(
                    body.message || 'Unable to generate the forecast.',
                );
            setData(body);
            window.history.replaceState({}, '', `/admin/forecast?${params}`);
        } catch (exception) {
            setError(
                exception instanceof Error
                    ? exception.message
                    : 'Unable to generate the forecast.',
            );
        } finally {
            setLoading(false);
        }
    };

    const comparison = useMemo(() => {
        const months =
            data.diseases[0]?.forecast.map((point) => point.month) ?? [];
        return months.map((month, index) => ({
            month,
            ...Object.fromEntries(
                data.diseases.map((item) => [
                    item.disease,
                    item.forecast[index]?.predicted_cases,
                ]),
            ),
        }));
    }, [data.diseases]);

    return (
        <>
            <Head title="Seasonal Disease Forecast" />
            <div className="min-h-screen bg-slate-50/70 p-4 md:p-6">
                <div className="mx-auto max-w-[1600px] space-y-6">
                    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                        <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-moss-100 px-3 py-1 text-xs font-bold text-moss-800">
                                    Holt-Winters · Additive
                                </span>
                                {data.meta.is_demo && (
                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                                        {data.meta.label}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                                Seasonal disease trend forecast
                            </h1>
                            <p className="mt-1 max-w-3xl text-sm text-slate-500">
                                Explore historical patterns and monthly case
                                projections using level, trend, and seasonality.
                            </p>
                        </div>
                        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 lg:max-w-md">
                            <Info className="mt-0.5 size-4 shrink-0" />
                            <span>{data.meta.disclaimer}</span>
                        </div>
                    </header>

                    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
                        <label className="text-xs font-semibold text-slate-600">
                            Disease
                            <select
                                value={disease}
                                onChange={(event) =>
                                    setDisease(event.target.value)
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                            >
                                <option value="">All diseases</option>
                                {initialData.filters.diseases.map((name) => (
                                    <option key={name}>{name}</option>
                                ))}
                            </select>
                        </label>
                        <label className="text-xs font-semibold text-slate-600">
                            Historical year
                            <select
                                value={year}
                                onChange={(event) =>
                                    setYear(event.target.value)
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                            >
                                <option value="">All years</option>
                                {years.map((value) => (
                                    <option key={value}>{value}</option>
                                ))}
                            </select>
                        </label>
                        <label className="text-xs font-semibold text-slate-600">
                            Forecast horizon
                            <select
                                value={horizon}
                                onChange={(event) =>
                                    setHorizon(event.target.value)
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                            >
                                <option value="3">Next 3 months</option>
                                <option value="6">Next 6 months</option>
                                <option value="12">Next 12 months</option>
                            </select>
                        </label>
                        <button
                            onClick={applyFilters}
                            disabled={loading}
                            className="mt-auto flex h-10 items-center justify-center gap-2 rounded-lg bg-moss-700 px-4 text-sm font-semibold text-white hover:bg-moss-800 disabled:opacity-60"
                        >
                            <RefreshCw
                                className={`size-4 ${loading ? 'animate-spin' : ''}`}
                            />
                            {loading ? 'Calculating…' : 'Apply filters'}
                        </button>
                    </section>

                    {error && (
                        <div
                            role="alert"
                            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                        >
                            <AlertTriangle className="size-5" /> {error}
                        </div>
                    )}

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <SummaryCard
                            label="Diseases tracked"
                            value={data.summary.total_diseases}
                            icon={Layers3}
                        />
                        <SummaryCard
                            label="Most common"
                            value={data.summary.most_common_disease}
                            icon={Activity}
                        />
                        <SummaryCard
                            label="Highest predicted"
                            value={data.summary.highest_predicted_disease}
                            icon={ChartNoAxesCombined}
                        />
                        <SummaryCard
                            label="Highest growth"
                            value={data.summary.highest_growth}
                            detail={`${data.summary.highest_growth_percentage > 0 ? '+' : ''}${data.summary.highest_growth_percentage}%`}
                            icon={ArrowUpRight}
                        />
                        <SummaryCard
                            label="Lowest growth"
                            value={data.summary.lowest_growth}
                            detail={`${data.summary.lowest_growth_percentage > 0 ? '+' : ''}${data.summary.lowest_growth_percentage}%`}
                            icon={ArrowDownRight}
                        />
                    </section>

                    {selected ? (
                        <>
                            <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h2 className="font-bold text-slate-950">
                                                {selected.disease}: historical
                                                and forecast
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                Shaded range represents an
                                                approximate 95% forecast
                                                interval.
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${selected.metrics.direction === 'increasing' ? 'bg-rose-50 text-rose-700' : selected.metrics.direction === 'decreasing' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}
                                        >
                                            {selected.metrics.direction} ·{' '}
                                            {selected.metrics.growth_percentage}
                                            %
                                        </span>
                                    </div>
                                    <CombinedChart disease={selected} />
                                </div>
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-moss-200 bg-moss-50 p-5">
                                        <h2 className="flex items-center gap-2 font-bold text-moss-950">
                                            <ChartNoAxesCombined className="size-5" />{' '}
                                            Forecast interpretation
                                        </h2>
                                        <p className="mt-3 text-sm leading-6 text-moss-900">
                                            {selected.explanation}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <h3 className="font-bold text-slate-950">
                                            Model diagnostics
                                        </h3>
                                        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <dt className="text-slate-500">
                                                    Level
                                                </dt>
                                                <dd className="font-bold">
                                                    {selected.metrics.level}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-slate-500">
                                                    Monthly trend
                                                </dt>
                                                <dd className="font-bold">
                                                    {selected.metrics.trend}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-slate-500">
                                                    RMSE
                                                </dt>
                                                <dd className="font-bold">
                                                    {selected.metrics.rmse}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-slate-500">
                                                    Season period
                                                </dt>
                                                <dd className="font-bold">
                                                    12 months
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <h3 className="mb-3 font-bold text-slate-950">
                                            Seasonal pattern
                                        </h3>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={150}
                                        >
                                            <LineChart
                                                data={selected.seasonal_pattern}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    vertical={false}
                                                />
                                                <XAxis
                                                    dataKey="month_index"
                                                    tickFormatter={(value) =>
                                                        MONTHS[
                                                            Number(value) - 1
                                                        ]
                                                    }
                                                    tick={{ fontSize: 10 }}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 10 }}
                                                />
                                                <Tooltip
                                                    labelFormatter={(value) =>
                                                        MONTHS[
                                                            Number(value) - 1
                                                        ]
                                                    }
                                                />
                                                <Line
                                                    dataKey="effect"
                                                    name="Seasonal effect"
                                                    stroke="#7c3aed"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </section>

                            {data.diseases.length > 1 && (
                                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                                    <h2 className="font-bold text-slate-950">
                                        Disease forecast comparison
                                    </h2>
                                    <p className="mb-4 text-xs text-slate-500">
                                        Projected monthly cases across all
                                        tracked diseases.
                                    </p>
                                    <ResponsiveContainer
                                        width="100%"
                                        height={300}
                                    >
                                        <LineChart data={comparison}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#e2e8f0"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="month"
                                                tickFormatter={monthLabel}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip
                                                labelFormatter={(value) =>
                                                    monthLabel(String(value))
                                                }
                                            />
                                            <Legend />
                                            {data.diseases.map(
                                                (item, index) => (
                                                    <Line
                                                        key={item.disease}
                                                        dataKey={item.disease}
                                                        stroke={
                                                            COLORS[
                                                                index %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                ),
                                            )}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </section>
                            )}

                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center gap-2 border-b border-slate-100 p-5">
                                    <CalendarRange className="size-5 text-moss-700" />
                                    <h2 className="font-bold text-slate-950">
                                        {selected.disease} forecast table
                                    </h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-5 py-3">
                                                    Month
                                                </th>
                                                <th className="px-5 py-3">
                                                    Predicted cases
                                                </th>
                                                <th className="px-5 py-3">
                                                    Lower bound
                                                </th>
                                                <th className="px-5 py-3">
                                                    Upper bound
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selected.forecast.map((point) => (
                                                <tr
                                                    key={point.month}
                                                    className="hover:bg-slate-50"
                                                >
                                                    <td className="px-5 py-3 font-medium">
                                                        {monthLabel(
                                                            point.month,
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 font-bold text-blue-700">
                                                        {number(
                                                            point.predicted_cases,
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-600">
                                                        {number(
                                                            point.lower_bound,
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-600">
                                                        {number(
                                                            point.upper_bound,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
                            No disease observations are available for the
                            selected filters.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

ForecastDashboard.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);
