<?php

namespace App\Http\Controllers;

use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class IncidentController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Incident::with(['device:id,name,hostname', 'assignee:id,name,email'])
                ->latest()
                ->paginate(20),
        ]);
    }

    public function update(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['open', 'in_progress', 'resolved'])],
            'severity' => ['sometimes', Rule::in(['low', 'medium', 'high', 'critical'])],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'description' => ['sometimes', 'string', 'max:5000'],
        ]);

        if (($validated['status'] ?? null) === 'resolved') {
            $validated['resolved_at'] = now();
        } elseif (($validated['status'] ?? null) !== null) {
            $validated['resolved_at'] = null;
        }

        $incident->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Incident updated.',
            'data' => $incident->fresh(['device', 'assignee']),
        ]);
    }
}
