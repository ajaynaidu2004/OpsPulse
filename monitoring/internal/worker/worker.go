package worker

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/YOUR_USERNAME/opspulse/monitoring/internal/checker"
	"github.com/YOUR_USERNAME/opspulse/monitoring/internal/client"
	"github.com/YOUR_USERNAME/opspulse/monitoring/internal/models"
)

type Worker struct {
	api      *client.Client
	interval time.Duration
}

func New(api *client.Client, interval time.Duration) *Worker {
	return &Worker{api: api, interval: interval}
}

func (w *Worker) Run(ctx context.Context) error {
	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()

	if err := w.checkAll(ctx); err != nil {
		log.Printf("initial monitoring cycle: %v", err)
	}

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			if err := w.checkAll(ctx); err != nil {
				log.Printf("monitoring cycle: %v", err)
			}
		}
	}
}

func (w *Worker) checkAll(ctx context.Context) error {
	devices, err := w.api.Targets()
	if err != nil {
		return err
	}

	var wg sync.WaitGroup
	limit := make(chan struct{}, 10)

	for _, device := range devices {
		device := device
		wg.Add(1)
		go func() {
			defer wg.Done()
			select {
			case limit <- struct{}{}:
			case <-ctx.Done():
				return
			}
			defer func() { <-limit }()

			result := checker.Check(ctx, device)
			responseTime := result.ResponseTimeMS
			event := models.Event{
				DeviceID: device.ID,
				Status: result.Status,
				ResponseTimeMS: &responseTime,
				HTTPStatus: result.HTTPStatus,
				ErrorMessage: result.ErrorMessage,
				CheckedAt: time.Now().UTC(),
			}

			if err := w.api.SubmitEvent(event); err != nil {
				log.Printf("device %d event submission failed: %v", device.ID, err)
				return
			}
			log.Printf("device=%d name=%q status=%s latency=%dms",
				device.ID, device.Name, result.Status, result.ResponseTimeMS)
		}()
	}

	wg.Wait()
	return nil
}
