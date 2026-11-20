<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\IncidentController;
use App\Http\Controllers\MonitoringController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('devices', DeviceController::class);
    Route::get('/incidents', [IncidentController::class, 'index']);
    Route::patch('/incidents/{incident}', [IncidentController::class, 'update']);
});

Route::prefix('monitoring')
    ->middleware('monitoring.token')
    ->group(function () {
        Route::get('/targets', [MonitoringController::class, 'targets']);
        Route::post('/events', [MonitoringController::class, 'store']);
    });
