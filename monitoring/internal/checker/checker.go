package checker

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/YOUR_USERNAME/opspulse/monitoring/internal/models"
)

type Result struct {
	Status          string
	ResponseTimeMS  int
	HTTPStatus      *int
	ErrorMessage    string
}

func Check(ctx context.Context, device models.Device) Result {
	start := time.Now()
	timeout := time.Duration(device.TimeoutSeconds) * time.Second
	if timeout <= 0 {
		timeout = 5 * time.Second
	}

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	switch device.CheckType {
	case "http":
		return checkHTTP(ctx, device.Target, start)
	case "tcp":
		return checkTCP(ctx, device, start)
	default:
		return Result{Status: "down", ErrorMessage: "unsupported check type"}
	}
}

func checkHTTP(ctx context.Context, target string, start time.Time) Result {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target, nil)
	if err != nil {
		return Result{Status: "down", ErrorMessage: err.Error()}
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	elapsed := int(time.Since(start).Milliseconds())
	if err != nil {
		return Result{Status: "down", ResponseTimeMS: elapsed, ErrorMessage: err.Error()}
	}
	defer resp.Body.Close()

	status := resp.StatusCode
	if status >= 200 && status < 500 {
		return Result{Status: "up", ResponseTimeMS: elapsed, HTTPStatus: &status}
	}
	return Result{
		Status: "down", ResponseTimeMS: elapsed, HTTPStatus: &status,
		ErrorMessage: fmt.Sprintf("unexpected HTTP status: %d", status),
	}
}

func checkTCP(ctx context.Context, device models.Device, start time.Time) Result {
	port := 0
	if device.Port != nil {
		port = *device.Port
	}
	if port == 0 {
		return Result{Status: "down", ErrorMessage: "TCP check requires a port"}
	}

	address := net.JoinHostPort(device.Hostname, strconv.Itoa(port))
	dialer := net.Dialer{}
	conn, err := dialer.DialContext(ctx, "tcp", address)
	elapsed := int(time.Since(start).Milliseconds())
	if err != nil {
		return Result{Status: "down", ResponseTimeMS: elapsed, ErrorMessage: err.Error()}
	}
	_ = conn.Close()
	return Result{Status: "up", ResponseTimeMS: elapsed}
}
