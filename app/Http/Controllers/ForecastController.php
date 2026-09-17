<?php

namespace App\Http\Controllers;

use App\Services\MonthlyMlForecastService;
use App\Services\OpenMeteoWeatherService;
use App\Services\SyntheticResourcePlanningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class ForecastController extends Controller
{
    public function __construct(
        private readonly MonthlyMlForecastService $monthlyForecast,
        private readonly SyntheticResourcePlanningService $resourcePlanning,
        private readonly OpenMeteoWeatherService $weather,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/forecast/index');
    }

    public function monthly(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'year' => ['required', 'integer', 'in:2026'],
            'month' => ['required', 'integer', 'between:1,12'],
        ]);

        try {
            return response()->json($this->monthlyForecast->get((int) $filters['year'], (int) $filters['month']));
        } catch (\Illuminate\Http\Client\ConnectionException $exception) {
            return response()->json(['message' => 'The monthly forecast service is unavailable. Please try again later.'], 503);
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => 'Monthly forecast data is currently unavailable. Please try again later.'], 502);
        }
    }

    public function resources(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'year' => ['required', 'integer', 'in:2026'],
            'month' => ['required', 'integer', 'between:10,12'],
        ]);

        try {
            return response()->json($this->resourcePlanning->plan((int) $filters['year'], (int) $filters['month']));
        } catch (\Illuminate\Http\Client\ConnectionException $exception) {
            return response()->json(['message' => 'The monthly forecast service is unavailable. Please try again later.'], 503);
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => 'Synthetic resource planning is currently unavailable.'], 502);
        }
    }

    public function weather(): JsonResponse
    {
        try {
            return response()->json($this->weather->current());
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => 'Current weather is unavailable. Please try again later.'], 503);
        }
    }

    public function weatherScenario(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'year' => ['required', 'integer', 'in:2026'],
            'month' => ['required', 'integer', 'between:10,12'],
        ]);
        $month = (int) $filters['month'];

        try {
            $historical = $this->weather->completeHistoricalMonth(2025, $month - 1);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Complete Open-Meteo historical weather is unavailable for this scenario.'], 503);
        }

        try {
            return response()->json($this->monthlyForecast->weatherScenario(2026, $month, $historical));
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'The experimental weather scenario is unavailable.'], 503);
        }
    }
}
