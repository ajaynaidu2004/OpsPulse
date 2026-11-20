package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/YOUR_USERNAME/opspulse/monitoring/internal/client"
	"github.com/YOUR_USERNAME/opspulse/monitoring/internal/config"
	"github.com/YOUR_USERNAME/opspulse/monitoring/internal/worker"
)

func main() {
	cfg := config.Load()
	apiClient := client.New(cfg.APIBaseURL, cfg.ServiceToken, 10*time.Second)
	monitor := worker.New(apiClient, cfg.PollInterval)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	log.Println("OpsPulse monitoring worker started")
	if err := monitor.Run(ctx); err != nil && err != context.Canceled {
		log.Fatalf("monitor stopped: %v", err)
	}
}
