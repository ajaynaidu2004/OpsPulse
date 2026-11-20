<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('opspulse:about', function () {
    $this->info('OpsPulse monitoring and incident management platform.');
})->purpose('Display OpsPulse application information');
