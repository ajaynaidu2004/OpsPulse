package config

import (
	"os"
	"time"
)

type Config struct {
	APIBaseURL   string
	ServiceToken string
	PollInterval time.Duration
}

func Load() Config {
	return Config{
		APIBaseURL:   env("API_BASE_URL", "http://127.0.0.1:8000/api"),
		ServiceToken: env("MONITORING_SERVICE_TOKEN", ""),
		PollInterval: duration("POLL_INTERVAL", 15*time.Second),
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func duration(key string, fallback time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}
