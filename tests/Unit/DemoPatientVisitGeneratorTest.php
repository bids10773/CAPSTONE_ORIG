<?php

use App\Services\DemoPatientVisitGenerator;

it('generates sixty realistic and clearly marked demo months', function () {
    $rows = app(DemoPatientVisitGenerator::class)->generate();

    expect($rows)->toHaveCount(60)
        ->and($rows[0]['month'])->toBe('2021-01')
        ->and($rows[59]['month'])->toBe('2025-12');

    foreach ($rows as $row) {
        expect($row['is_demo'])->toBeTrue()
            ->and($row['total_visits'])->toBe(
                $row['walk_in']
                + $row['online_appointments']
                + $row['company_referrals']
                + $row['ape']
                + $row['follow_up'],
            );

        foreach (['walk_in', 'online_appointments', 'company_referrals', 'ape', 'follow_up', 'emergency_walk_ins'] as $category) {
            expect($row[$category])->toBeGreaterThanOrEqual(0);
        }
    }
});

it('contains seasonal demand and gradual annual growth', function () {
    $rows = collect(app(DemoPatientVisitGenerator::class)->generate());
    $annual = $rows->groupBy(fn ($row) => substr($row['month'], 0, 4))
        ->map->sum('total_visits');

    foreach ($annual->values()->sliding(2) as $pair) {
        $pair = $pair->values();
        $growth = (($pair[1] - $pair[0]) / $pair[0]) * 100;
        expect($growth)->toBeGreaterThan(2)->toBeLessThan(5.5);
    }

    $rainyWalkIns = $rows->filter(fn ($row) => in_array(substr($row['month'], 5, 2), ['06', '07', '08', '09', '10']))
        ->avg('walk_in');
    $springWalkIns = $rows->filter(fn ($row) => in_array(substr($row['month'], 5, 2), ['04', '05']))
        ->avg('walk_in');

    expect($rainyWalkIns)->toBeGreaterThan($springWalkIns);
});
