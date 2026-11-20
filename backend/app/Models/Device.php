<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Device extends Model
{
    protected $fillable = [
        'name', 'hostname', 'check_type', 'target', 'port',
        'interval_seconds', 'timeout_seconds', 'is_enabled',
        'last_status', 'last_checked_at',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'last_checked_at' => 'datetime',
        ];
    }

    public function monitoringEvents(): HasMany
    {
        return $this->hasMany(MonitoringEvent::class);
    }

    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class);
    }
}
