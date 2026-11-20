<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Incident;
use App\Models\MonitoringEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MonitoringController extends Controller
{
    public function targets()
    {
        return response()->json([
            'success' => true,
            'data' => Device::query()
                ->where('is_enabled', true)
                ->get([
                    'id', 'name', 'hostname', 'check_type', 'target',
                    'port', 'interval_seconds', 'timeout_seconds',
                ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'device_id' => ['required', 'integer', 'exists:devices,id'],
            'status' => ['required', Rule::in(['up', 'down'])],
            'response_time_ms' => ['nullable', 'integer', 'min:0'],
            'http_status' => ['nullable', 'integer', 'between:100,599'],
            'error_message' => ['nullable', 'string', 'max:2000'],
            'checked_at' => ['required', 'date'],
        ]);

        $device = Device::findOrFail($validated['device_id']);

        DB::transaction(function () use ($device, $validated) {
            MonitoringEvent::create($validated);

            $previousStatus = $device->last_status;
            $device->update([
                'last_status' => $validated['status'],
                'last_checked_at' => $validated['checked_at'],
            ]);

            if ($validated['status'] === 'down' && $previousStatus !== 'down') {
                $hasOpenIncident = $device->incidents()
                    ->whereIn('status', ['open', 'in_progress'])
                    ->exists();

                if (! $hasOpenIncident) {
                    Incident::create([
                        'device_id' => $device->id,
                        'title' => "Device unavailable: {$device->name}",
                        'description' => $validated['error_message'] ?? 'Health check failed.',
                        'severity' => 'high',
                        'status' => 'open',
                    ]);
                }
            }

            if ($validated['status'] === 'up' && $previousStatus === 'down') {
                // Recovery is recorded in monitoring history. An operator resolves the incident.
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Monitoring event recorded.',
        ], 201);
    }
}
