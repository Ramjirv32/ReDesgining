package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"ticpin-backend/config"
	"ticpin-backend/pkg/app"
)

func main() {
	// Initialize the application
	fiberApp := app.InitApp()

	port := os.Getenv("PORT")
	if port == "" {
		port = "9001" // Use a different port for the Postgres backend during migration
	}

	// Start the server in a goroutine
	go func() {
		log.Printf("Starting Postgres-backend server on port %s", port)
		if err := fiberApp.Listen(":" + port); err != nil {
			log.Fatalf("Listen error: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down Postgres-backend server...")

	// Close database connection if needed (GORM handles most connection pooling automatically)
	// But it's good practice to close if possible, though GORM doesn't provide a direct Close() on the *gorm.DB object
	// You usually get the underlying *sql.DB object to close it.
	if config.DB != nil {
		sqlDB, err := config.DB.DB()
		if err == nil {
			sqlDB.Close()
			log.Println("PostgreSQL connection closed")
		}
	}

	if err := fiberApp.ShutdownWithTimeout(10 * time.Second); err != nil {
		log.Printf("Shutdown error: %v", err)
	}

	log.Println("Server exited")
}
