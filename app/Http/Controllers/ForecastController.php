<?php

namespace App\Http\Controllers;

use App\Http\Requests\ForecastRequest;
use App\Services\DiseaseForecastDashboardService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class ForecastController extends Controller
{
    public function __construct(private readonly DiseaseForecastDashboardService $dashboard) {}

    public function index(ForecastRequest $request): Response
    {
        return Inertia::render('admin/forecast/index', [
            'initialData' => $this->dashboard->dashboard($request->validated()),
        ]);
    }

    public function dashboard(ForecastRequest $request): JsonResponse
    {
        try {
            return response()->json($this->dashboard->dashboard($request->validated()));
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    public function disease(ForecastRequest $request, string $disease): JsonResponse
    {
        try {
            return response()->json($this->dashboard->dashboard([
                ...$request->validated(),
                'disease' => $disease,
            ]));
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 404);
        }
    }

    public function history(ForecastRequest $request): JsonResponse
    {
        $data = $this->dashboard->dashboard($request->validated());

        return response()->json([
            'meta' => $data['meta'],
            'filters' => $data['filters'],
            'history' => $data['history'],
        ]);
    }
}
