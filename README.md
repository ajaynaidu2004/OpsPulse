# OpsPulse

An IT service monitoring and incident management MVP built with Laravel, Go, React, TypeScript, and MySQL.

## Architecture

- `backend/`: Laravel REST API, authentication, device registry, monitoring event ingestion, incident lifecycle.
- `monitoring/`: Go worker that periodically fetches enabled devices, performs HTTP/TCP checks, and reports results to Laravel.
- `frontend/`: React + TypeScript dashboard.
- MySQL is accessed only by Laravel. The Go service communicates with Laravel over authenticated HTTP APIs.

## Requirements

- PHP 8.2+ (PHP 8.3 recommended)
- Composer 2
- Node.js 20+
- Go 1.22+
- MySQL 8+

## Quick start

### 1. Backend

The `backend/` directory contains the OpsPulse Laravel application-layer source. It does not vendor Laravel itself. Generate the standard Laravel 12 framework skeleton, then overlay the supplied source files. From the repository root run:

```powershell
Rename-Item backend backend-source
composer create-project laravel/laravel backend "^12.0"
Copy-Item backend-source\app backend\app -Recurse -Force
Copy-Item backend-source\routes\api.php backend\routes\api.php -Force
Copy-Item backend-source\routes\web.php backend\routes\web.php -Force
Copy-Item backend-source\routes\console.php backend\routes\console.php -Force
Copy-Item backend-source\database\migrations\*.php backend\database\migrations\ -Force
Copy-Item backend-source\database\factories\UserFactory.php backend\database\factories\UserFactory.php -Force
Copy-Item backend-source\tests\Feature\AuthenticationTest.php backend\tests\Feature\AuthenticationTest.php -Force
Copy-Item backend-source\bootstrap\app.php backend\bootstrap\app.php -Force
composer require laravel/sanctum
php artisan install:api
```

Keep Laravel's generated `config/services.php` and add this entry inside its returned array:

```php
'monitoring' => [
    'token' => env('MONITORING_SERVICE_TOKEN'),
],
```

Copy `backend-source\.env.example` to `backend\.env` (or merge its values into the generated `.env`), then run `php artisan key:generate`. The `install:api` command creates Sanctum's token migration, so do not copy the token migration from `backend-source`.

Create a MySQL database named `opspulse`, then update `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=opspulse
DB_USERNAME=root
DB_PASSWORD=your_password
MONITORING_SERVICE_TOKEN=replace-with-a-long-random-secret
```

Run migrations and start the API:

```powershell
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Register an account through the frontend or API. The first registered user is not automatically an administrator; assign roles through a seeder or database in this MVP.

### 2. Frontend

In another terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

Set `VITE_API_URL=http://127.0.0.1:8000/api` in `frontend/.env` if needed.

### 3. Go monitoring worker

In another terminal, set the environment variables in that PowerShell session (the Go worker intentionally uses environment variables directly and does not parse `.env` files):

```powershell
cd monitoring
$env:API_BASE_URL = "http://127.0.0.1:8000/api"
$env:MONITORING_SERVICE_TOKEN = "your-backend-monitoring-token"
$env:POLL_INTERVAL = "15s"
go mod tidy
go run ./cmd/monitor
```

The worker checks enabled HTTP and TCP targets at their configured intervals. It reports each result to Laravel. Laravel records the event and opens an incident on a DOWN transition if there is no unresolved incident for that device.

## API overview

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/register` | Public | Register |
| POST | `/api/login` | Public | Login |
| POST | `/api/logout` | Sanctum | Logout |
| GET | `/api/me` | Sanctum | Current user |
| GET/POST | `/api/devices` | Sanctum | List/create devices |
| GET/PUT/DELETE | `/api/devices/{device}` | Sanctum | Read/update/delete |
| GET | `/api/monitoring/targets` | Service token | Enabled monitoring targets |
| POST | `/api/monitoring/events` | Service token | Submit monitoring result |
| GET | `/api/incidents` | Sanctum | List incidents |
| PATCH | `/api/incidents/{incident}` | Sanctum | Update incident status/assignee |

## Important notes

This is a runnable portfolio MVP, not a hardened production deployment. Before production use, add rate limiting, stricter role/permission policies, secret management, HTTPS, audit logging, retention policies, alerting, observability, and comprehensive tests. Configure CORS for your actual frontend origin.

## Suggested next improvements

1. Add full RBAC with roles and permission policies.
2. Add incident assignment history and audit logs.
3. Add queue-based event processing and notification delivery.
4. Add dashboard charts and uptime calculations.
5. Add Docker Compose and CI pipelines.
