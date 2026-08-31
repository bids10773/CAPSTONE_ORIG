import { Head } from '@inertiajs/react';
import {
    Activity,
    ArrowUpRight,
    Calendar,
    CalendarRange,
    Info,
    RefreshCw,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
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

type VisitRow = {
    month: string;
    walk_in: number;
    online_appointments: number;
    company_referrals: number;
    ape: number;
    follow_up: number;
    emergency_walk_ins: number;
    total_visits: number;
};

type PatientVisitData = {
    meta: {
        is_demo: boolean;
        label: string;
        period: string;
        disclaimer: string;
    };
    filters: { year: number | null; horizon: number; years: number[] };
    summary: {
        total_visits: number;
        average_monthly_visits: number;
        highest_month: string;
        highest_month_visits: number;
        lowest_month: string;
        lowest_month_visits: number;
        predicted_next_month: number;
        percentage_change: number;
    };
    history: VisitRow[];
    forecast: {
        month: string;
        predicted_cases: number;
        lower_bound: number;
        upper_bound: number;
    }[];
    model: {
        metrics: {
            trend: number;
            direction: string;
            growth_percentage: number;
            rmse: number;
        };
        seasonal_pattern: { month_index: number; effect: number }[];
    };
    distribution: { key: string; name: string; value: number }[];
    yearly_comparison: { year: number; total_visits: number }[];
    category_forecasts: Record<
        string,
        {
            label: string;
            forecast: { month: string; predicted_cases: number }[];
        }
    >;
    insights: string[];
};

const COLORS = [
    '#237a57',
    '#2563eb',
    '#7c3aed',
    '#d97706',
    '#e11d48',
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
const formatMonth = (value: string) =>
    new Intl.DateTimeFormat('en', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${value}-01T00:00:00Z`));
const formatNumber = (value: number) => Math.round(value).toLocaleString();

function DemoLabel() {
    return (
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold tracking-wide text-amber-800 uppercase">
            Sample Data
        </span>
    );
}

function Panel({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <ChartCard title={title} description={subtitle} action={<DemoLabel />}>
            {children}
        </ChartCard>
    );
}

function Stat({
    label,
    value,
    detail,
    icon: Icon,
}: {
    label: string;
    value: string;
    detail?: string;
    icon: typeof Activity;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        {label}
                    </p>
                    <p className="mt-2 truncate text-xl font-bold text-slate-950">
                        {value}
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

export default function PatientVisitDashboard({
    initialData,
}: {
    initialData: PatientVisitData;
}) {
    const [data, setData] = useState(initialData);
    const [year, setYear] = useState(
        initialData.filters.year?.toString() ?? '',
    );
    const [horizon, setHorizon] = useState(
        initialData.filters.horizon.toString(),
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const combined = useMemo(() => {
        const historical = data.history.map((row) => ({
            month: row.month,
            historical: row.total_visits,
        }));
        const last = historical.at(-1);
        return [
            ...historical,
            ...data.forecast.map((row, index) => ({
                month: row.month,
                forecast: row.predicted_cases,
                lower: row.lower_bound,
                upper: row.upper_bound,
                ...(index === 0 && last ? { historical: last.historical } : {}),
            })),
        ];
    }, [data]);

    const categoryComparison = useMemo(
        () =>
            data.forecast.map((point, index) => ({
                month: point.month,
                ...Object.fromEntries(
                    Object.values(data.category_forecasts).map((category) => [
                        category.label,
                        category.forecast[index]?.predicted_cases,
                    ]),
                ),
            })),
        [data],
    );

    const apply = async () => {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ horizon });
        if (year) params.set('year', year);
        try {
            const response = await fetch(
                `/admin/api/patient-visits?${params}`,
                {
                    headers: { Accept: 'application/json' },
                },
            );
            const body = await response.json();
            if (!response.ok)
                throw new Error(
                    body.message || 'Unable to load patient visit analytics.',
                );
            setData(body);
            window.history.replaceState(
                {},
                '',
                `/admin/patient-visits?${params}`,
            );
        } catch (exception) {
            setError(
                exception instanceof Error
                    ? exception.message
                    : 'Unable to load analytics.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="Demo Patient Visit Forecast" />
            <div className="min-h-screen bg-slate-50/70 p-4 md:p-6">
                <div className="mx-auto max-w-[1600px] space-y-6">
                    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                        <div>
                            <div className="mb-2 flex flex-wrap gap-2">
                                <span className="rounded-full bg-moss-100 px-3 py-1 text-xs font-bold text-moss-800">
                                    Holt-Winters · Patient Visits
                                </span>
                                <DemoLabel />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                                Patient visit forecast
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                {data.meta.period} · Capacity-planning
                                demonstration
                            </p>
                        </div>
                        <div className="flex max-w-xl gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                            <Info className="mt-0.5 size-4 shrink-0" />
                            <span>{data.meta.disclaimer}</span>
                        </div>
                    </header>

                    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]">
                        <label className="text-xs font-semibold text-slate-600">
                            Historical year
                            <select
                                value={year}
                                onChange={(event) =>
                                    setYear(event.target.value)
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                <option value="">All years (2021–2025)</option>
                                {data.filters.years.map((value) => (
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
                                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                <option value="3">Next 3 months</option>
                                <option value="6">Next 6 months</option>
                                <option value="12">Next 12 months</option>
                            </select>
                        </label>
                        <button
                            onClick={apply}
                            disabled={loading}
                            className="mt-auto flex h-10 items-center justify-center gap-2 rounded-lg bg-moss-700 px-5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            <RefreshCw
                                className={`size-4 ${loading ? 'animate-spin' : ''}`}
                            />
                            {loading ? 'Calculating…' : 'Apply filters'}
                        </button>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                        >
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                        <Stat
                            label="Total patient visits"
                            value={formatNumber(data.summary.total_visits)}
                            icon={Users}
                        />
                        <Stat
                            label="Monthly average"
                            value={formatNumber(
                                data.summary.average_monthly_visits,
                            )}
                            icon={Activity}
                        />
                        <Stat
                            label="Highest month"
                            value={formatMonth(data.summary.highest_month)}
                            detail={`${formatNumber(data.summary.highest_month_visits)} visits`}
                            icon={TrendingUp}
                        />
                        <Stat
                            label="Lowest month"
                            value={formatMonth(data.summary.lowest_month)}
                            detail={`${formatNumber(data.summary.lowest_month_visits)} visits`}
                            icon={Calendar}
                        />
                        <Stat
                            label="Next month forecast"
                            value={formatNumber(
                                data.summary.predicted_next_month,
                            )}
                            icon={CalendarRange}
                        />
                        <Stat
                            label="Period change"
                            value={`${data.summary.percentage_change > 0 ? '+' : ''}${data.summary.percentage_change}%`}
                            icon={ArrowUpRight}
                        />
                    </div>

                    <Panel
                        title="Historical vs forecast visits"
                        subtitle="Monthly totals with approximate 95% forecast interval"
                    >
                        {combined.length ? (
                            <div className="h-[280px] w-full sm:h-[330px] lg:h-[380px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart
                                        data={combined}
                                        margin={{ left: -15, right: 10 }}
                                    >
                                        <CartesianGrid {...chartGridProps} />
                                        <XAxis
                                            dataKey="month"
                                            tickFormatter={formatMonth}
                                            minTickGap={38}
                                            {...chartAxisProps}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            width={40}
                                            {...chartAxisProps}
                                        />
                                        <Tooltip
                                            content={
                                                <ChartTooltip
                                                    labelFormatter={(value) =>
                                                        formatMonth(
                                                            String(value),
                                                        )
                                                    }
                                                    valueFormatter={(value) =>
                                                        formatNumber(
                                                            Number(value),
                                                        )
                                                    }
                                                    unit="visits"
                                                />
                                            }
                                            cursor={{
                                                stroke: '#94a3b8',
                                                strokeDasharray: '3 3',
                                            }}
                                        />
                                        <Legend {...chartLegendProps} />
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
                                            fill="white"
                                            fillOpacity={1}
                                        />
                                        <Line
                                            dataKey="historical"
                                            name="Historical visits"
                                            stroke="#237a57"
                                            strokeWidth={2.5}
                                            dot={false}
                                            connectNulls
                                        />
                                        <Line
                                            dataKey="forecast"
                                            name="Forecast visits"
                                            stroke="#2563eb"
                                            strokeWidth={2.5}
                                            strokeDasharray="7 4"
                                            dot={{ r: 3 }}
                                            connectNulls
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <ChartEmptyState message="Not enough historical data to generate this forecast." />
                        )}
                    </Panel>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <Panel
                            title="Patient visit distribution"
                            subtitle="Visit-type share for the selected historical period"
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={data.distribution}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={62}
                                        outerRadius={105}
                                        paddingAngle={2}
                                    >
                                        {data.distribution.map(
                                            (item, index) => (
                                                <Cell
                                                    key={item.key}
                                                    fill={
                                                        COLORS[
                                                            index %
                                                                COLORS.length
                                                        ]
                                                    }
                                                />
                                            ),
                                        )}
                                    </Pie>
                                    <Tooltip
                                        content={
                                            <ChartTooltip
                                                valueFormatter={(value) =>
                                                    formatNumber(Number(value))
                                                }
                                                unit="visits"
                                            />
                                        }
                                    />
                                    <Legend {...chartLegendProps} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Panel>

                        <Panel
                            title="Year-over-year comparison"
                            subtitle="Annual patient visit totals"
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data.yearly_comparison}>
                                    <CartesianGrid {...chartGridProps} />
                                    <XAxis dataKey="year" {...chartAxisProps} />
                                    <YAxis
                                        allowDecimals={false}
                                        {...chartAxisProps}
                                    />
                                    <Tooltip
                                        content={
                                            <ChartTooltip
                                                valueFormatter={(value) =>
                                                    formatNumber(Number(value))
                                                }
                                                unit="visits"
                                            />
                                        }
                                        cursor={{ fill: '#f1f5f9' }}
                                    />
                                    <Bar
                                        dataKey="total_visits"
                                        name="Total visits"
                                        fill="#237a57"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Panel>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                        <Panel
                            title="Visit type forecast comparison"
                            subtitle="Projected demand by visit category"
                        >
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={categoryComparison}>
                                    <CartesianGrid {...chartGridProps} />
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={formatMonth}
                                        {...chartAxisProps}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        {...chartAxisProps}
                                    />
                                    <Tooltip
                                        content={
                                            <ChartTooltip
                                                labelFormatter={(value) =>
                                                    formatMonth(String(value))
                                                }
                                                valueFormatter={(value) =>
                                                    formatNumber(Number(value))
                                                }
                                                unit="visits"
                                            />
                                        }
                                    />
                                    <Legend {...chartLegendProps} />
                                    {Object.values(data.category_forecasts).map(
                                        (category, index) => (
                                            <Area
                                                key={category.label}
                                                dataKey={category.label}
                                                stackId="visits"
                                                stroke={
                                                    COLORS[
                                                        index % COLORS.length
                                                    ]
                                                }
                                                fill={
                                                    COLORS[
                                                        index % COLORS.length
                                                    ]
                                                }
                                                fillOpacity={0.65}
                                            />
                                        ),
                                    )}
                                </AreaChart>
                            </ResponsiveContainer>
                        </Panel>

                        <Panel
                            title="Seasonal trend analysis"
                            subtitle="Monthly additive seasonal effect"
                        >
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={data.model.seasonal_pattern}>
                                    <CartesianGrid {...chartGridProps} />
                                    <XAxis
                                        dataKey="month_index"
                                        tickFormatter={(value) =>
                                            MONTHS[Number(value) - 1]
                                        }
                                        {...chartAxisProps}
                                    />
                                    <YAxis {...chartAxisProps} />
                                    <Tooltip
                                        content={
                                            <ChartTooltip
                                                labelFormatter={(value) =>
                                                    MONTHS[Number(value) - 1]
                                                }
                                                valueFormatter={(value) =>
                                                    Number(value).toFixed(1)
                                                }
                                            />
                                        }
                                        cursor={{ fill: '#f1f5f9' }}
                                    />
                                    <Bar
                                        dataKey="effect"
                                        name="Seasonal effect"
                                        radius={[5, 5, 0, 0]}
                                    >
                                        {data.model.seasonal_pattern.map(
                                            (item) => (
                                                <Cell
                                                    key={item.month_index}
                                                    fill={
                                                        item.effect >= 0
                                                            ? '#237a57'
                                                            : '#94a3b8'
                                                    }
                                                />
                                            ),
                                        )}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Panel>
                    </div>

                    <Panel
                        title="Forecast interpretation"
                        subtitle="Automatically generated capacity-planning observations"
                    >
                        <div className="grid gap-3 md:grid-cols-2">
                            {data.insights.map((insight) => (
                                <div
                                    key={insight}
                                    className="flex gap-3 rounded-xl border border-moss-100 bg-moss-50 p-4 text-sm leading-6 text-moss-950"
                                >
                                    <TrendingUp className="mt-0.5 size-4 shrink-0 text-moss-700" />
                                    {insight}
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5">
                            <div>
                                <h2 className="font-bold text-slate-950">
                                    Monthly patient visit dataset
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Total excludes optional emergency walk-ins,
                                    as specified.
                                </p>
                            </div>
                            <DemoLabel />
                        </div>
                        <div className="max-h-[560px] overflow-auto">
                            <table className="w-full min-w-[1000px] text-left text-sm">
                                <thead className="sticky top-0 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Month</th>
                                        <th className="px-4 py-3">Walk-in</th>
                                        <th className="px-4 py-3">Online</th>
                                        <th className="px-4 py-3">
                                            Company referral
                                        </th>
                                        <th className="px-4 py-3">APE</th>
                                        <th className="px-4 py-3">Follow-up</th>
                                        <th className="px-4 py-3">Emergency</th>
                                        <th className="px-4 py-3">
                                            Total visits
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.history.map((row) => (
                                        <tr
                                            key={row.month}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="px-4 py-3 font-semibold">
                                                {formatMonth(row.month)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.walk_in}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.online_appointments}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.company_referrals}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.ape}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.follow_up}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {row.emergency_walk_ins}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-moss-800">
                                                {row.total_visits}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

PatientVisitDashboard.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);
