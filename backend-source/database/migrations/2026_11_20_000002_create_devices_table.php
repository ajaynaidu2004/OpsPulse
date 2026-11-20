<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('hostname', 255);
            $table->string('check_type', 20);
            $table->string('target', 500);
            $table->unsignedSmallInteger('port')->nullable();
            $table->unsignedInteger('interval_seconds')->default(60);
            $table->unsignedSmallInteger('timeout_seconds')->default(5);
            $table->boolean('is_enabled')->default(true);
            $table->string('last_status', 20)->default('unknown');
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamps();

            $table->index(['is_enabled', 'last_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
