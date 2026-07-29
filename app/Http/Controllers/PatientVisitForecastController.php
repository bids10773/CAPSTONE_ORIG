<?php

namespace App\Http\Controllers;

use App\Http\Requests\PatientVisitForecastRequest;
use App\Services\PatientVisitForecastService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class PatientVisitForecastController extends Controller
{
    public function __construct(private readonly PatientVisitForecastService $service) {}

    public function index(PatientVisitForecastRequest $request): Response
    {
        $filters = $request->validated();

        return Inertia::render('admin/patient-visits/index', [
            'initialData' => $this->service->dashboard(
                isset($filters['year']) ? (int) $filters['year'] : null,
                (int) ($filters['horizon'] ?? 12),
            ),
        ]);
    }

    public function dashboard(PatientVisitForecastRequest $request): JsonResponse
    {
        $filters = $request->validated();

        return response()->json($this->service->dashboard(
            isset($filters['year']) ? (int) $filters['year'] : null,
            (int) ($filters['horizon'] ?? 12),
        ));
    }
}
