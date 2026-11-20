package models

import "time"

type Device struct {
	ID              uint   `json:"id"`
	Name            string `json:"name"`
	Hostname        string `json:"hostname"`
	CheckType       string `json:"check_type"`
	Target          string `json:"target"`
	Port            *int   `json:"port"`
	IntervalSeconds int    `json:"interval_seconds"`
	TimeoutSeconds  int    `json:"timeout_seconds"`
}

type APIResponse[T any] struct {
	Success bool `json:"success"`
	Data    T    `json:"data"`
}

type Event struct {
	DeviceID       uint      `json:"device_id"`
	Status         string    `json:"status"`
	ResponseTimeMS *int      `json:"response_time_ms,omitempty"`
	HTTPStatus     *int      `json:"http_status,omitempty"`
	ErrorMessage   string    `json:"error_message,omitempty"`
	CheckedAt      time.Time `json:"checked_at"`
}
