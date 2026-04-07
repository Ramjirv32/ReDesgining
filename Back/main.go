package main

import (
	"os"
	"os/signal"
	"syscall"
	"time"
	stdlog "log"
	
	"ticpin-backend/pkg/app"
	"ticpin-backend/config"
	"ticpin-backend/worker"
	"github.com/rs/zerolog/log"
)

func main() {
	fiberApp := app.InitApp()

	port := os.Getenv("PORT")
	if port == "" {
		port = "9000"
	}

	go func() {
		if err := fiberApp.Listen(":" + port); err != nil {
			log.Printf("Listen: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")
	if os.Getenv("VERCEL") != "1" {
		worker.Shutdown()
	}
	
	if err := fiberApp.ShutdownWithTimeout(10 * time.Second); err != nil {
		stdlog.Printf("Shutdown: %v", err)
	}

	if config.MongoClient != nil {
		if err := config.MongoClient.Disconnect(nil); err != nil {
			stdlog.Printf("MongoDB Disconnect: %v", err)
		}
	}
	log.Info().Msg("Server exited")
}
