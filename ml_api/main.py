from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import math

app = FastAPI(title="LMIC ML API")


@app.get("/")
def home():
    return {"message": "ML API is running"}


@app.post("/predict")
def predict(data: dict):
    value = data.get("input")
    result = value * 2
    return {"prediction": result}

from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from fastapi import HTTPException, Query


# Locate the ml_api folder automatically
BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = (
    BASE_DIR / "models" / "LMIC_Monthly_Models.pkl"
)

DATA_PATH = (
    BASE_DIR / "data" / "monthly_history.xlsx"
)


# Load the trained model
model_bundle = joblib.load(MODEL_PATH)

trained_models = model_bundle["models"]

diseases = list(trained_models.keys())


# Load the original monthly dataset
df = pd.read_excel(
    DATA_PATH,
    sheet_name="Monthly_Wide_2021_2025"
)

# Create the date column
df["Date"] = pd.to_datetime(
    df["Year"].astype(str)
    + "-"
    + df["Month_Name"].astype(str),
    format="%Y-%B"
)

df = df.sort_values("Date").reset_index(drop=True)

# Check that the required historical records exist
expected_dates = pd.date_range(
    "2021-01-01",
    "2025-12-01",
    freq="MS"
)

if df["Date"].tolist() != list(expected_dates):
    raise ValueError(
        "The monthly dataset must contain "
        "all months from January 2021 "
        "to December 2025."
    )


# ==========================================
# FORECAST ENDPOINT
# ==========================================

def _run_forecast(year: int, month: int, weather_override: dict | None = None):

    # Our current demo supports only 2026
    if year != 2026:
        raise HTTPException(
            status_code=400,
            detail="The current simulation supports 2026 only."
        )

    # Start from December 2025
    december = df.loc[
        df["Date"] == pd.Timestamp("2025-12-01")
    ].iloc[0]

    last_cases = {
        disease: float(december[disease])
        for disease in diseases
    }

    last_weather = {
        "Avg_Temp": float(december["Avg_Temp"]),
        "Humidity_Pct": float(december["Humidity_Pct"]),
        "Rainfall_mm": float(december["Rainfall_mm"])
    }

    requested_results = []

    # Forecast sequentially from January
    # through the requested month
    for current_month in range(1, month + 1):

        if current_month == month and weather_override is not None:
            # Only the selected month's lagged weather changes in this
            # experimental run. Earlier recursive case estimates stay synthetic.
            last_weather = {
                "Avg_Temp": weather_override["avg_temp_c"],
                "Humidity_Pct": weather_override["avg_humidity_percent"],
                "Rainfall_mm": weather_override["total_rainfall_mm"],
            }

        previous_year = df.loc[
            df["Date"] == pd.Timestamp(
                year=2025,
                month=current_month,
                day=1
            )
        ].iloc[0]

        current_cases = []
        new_case_values = {}

        for disease in diseases:

            saved = trained_models[disease]

            # Prepare the same features
            # used during training
            sample = pd.DataFrame([{

                "Month_Sin": np.sin(
                    2 * np.pi * current_month / 12
                ),

                "Month_Cos": np.cos(
                    2 * np.pi * current_month / 12
                ),

                "Cases_Lag1": last_cases[disease],

                "Cases_Lag12": float(
                    previous_year[disease]
                ),

                "Avg_Temp_lag1":
                    last_weather["Avg_Temp"],

                "Humidity_Pct_lag1":
                    last_weather["Humidity_Pct"],

                "Rainfall_mm_lag1":
                    last_weather["Rainfall_mm"]

            }])

            # Use the selected method
            if saved["method"] == "Random Forest":

                prediction = saved["model"].predict(
                    sample[saved["features"]]
                )[0]

            else:

                prediction = previous_year[disease]

            prediction = max(
                0.0,
                float(prediction)
            )

            new_case_values[disease] = prediction

            current_cases.append({

                "disease": disease.replace(
                    "_Cases", ""
                ),

                "predicted_cases": round(prediction),

                "method": saved["method"]

            })

        # Feed predictions into the next month
        last_cases = new_case_values

        # Synthetic weather scenario:
        # Reuse corresponding 2025 weather.
        # NOT actual 2026 API weather.
        last_weather = {
            "Avg_Temp": float(
                previous_year["Avg_Temp"]
            ),

            "Humidity_Pct": float(
                previous_year["Humidity_Pct"]
            ),

            "Rainfall_mm": float(
                previous_year["Rainfall_mm"]
            )
        }

        requested_results = current_cases

    forecast_date = pd.Timestamp(
        year=year,
        month=month,
        day=1
    )

    result = {

        "forecast_month":
            forecast_date.strftime("%B %Y"),

        "data_type": "Synthetic Simulation",

        "validated_on_real_data": False,

        "weather_assumption":
            "Synthetic 2025 weather proxy",

        "predictions": requested_results

    }

    if weather_override is not None:
        result["weather_assumption"] = "Open-Meteo 2025 historical analog for selected month's lagged weather"
        result["weather_source"] = "Open-Meteo historical reanalysis/model estimates"
        result["weather_source_month"] = weather_override["source_month"]
        result["scenario_only"] = True

    return result


@app.get("/forecast")
def forecast(year: int = Query(...), month: int = Query(..., ge=1, le=12)):
    return _run_forecast(year, month)


class WeatherScenarioInput(BaseModel):
    year: int
    month: int
    source_month: str
    avg_temp_c: float
    avg_humidity_percent: float
    total_rainfall_mm: float


@app.post("/forecast/weather-scenario")
def weather_scenario(data: WeatherScenarioInput):
    if data.year != 2026 or not 1 <= data.month <= 12:
        raise HTTPException(status_code=422, detail="The scenario supports 2026 only.")
    expected_source = "2025-12" if data.month == 1 else f"2025-{data.month - 1:02d}"
    if data.source_month != expected_source:
        raise HTTPException(status_code=422, detail="The historical analog month does not match the lagged feature.")
    if not all(math.isfinite(value) for value in (
        data.avg_temp_c, data.avg_humidity_percent, data.total_rainfall_mm
    )) or not (-50 <= data.avg_temp_c <= 60 and 0 <= data.avg_humidity_percent <= 100
              and 0 <= data.total_rainfall_mm <= 10000):
        raise HTTPException(status_code=422, detail="Historical weather values are invalid.")

    return _run_forecast(data.year, data.month, data.model_dump())
