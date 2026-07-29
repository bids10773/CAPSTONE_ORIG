# Seasonal disease forecasting

This admin-only module uses additive Holt-Winters triple exponential smoothing to
project monthly disease case counts. It is decision-support visualization only;
it does not diagnose patients or recommend treatment.

## Data source

`disease_case_records` stores one non-negative aggregate per disease and calendar
month. A unique database constraint prevents duplicate disease/month records.
When the table is empty, the dashboard uses deterministic sample observations
and prominently labels every result **Sample Data · Demo Forecast**.

## Model

For observation `y[t]`, season length `m`, level `l`, trend `b`, and seasonal
effect `s`, the additive updates are:

```text
l[t] = α(y[t] - s[t-m]) + (1-α)(l[t-1] + b[t-1])
b[t] = β(l[t] - l[t-1]) + (1-β)b[t-1]
s[t] = γ(y[t] - l[t]) + (1-γ)s[t-m]
forecast[t+h] = l[t] + h*b[t] + s[t-m+(h mod m)]
```

Defaults are `α=.3`, `β=.1`, `γ=.2`, and `m=12`. At least two complete seasons
are required. Missing calendar months are filled with zero; invalid dates,
negative counts, duplicate months, invalid smoothing values, and insufficient
history return meaningful validation errors.

Approximate 95% visualization bounds use model residual RMSE scaled by
`1.96 × sqrt(horizon)`. These are uncertainty indicators, not clinical
confidence or guarantees.

## Endpoints

All routes require an authenticated administrator.

- `GET /admin/forecast` — Inertia dashboard
- `GET /admin/api/forecast` — dashboard summary and forecasts
- `GET /admin/api/forecast/{disease}` — one disease
- `GET /admin/api/forecast/history` — normalized historical series

Query parameters: `disease`, `year`, `horizon` (1–36), `season_length` (2–24),
and smoothing parameters `alpha`, `beta`, `gamma` in `(0, 1]`.

Responses are cached for 15 minutes by parameter set. Database queries select
only required columns and use the disease/month unique index.

## Production ingestion

Populate `disease_case_records` from an approved, de-identified aggregate source.
Do not infer diseases from free-text remarks. Clear the application cache after
bulk imports so the dashboard reflects new aggregates immediately.
