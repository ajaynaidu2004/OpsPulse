<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyMonitoringToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('services.monitoring.token');
        $provided = (string) $request->bearerToken();

        if ($expected === '' || ! hash_equals($expected, $provided)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated monitoring service.',
            ], 401);
        }

        return $next($request);
    }
}
