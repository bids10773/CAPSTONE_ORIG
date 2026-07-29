# Patient visit demonstration dataset

This module contains **sample data for visualization only**. It does not contain
actual clinic or patient records. The page, every chart panel, and the dataset
table display a Sample Data label.

## Dataset

The deterministic generator creates 60 monthly rows from January 2021 through
December 2025 for:

- Walk-in Patients
- Online Appointments
- Company Referral Patients
- Annual Physical Examination (APE)
- Follow-up Visits
- Optional Emergency Walk-ins

`total_visits` is the sum of the first five categories and intentionally excludes
the optional emergency category. The generator applies category-specific monthly
seasonality, small deterministic variation, and approximately 2–5% yearly
growth. Running it repeatedly produces the same defense-ready dataset.

The module works without seeding by generating data in memory when its table is
empty. To persist the sample dataset:

```shell
php artisan db:seed --class=DemoPatientVisitSeeder
```

Every persisted demonstration row has `is_demo = true`.

## Forecast and analytics

The existing additive Holt-Winters implementation models the total series and
each visit category using a 12-month season. The API supports 3, 6, and 12-month
horizons and returns:

- totals, monthly average, highest/lowest month, next-month prediction, and change;
- historical values and approximate 95% forecast bounds;
- visit distribution and year-over-year totals;
- visit-type forecasts and the learned seasonal pattern;
- dynamically generated capacity-planning insights.

Routes are admin-only:

- `GET /admin/patient-visits`
- `GET /admin/api/patient-visits?year=2025&horizon=12`

Forecasts support operational planning and visualization; they are not clinical
predictions or medical advice.
