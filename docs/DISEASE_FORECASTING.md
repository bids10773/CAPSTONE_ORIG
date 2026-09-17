# Disease simulation and forecasting

The admin Forecast page shows a synthetic monthly disease simulation for 2026,
resource planning scenarios, and weather context. The former seasonal disease
forecast and its historical disease API have been removed. Patient visit
forecasting is a separate feature.

The `disease_case_records` database table remains in place so existing records
are preserved; the Forecast page no longer reads it.

## Monthly ML simulation

The admin Forecast page requests a synthetic monthly
simulation from `GET /admin/api/forecast/monthly?year=2026&month=10`. Laravel
uses `LMIC_ML_URL` (default `http://127.0.0.1:8001`) to call FastAPI's
`GET /forecast` endpoint. The selector supports January through December 2026
only. This data is never stored in `disease_case_records`.

For local development, start FastAPI from the project root with
`uvicorn ml_api.main:app --host 127.0.0.1 --port 8001`, then start Laravel
with `php artisan serve` and the frontend with `npm run dev`. The Python
environment must provide FastAPI, Uvicorn, NumPy, pandas, openpyxl, joblib,
and the scikit-learn version compatible with the saved model artifact. Keep
the model and source workbook outside Laravel's public directory.

For separate deployed services, set `LMIC_ML_URL` to a URL reachable from the
Laravel service, preferably a private service address; deployed `127.0.0.1`
would refer to Laravel's own container. Start FastAPI with the deployment
platform's assigned host and port. There is currently no inventory module in
this Laravel application.

## Synthetic resource planning

The admin Forecast page has a resource-planning section for October through
December 2026. `GET /admin/api/forecast/resources?year=2026&month=10` uses the
existing `MonthlyMlForecastService`, then joins its selected-month predictions
to `resources/data/synthetic-resource-mappings.json`. This mapping fixture is
a snapshot of the eight `Colab_Ready` rows in
`ml_api/data/synthetic_resource_mapping.xlsx`. Disease names are normalized to
the FastAPI keys. The workbook's January `Predicted_Cases` and `Current_Stock`
columns are deliberately excluded. Each mapping retains its workbook scenario
note and source. The workbook is the source of illustrative rates, services,
equipment, supply items, and units per service.

`resources/data/synthetic-resource-scenarios.json` contains 24 explicitly
hypothetical stock records: eight supplies for each of October, November, and
December. Every month is independent. All records say `Clinic_Approved: No`
and `Data_Type: Synthetic Simulation`; these are not LMIC stock balances.

For each mapping, expected clinic cases are predicted cases times capture rate;
expected services are that result times utilization rate; required supply units
are rounded up after multiplying by units per service. Requirements sharing a
supply are summed before comparing with its single monthly opening stock.
Projected remaining stock is opening stock minus required units. Replenishment
gap is `max(0, required units + safety stock - opening stock)`. A missing
mapping produces an error. A missing stock scenario shows **No Inventory
Scenario** without inventing a balance. The planner only reads JSON fixtures
and forecast results; it does not write database rows, alter stock, or create
purchase orders. Neither the service mappings nor inventory assumptions are
clinic approved or suitable for operational purchasing.

The page highlights up to three illustrative equipment items. It ranks them by
linked hypothetical supply gap, then by whether the separate historical weather
scenario increases the associated disease's simulated cases, then by estimated
service demand. It also lists the three largest hypothetical replenishment gaps.
The historical weather scenario is context for the highlight, not a 2026 rain
forecast or a verified purchasing recommendation.

## Open-Meteo weather context

The admin Forecast page shows current model weather for Calamba City, Laguna
from Open-Meteo through `GET /admin/api/forecast/weather`. The Laravel
`OpenMeteoWeatherService` requests temperature, relative humidity, and
precipitation for coordinates 14.2106, 121.1638 in `Asia/Manila`. Current
precipitation is labeled with the response's measurement interval. A successful
response is cached for ten minutes; the last successful response remains
available for up to one day and is visibly marked stale if a refresh fails.
Without a usable response, the page shows an error rather than invented values.
Current weather is context only and never changes disease or resource calculations.

Use `php artisan weather:sync-month YYYY-MM` to retrieve a **completed past
month** from Open-Meteo's historical archive. The command saves a separate
JSON aggregate under `storage/app/private/weather/monthly/`. It averages
available hourly temperature and humidity, sums hourly precipitation, and
records expected and available hours, observation dates, source, and update
time. An incomplete month is marked incomplete; it is not treated as a ready
model input. The archive's reanalysis/model estimates are not necessarily
Calamba weather-station readings. These files are separate from the Python
synthetic training workbook.

The existing `GET /forecast` and Laravel monthly/resource routes continue to
use the synthetic 2025 weather proxy. For October–December 2026, the page also
loads a **separate experimental comparison** through
`GET /admin/api/forecast/weather-scenario?year=2026&month=10`. Laravel reads or
syncs a complete historical Open-Meteo analog month (September 2025 for
October, October 2025 for November, November 2025 for December) and sends its
monthly average temperature, monthly average humidity, and monthly rainfall
total to FastAPI `POST /forecast/weather-scenario`. FastAPI substitutes those
values only for the selected month's `Avg_Temp_lag1`, `Humidity_Pct_lag1`, and
`Rainfall_mm_lag1` features. Earlier recursive predictions and all disease
training data remain synthetic. The UI compares these scenario counts with the
unchanged baseline, while the resource planner continues to use the baseline.

This is a sensitivity demonstration using **historical 2025 weather as an
analog**, not an Open-Meteo forecast for the selected 2026 month or a validated
disease prediction. The current weather reading is never used as a monthly lag.
The saved model was trained with scikit-learn 1.6.1; loading it under a
different version raises an incompatibility warning and needs dependency
alignment before relying on results. Appropriate disease data, a compatibility
review, and chronological evaluation are still needed for a weather-driven
operational model. Restart the FastAPI service after updating `ml_api/main.py`
so it serves the new scenario endpoint.
