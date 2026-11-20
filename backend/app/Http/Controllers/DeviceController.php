<?php

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DeviceController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Device::latest()->paginate(20),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'hostname' => ['required', 'string', 'max:255'],
            'check_type' => ['required', Rule::in(['http', 'tcp'])],
            'target' => ['required', 'string', 'max:500'],
            'port' => ['nullable', 'integer', 'between:1,65535'],
            'interval_seconds' => ['required', 'integer', 'between:10,3600'],
            'timeout_seconds' => ['required', 'integer', 'between:1,60'],
            'is_enabled' => ['sometimes', 'boolean'],
        ]);

        $device = Device::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Device created.',
            'data' => $device,
        ], 201);
    }

    public function show(Device $device)
    {
        return response()->json(['success' => true, 'data' => $device]);
    }

    public function update(Request $request, Device $device)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'hostname' => ['sometimes', 'string', 'max:255'],
            'check_type' => ['sometimes', Rule::in(['http', 'tcp'])],
            'target' => ['sometimes', 'string', 'max:500'],
            'port' => ['nullable', 'integer', 'between:1,65535'],
            'interval_seconds' => ['sometimes', 'integer', 'between:10,3600'],
            'timeout_seconds' => ['sometimes', 'integer', 'between:1,60'],
            'is_enabled' => ['sometimes', 'boolean'],
        ]);

        $device->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Device updated.',
            'data' => $device->fresh(),
        ]);
    }

    public function destroy(Device $device)
    {
        $device->delete();

        return response()->json(['success' => true, 'message' => 'Device deleted.']);
    }
}
