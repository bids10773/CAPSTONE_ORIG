<?php

use App\Rules\PasswordComplexity;
use Illuminate\Support\Facades\Validator;

uses(Tests\TestCase::class);

test('password complexity accepts any three of the four character categories', function (string $password) {
    $validator = Validator::make(['password' => $password], [
        'password' => ['required', 'string', 'min:8', new PasswordComplexity],
    ]);

    expect($validator->passes())->toBeTrue();
})->with([
    'uppercase lowercase number' => 'Hello123',
    'lowercase number symbol' => 'hello123!',
    'uppercase number symbol' => 'HELLO123!',
    'uppercase lowercase symbol' => 'Hello!!!',
]);

test('password complexity rejects fewer than three categories or fewer than eight characters', function (string $password) {
    $validator = Validator::make(['password' => $password], [
        'password' => ['required', 'string', 'min:8', new PasswordComplexity],
    ]);

    expect($validator->fails())->toBeTrue();
})->with([
    'lowercase and number only' => 'hello123',
    'uppercase only' => 'HELLOWORLD',
    'number and symbol only' => '12345678!',
    'all categories but too short' => 'Ab1!',
    'lowercase only' => 'abcdefgh',
]);
