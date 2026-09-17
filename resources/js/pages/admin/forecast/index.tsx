import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    ChartTooltip,
    chartAxisProps,
    chartGridProps,
    chartLegendProps,
} from '@/components/analytics/chart-ui';
import AppLayout from '@/layouts/app-layout';

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
const number = (value: number) => Math.round(value).toLocaleString();

interface MonthlyMlForecast {
    forecast_month: string;
    data_type: 'Synthetic Simulation';
    validated_on_real_data: false;
    weather_assumption: string;
    predictions: { disease: string; predicted_cases: number; method: string }[];
}

interface ResourcePlan extends MonthlyMlForecast {
    clinic_approved: 'No';
    mapping_source: string;
    inventory_source: string;
    services: {
        disease: string;
        expected_clinic_cases: number;
        service: string;
        expected_services: number;
        equipment: string;
        supply_item: string;
        required_units: number;
    }[];
    supplies: {
        supply_item: string;
        required_units: number;
        opening_stock: number | null;
        safety_stock: number | null;
        projected_remaining_stock: number | null;
        replenishment_gap: number | null;
        unit: string | null;
        status: string;
    }[];
}

interface CurrentWeather {
    location: string;
    source: string;
    observation_time: string;
    temperature_c: number;
    relative_humidity_percent: number;
    precipitation_mm: number;
    precipitation_period_minutes: number;
    last_successful_update: string;
    stale: boolean;
}

interface WeatherScenarioForecast extends MonthlyMlForecast {
    weather_source: string;
    weather_source_month: string;
    weather_values: {
        monthly_avg_temp_c: number;
        monthly_avg_humidity_percent: number;
        monthly_total_rainfall_mm: number;
    };
    scenario_only: true;
}

const mlDiseaseLabel = (name: string) =>
    name.replaceAll('_', ' ').replace('Influenza ILI', 'Influenza / ILI');

export default function ForecastDashboard() {
    const [monthlyMonth, setMonthlyMonth] = useState(() => {
        const requested = Number(
            new URLSearchParams(window.location.search).get('month'),
        );
        return requested >= 1 && requested <= 12 ? requested : 10;
    });
    const [monthlyData, setMonthlyData] = useState<MonthlyMlForecast | null>(
        null,
    );
    const [monthlyLoading, setMonthlyLoading] = useState(true);
    const [monthlyError, setMonthlyError] = useState('');
    const [resourceData, setResourceData] = useState<ResourcePlan | null>(null);
    const [weather, setWeather] = useState<CurrentWeather | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [weatherError, setWeatherError] = useState('');
    const [weatherScenario, setWeatherScenario] =
        useState<WeatherScenarioForecast | null>(null);
    const [scenarioLoading, setScenarioLoading] = useState(false);
    const [scenarioError, setScenarioError] = useState('');
    const highestSimulated =
        monthlyData?.predictions.reduce<
            MonthlyMlForecast['predictions'][number] | null
        >(
            (highest, prediction) =>
                !highest || prediction.predicted_cases > highest.predicted_cases
                    ? prediction
                    : highest,
            null,
        ) ?? null;
    const rankedPredictions = [...(monthlyData?.predictions ?? [])]
        .sort((a, b) => b.predicted_cases - a.predicted_cases)
        .map((item) => ({
            ...item,
            label: mlDiseaseLabel(item.disease),
        }));
    const scenarioComparison =
        monthlyData && weatherScenario
            ? monthlyData.predictions.flatMap((baseline) => {
                  const scenario = weatherScenario.predictions.find(
                      (item) => item.disease === baseline.disease,
                  );
                  return scenario
                      ? [
                            {
                                label: mlDiseaseLabel(baseline.disease),
                                baseline: baseline.predicted_cases,
                                scenario: scenario.predicted_cases,
                            },
                        ]
                      : [];
              })
            : [];
    const supplyByName = new Map(
        resourceData?.supplies.map((supply) => [supply.supply_item, supply]) ??
            [],
    );
    const scenarioPredictions =
        weatherScenario?.forecast_month === resourceData?.forecast_month
            ? new Map(
                  weatherScenario?.predictions.map((prediction) => [
                      prediction.disease,
                      prediction.predicted_cases,
                  ]) ?? [],
              )
            : new Map<string, number>();
    const baselinePredictions = new Map(
        resourceData?.predictions.map((prediction) => [
            prediction.disease,
            prediction.predicted_cases,
        ]) ?? [],
    );
    const priorityEquipment = (resourceData?.services ?? [])
        .map((service) => ({
            ...service,
            supplyGap:
                supplyByName.get(service.supply_item)?.replenishment_gap ?? 0,
            scenarioIncrease: Math.max(
                0,
                (scenarioPredictions.get(service.disease) ??
                    baselinePredictions.get(service.disease) ??
                    0) - (baselinePredictions.get(service.disease) ?? 0),
            ),
        }))
        .sort(
            (a, b) =>
                Number(b.supplyGap > 0) - Number(a.supplyGap > 0) ||
                Number(b.scenarioIncrease > 0) -
                    Number(a.scenarioIncrease > 0) ||
                b.supplyGap - a.supplyGap ||
                b.expected_services - a.expected_services,
        )
        .slice(0, 3);
    const prioritySupplies = [...(resourceData?.supplies ?? [])]
        .filter((supply) => (supply.replenishment_gap ?? 0) > 0)
        .sort((a, b) => (b.replenishment_gap ?? 0) - (a.replenishment_gap ?? 0))
        .slice(0, 3);

    useEffect(() => {
        const controller = new AbortController();
        setMonthlyLoading(true);
        setMonthlyError('');
        setMonthlyData(null);
        setResourceData(null);
        const planningMonth = monthlyMonth >= 10;
        const endpoint = planningMonth ? 'resources' : 'monthly';
        fetch(
            `/admin/api/forecast/${endpoint}?year=2026&month=${monthlyMonth}`,
            {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            },
        )
            .then(async (response) => {
                const body = await response.json();
                if (!response.ok)
                    throw new Error(
                        body.message || 'Unable to load the monthly forecast.',
                    );
                return body as MonthlyMlForecast | ResourcePlan;
            })
            .then((body) => {
                setMonthlyData(body);
                if (planningMonth) setResourceData(body as ResourcePlan);
            })
            .catch((exception: unknown) => {
                if (!controller.signal.aborted)
                    setMonthlyError(
                        exception instanceof Error
                            ? exception.message
                            : 'Unable to load the monthly forecast.',
                    );
            })
            .finally(() => {
                if (!controller.signal.aborted) setMonthlyLoading(false);
            });
        return () => controller.abort();
    }, [monthlyMonth]);

    useEffect(() => {
        const controller = new AbortController();
        setWeatherScenario(null);
        setScenarioError('');
        if (monthlyMonth < 10) {
            setScenarioLoading(false);
            return () => controller.abort();
        }
        setScenarioLoading(true);
        fetch(
            `/admin/api/forecast/weather-scenario?year=2026&month=${monthlyMonth}`,
            {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            },
        )
            .then(async (response) => {
                const body = await response.json();
                if (!response.ok)
                    throw new Error(
                        body.message || 'Weather scenario is unavailable.',
                    );
                return body as WeatherScenarioForecast;
            })
            .then((body) => setWeatherScenario(body))
            .catch((exception: unknown) => {
                if (!controller.signal.aborted)
                    setScenarioError(
                        exception instanceof Error
                            ? exception.message
                            : 'Weather scenario is unavailable.',
                    );
            })
            .finally(() => {
                if (!controller.signal.aborted) setScenarioLoading(false);
            });
        return () => controller.abort();
    }, [monthlyMonth]);

    useEffect(() => {
        const controller = new AbortController();
        fetch('/admin/api/forecast/weather', {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then(async (response) => {
                const body = await response.json();
                if (!response.ok)
                    throw new Error(
                        body.message || 'Current weather is unavailable.',
                    );
                return body as CurrentWeather;
            })
            .then((body) => setWeather(body))
            .catch((exception: unknown) => {
                if (!controller.signal.aborted)
                    setWeatherError(
                        exception instanceof Error
                            ? exception.message
                            : 'Current weather is unavailable.',
                    );
            })
            .finally(() => {
                if (!controller.signal.aborted) setWeatherLoading(false);
            });
        return () => controller.abort();
    }, []);

    return (
        <>
            <Head title="Monthly ML Simulation" />
            <div className="min-h-screen bg-slate-50/70 p-4 md:p-6">
                <div className="mx-auto max-w-[1600px] space-y-6">
                    <header>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                            Monthly disease simulation
                        </h1>
                    </header>

                    <section
                        className="space-y-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
                        aria-label="Monthly ML simulation"
                    >
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-950">
                                    Monthly ML simulation
                                </h2>
                                <p className="mt-1 font-semibold text-amber-800">
                                    Synthetic Simulation — Not Validated on Real
                                    Disease Data
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    This model uses synthetic historical disease
                                    counts and synthetic 2025 weather proxies.
                                    Results are simulated cases, not actual
                                    Calamba City incidence or LMIC patient
                                    volume.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <label className="text-xs font-semibold text-slate-600">
                                    Year
                                    <select
                                        value="2026"
                                        disabled
                                        className="mt-1 block h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                                    >
                                        <option value="2026">2026 only</option>
                                    </select>
                                </label>
                                <label className="text-xs font-semibold text-slate-600">
                                    Month
                                    <select
                                        value={monthlyMonth}
                                        onChange={(event) => {
                                            const month = Number(
                                                event.target.value,
                                            );
                                            setMonthlyMonth(month);
                                            const url = new URL(
                                                window.location.href,
                                            );
                                            url.searchParams.set(
                                                'month',
                                                String(month),
                                            );
                                            window.history.replaceState(
                                                {},
                                                '',
                                                url,
                                            );
                                        }}
                                        className="mt-1 block h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                                    >
                                        {MONTHS.map((name, index) => (
                                            <option
                                                key={name}
                                                value={index + 1}
                                            >
                                                {new Intl.DateTimeFormat('en', {
                                                    month: 'long',
                                                    timeZone: 'UTC',
                                                }).format(
                                                    new Date(
                                                        Date.UTC(
                                                            2026,
                                                            index,
                                                            1,
                                                        ),
                                                    ),
                                                )}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">
                            Selected forecast:{' '}
                            {new Intl.DateTimeFormat('en', {
                                month: 'long',
                                year: 'numeric',
                                timeZone: 'UTC',
                            }).format(
                                new Date(Date.UTC(2026, monthlyMonth - 1, 1)),
                            )}
                        </p>
                        {monthlyLoading && (
                            <p role="status" className="text-sm text-slate-600">
                                Loading monthly predictions…
                            </p>
                        )}
                        {monthlyError && (
                            <p
                                role="alert"
                                className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
                            >
                                {monthlyError}
                            </p>
                        )}
                        {!monthlyLoading &&
                            !monthlyError &&
                            !monthlyData?.predictions.length && (
                                <p className="text-sm text-slate-600">
                                    No predictions are available for this month.
                                </p>
                            )}
                        {monthlyData && monthlyData.predictions.length > 0 && (
                            <>
                                {highestSimulated && (
                                    <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:w-60">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {mlDiseaseLabel(
                                                highestSimulated.disease,
                                            )}
                                        </p>
                                        <p className="mt-2 text-3xl font-bold text-blue-800">
                                            {number(
                                                highestSimulated.predicted_cases,
                                            )}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-slate-900">
                                        Simulated cases by disease
                                    </h3>
                                    <p className="text-xs text-slate-600">
                                        Ranked case counts for the selected
                                        month.
                                    </p>
                                </div>
                                <div
                                    className="w-full"
                                    style={{
                                        height: Math.max(
                                            320,
                                            rankedPredictions.length * 48,
                                        ),
                                    }}
                                >
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={rankedPredictions}
                                            layout="vertical"
                                            margin={{
                                                top: 8,
                                                right: 48,
                                                left: 8,
                                                bottom: 8,
                                            }}
                                        >
                                            <CartesianGrid
                                                {...chartGridProps}
                                                vertical
                                                horizontal={false}
                                            />
                                            <XAxis
                                                type="number"
                                                allowDecimals={false}
                                                {...chartAxisProps}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="label"
                                                width={125}
                                                interval={0}
                                                {...chartAxisProps}
                                            />
                                            <Tooltip
                                                content={
                                                    <ChartTooltip
                                                        valueFormatter={(
                                                            value,
                                                        ) =>
                                                            number(
                                                                Number(value),
                                                            )
                                                        }
                                                        unit="cases"
                                                    />
                                                }
                                            />
                                            <Bar
                                                dataKey="predicted_cases"
                                                name="Simulated cases"
                                                fill="#2563eb"
                                                radius={[0, 5, 5, 0]}
                                            >
                                                <LabelList
                                                    dataKey="predicted_cases"
                                                    position="right"
                                                    fill="#1e3a8a"
                                                    fontSize={12}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200">
                                                <th className="py-2">
                                                    Disease
                                                </th>
                                                <th className="py-2">
                                                    Simulated cases
                                                </th>
                                                <th className="py-2">Method</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthlyData.predictions.map(
                                                (item) => (
                                                    <tr
                                                        key={item.disease}
                                                        className="border-b border-slate-100"
                                                    >
                                                        <td className="py-2">
                                                            {mlDiseaseLabel(
                                                                item.disease,
                                                            )}
                                                        </td>
                                                        <td className="py-2 font-semibold">
                                                            {number(
                                                                item.predicted_cases,
                                                            )}
                                                        </td>
                                                        <td className="py-2">
                                                            {item.method}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </section>

                    <section
                        className="space-y-3 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm"
                        aria-label="Experimental Open-Meteo weather scenario"
                    >
                        <h2 className="text-lg font-bold text-slate-950">
                            Experimental Open-Meteo weather scenario
                        </h2>
                        <p className="text-sm text-slate-600">
                            The saved ML model uses historical Open-Meteo
                            weather from the corresponding 2025 month as the
                            selected forecast month’s previous-month weather
                            input. Earlier recursive case estimates and training
                            disease data remain synthetic. This is a sensitivity
                            scenario, not a validated disease forecast or a 2026
                            weather forecast.
                        </p>
                        {monthlyMonth < 10 && (
                            <p className="text-sm text-slate-600">
                                Comparison is available for October–December
                                2026.
                            </p>
                        )}
                        {monthlyMonth >= 10 && scenarioLoading && (
                            <p role="status" className="text-sm text-slate-600">
                                Loading historical weather scenario…
                            </p>
                        )}
                        {monthlyMonth >= 10 && scenarioError && (
                            <p role="alert" className="text-sm text-amber-800">
                                {scenarioError}
                            </p>
                        )}
                        {weatherScenario &&
                            monthlyData &&
                            weatherScenario.forecast_month ===
                                monthlyData.forecast_month && (
                                <>
                                    <p className="text-xs text-slate-600">
                                        Source: {weatherScenario.weather_source}{' '}
                                        · Analog month:{' '}
                                        {weatherScenario.weather_source_month} ·
                                        Average temperature:{' '}
                                        {
                                            weatherScenario.weather_values
                                                .monthly_avg_temp_c
                                        }{' '}
                                        °C · Average humidity:{' '}
                                        {
                                            weatherScenario.weather_values
                                                .monthly_avg_humidity_percent
                                        }
                                        % · Total rainfall:{' '}
                                        {
                                            weatherScenario.weather_values
                                                .monthly_total_rainfall_mm
                                        }{' '}
                                        mm
                                    </p>
                                    {scenarioComparison.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-slate-900">
                                                Baseline and weather scenario by
                                                disease
                                            </h3>
                                            <p className="text-xs text-slate-600">
                                                Simulated case counts for the
                                                selected month.
                                            </p>
                                            <div
                                                className="w-full"
                                                style={{
                                                    height: Math.max(
                                                        340,
                                                        scenarioComparison.length *
                                                            56,
                                                    ),
                                                }}
                                            >
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >
                                                    <BarChart
                                                        data={
                                                            scenarioComparison
                                                        }
                                                        layout="vertical"
                                                        margin={{
                                                            top: 8,
                                                            right: 20,
                                                            left: 8,
                                                            bottom: 8,
                                                        }}
                                                    >
                                                        <CartesianGrid
                                                            {...chartGridProps}
                                                            vertical
                                                            horizontal={false}
                                                        />
                                                        <XAxis
                                                            type="number"
                                                            allowDecimals={
                                                                false
                                                            }
                                                            {...chartAxisProps}
                                                        />
                                                        <YAxis
                                                            type="category"
                                                            dataKey="label"
                                                            width={125}
                                                            interval={0}
                                                            {...chartAxisProps}
                                                        />
                                                        <Tooltip
                                                            content={
                                                                <ChartTooltip
                                                                    valueFormatter={(
                                                                        value,
                                                                    ) =>
                                                                        number(
                                                                            Number(
                                                                                value,
                                                                            ),
                                                                        )
                                                                    }
                                                                    unit="cases"
                                                                />
                                                            }
                                                        />
                                                        <Legend
                                                            {...chartLegendProps}
                                                        />
                                                        <Bar
                                                            dataKey="baseline"
                                                            name="Synthetic baseline"
                                                            fill="#2563eb"
                                                            radius={[
                                                                0, 4, 4, 0,
                                                            ]}
                                                        />
                                                        <Bar
                                                            dataKey="scenario"
                                                            name="Weather scenario"
                                                            fill="#7c3aed"
                                                            radius={[
                                                                0, 4, 4, 0,
                                                            ]}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[560px] text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="py-2">
                                                        Disease
                                                    </th>
                                                    <th>Synthetic baseline</th>
                                                    <th>
                                                        Open-Meteo analog
                                                        scenario
                                                    </th>
                                                    <th>Difference</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {monthlyData.predictions.map(
                                                    (baseline) => {
                                                        const scenario =
                                                            weatherScenario.predictions.find(
                                                                (item) =>
                                                                    item.disease ===
                                                                    baseline.disease,
                                                            );
                                                        const difference =
                                                            scenario
                                                                ? scenario.predicted_cases -
                                                                  baseline.predicted_cases
                                                                : null;
                                                        return (
                                                            <tr
                                                                key={
                                                                    baseline.disease
                                                                }
                                                                className="border-b border-slate-100"
                                                            >
                                                                <td className="py-2">
                                                                    {mlDiseaseLabel(
                                                                        baseline.disease,
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {number(
                                                                        baseline.predicted_cases,
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {scenario
                                                                        ? number(
                                                                              scenario.predicted_cases,
                                                                          )
                                                                        : '—'}
                                                                </td>
                                                                <td>
                                                                    {difference ===
                                                                    null
                                                                        ? '—'
                                                                        : `${difference > 0 ? '+' : ''}${difference}`}
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs font-semibold text-violet-800">
                                        The resource plan continues to use the
                                        synthetic baseline. Neither set of case
                                        counts is validated on real disease
                                        data.
                                    </p>
                                </>
                            )}
                    </section>

                    <section
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        aria-label="Current weather in Calamba"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <h2 className="text-lg font-bold text-slate-950">
                                    Current weather · Calamba City, Laguna
                                </h2>
                                <p className="text-xs text-slate-600">
                                    Open-Meteo model conditions for one
                                    observation time; separate from the
                                    synthetic disease forecast.
                                </p>
                            </div>
                            {weather?.stale && (
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
                                    Stale cached weather
                                </span>
                            )}
                        </div>
                        {weatherLoading && (
                            <p
                                role="status"
                                className="mt-3 text-sm text-slate-600"
                            >
                                Loading weather…
                            </p>
                        )}
                        {weatherError && (
                            <p
                                role="alert"
                                className="mt-3 text-sm text-red-800"
                            >
                                {weatherError}
                            </p>
                        )}
                        {weather && (
                            <>
                                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs text-slate-500">
                                            Temperature
                                        </p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {weather.temperature_c} °C
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs text-slate-500">
                                            Relative humidity
                                        </p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {weather.relative_humidity_percent}%
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs text-slate-500">
                                            Precipitation · previous{' '}
                                            {
                                                weather.precipitation_period_minutes
                                            }{' '}
                                            min
                                        </p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {weather.precipitation_mm} mm
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-slate-600">
                                    Observed{' '}
                                    {new Intl.DateTimeFormat('en-PH', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                        timeZone: 'Asia/Manila',
                                    }).format(
                                        new Date(weather.observation_time),
                                    )}{' '}
                                    · Last successful update{' '}
                                    {new Intl.DateTimeFormat('en-PH', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                        timeZone: 'Asia/Manila',
                                    }).format(
                                        new Date(
                                            weather.last_successful_update,
                                        ),
                                    )}{' '}
                                    · Source: {weather.source}
                                </p>
                            </>
                        )}
                        <p className="mt-3 text-xs text-slate-500">
                            Disease Data: Synthetic · Future Weather Input:
                            Synthetic 2025 Weather Proxy · Current Weather API:
                            Context Only · Historical Open-Meteo: Experimental
                            Scenario · Forecast Validation: Not Validated on
                            Real Disease Data
                        </p>
                    </section>

                    <section
                        className="space-y-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
                        aria-label="Synthetic resource planning"
                    >
                        <h2 className="text-lg font-bold text-slate-950">
                            Synthetic resource planning
                        </h2>
                        <p className="font-semibold text-amber-800">
                            Synthetic Resource Planning — For Capstone
                            Demonstration Only.
                        </p>
                        <p className="text-sm text-slate-600">
                            Disease predictions use synthetic training data and
                            hypothetical historical weather proxies. Clinic
                            capture and service utilization rates are invented;
                            services and equipment are illustrative and
                            unverified. Inventory balances are hypothetical,
                            independent monthly scenarios. These results are not
                            suitable for real clinical planning or purchasing.
                            Clinic approved: No.
                        </p>
                        {monthlyMonth < 10 && (
                            <p className="text-sm text-slate-600">
                                Resource planning scenarios are available for
                                October–December 2026. Select one of those
                                months above.
                            </p>
                        )}
                        {monthlyMonth >= 10 && monthlyLoading && (
                            <p role="status" className="text-sm text-slate-600">
                                Calculating resource plan…
                            </p>
                        )}
                        {monthlyMonth >= 10 && monthlyError && (
                            <p role="alert" className="text-sm text-red-800">
                                {monthlyError}
                            </p>
                        )}
                        {monthlyMonth >= 10 &&
                            !monthlyLoading &&
                            !monthlyError &&
                            !resourceData && (
                                <p className="text-sm text-slate-600">
                                    No resource plan is available for this
                                    month.
                                </p>
                            )}
                        {resourceData && (
                            <>
                                <p className="text-sm font-semibold text-slate-800">
                                    {resourceData.forecast_month} ·{' '}
                                    {resourceData.mapping_source} ·{' '}
                                    {resourceData.inventory_source}
                                </p>
                                <div
                                    className="space-y-4 rounded-xl border border-amber-300 bg-amber-50 p-4"
                                    aria-label="Simulated equipment and supply priorities"
                                >
                                    <div>
                                        <h3 className="text-base font-bold text-amber-950">
                                            Equipment and supplies to review
                                        </h3>
                                        <p className="mt-1 text-sm text-amber-900">
                                            Equipment is ranked by linked supply
                                            gaps, weather-scenario case
                                            increases, and estimated service
                                            demand. These are demonstration
                                            priorities, not verified clinic
                                            needs.
                                        </p>
                                        {weatherScenario?.forecast_month ===
                                            resourceData.forecast_month && (
                                            <p className="mt-2 text-xs font-semibold text-violet-800">
                                                Weather context:{' '}
                                                {
                                                    weatherScenario
                                                        .weather_values
                                                        .monthly_total_rainfall_mm
                                                }{' '}
                                                mm rainfall in the{' '}
                                                {
                                                    weatherScenario.weather_source_month
                                                }{' '}
                                                historical analog. This is not a
                                                2026 rainfall forecast.
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        {priorityEquipment.map(
                                            (item, index) => (
                                                <div
                                                    key={`${item.disease}-${item.equipment}`}
                                                    className={`rounded-xl border p-4 ${index === 0 ? 'border-amber-400 bg-white shadow-sm' : 'border-amber-200 bg-white/80'}`}
                                                >
                                                    <p className="text-xs font-bold tracking-wide text-amber-800 uppercase">
                                                        Equipment to prepare #
                                                        {index + 1}
                                                    </p>
                                                    <h4 className="mt-2 font-bold text-slate-950">
                                                        {item.equipment}
                                                    </h4>
                                                    <p className="mt-1 text-sm text-slate-700">
                                                        {mlDiseaseLabel(
                                                            item.disease,
                                                        )}{' '}
                                                        ·{' '}
                                                        {item.expected_services}{' '}
                                                        estimated services
                                                    </p>
                                                    <p className="mt-2 text-xs text-slate-600">
                                                        Linked supply:{' '}
                                                        {item.supply_item}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {item.supplyGap > 0 && (
                                                            <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800">
                                                                Simulated supply
                                                                gap:{' '}
                                                                {item.supplyGap}
                                                            </span>
                                                        )}
                                                        {item.scenarioIncrease >
                                                            0 && (
                                                            <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800">
                                                                Weather
                                                                scenario: +
                                                                {
                                                                    item.scenarioIncrease
                                                                }{' '}
                                                                cases
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-amber-950">
                                            Supplies with simulated
                                            replenishment gaps
                                        </h4>
                                        {prioritySupplies.length ? (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {prioritySupplies.map(
                                                    (supply) => (
                                                        <span
                                                            key={
                                                                supply.supply_item
                                                            }
                                                            className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-rose-900"
                                                        >
                                                            <strong>
                                                                {
                                                                    supply.supply_item
                                                                }
                                                            </strong>
                                                            :{' '}
                                                            {
                                                                supply.replenishment_gap
                                                            }{' '}
                                                            {supply.unit ??
                                                                'units'}{' '}
                                                            gap
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <p className="mt-1 text-sm text-amber-900">
                                                No replenishment gaps in this
                                                hypothetical stock scenario.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <h3 className="font-semibold text-slate-900">
                                    Estimated service demand
                                </h3>
                                {resourceData.services.length ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[700px] text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="py-2">
                                                        Disease
                                                    </th>
                                                    <th>
                                                        Expected clinic cases
                                                    </th>
                                                    <th>
                                                        Illustrative service
                                                    </th>
                                                    <th>Estimated services</th>
                                                    <th>Equipment</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {resourceData.services.map(
                                                    (row, index) => (
                                                        <tr
                                                            key={`${row.disease}-${index}`}
                                                            className="border-b border-slate-100"
                                                        >
                                                            <td className="py-2">
                                                                {mlDiseaseLabel(
                                                                    row.disease,
                                                                )}
                                                            </td>
                                                            <td>
                                                                {
                                                                    row.expected_clinic_cases
                                                                }
                                                            </td>
                                                            <td>
                                                                {row.service}
                                                            </td>
                                                            <td>
                                                                {
                                                                    row.expected_services
                                                                }
                                                            </td>
                                                            <td>
                                                                {row.equipment}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600">
                                        No service mappings are available.
                                    </p>
                                )}
                                <h3 className="font-semibold text-slate-900">
                                    Supply planning
                                </h3>
                                {resourceData.supplies.length ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[850px] text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="py-2">
                                                        Supply item
                                                    </th>
                                                    <th>Required</th>
                                                    <th>
                                                        Synthetic opening stock
                                                    </th>
                                                    <th>Safety stock</th>
                                                    <th>Projected remaining</th>
                                                    <th>Replenishment gap</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {resourceData.supplies.map(
                                                    (row) => (
                                                        <tr
                                                            key={
                                                                row.supply_item
                                                            }
                                                            className="border-b border-slate-100"
                                                        >
                                                            <td className="py-2">
                                                                {
                                                                    row.supply_item
                                                                }
                                                            </td>
                                                            <td>
                                                                {
                                                                    row.required_units
                                                                }{' '}
                                                                {row.unit}
                                                            </td>
                                                            <td>
                                                                {row.opening_stock ??
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                {row.safety_stock ??
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                {row.projected_remaining_stock ??
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                {row.replenishment_gap ??
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className={
                                                                        row.status ===
                                                                        'Potential Shortage in Simulation'
                                                                            ? 'font-semibold text-amber-800'
                                                                            : 'text-slate-700'
                                                                    }
                                                                >
                                                                    {row.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600">
                                        No supply requirements are available.
                                    </p>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

ForecastDashboard.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);
