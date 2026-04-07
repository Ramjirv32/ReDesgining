package handler

import (
	"net/http"
	"sync"
	"ticpin-backend/pkg/app"
	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
)

var (
	fiberApp *fiber.App
	once     sync.Once
)

// Handler is the entry point for Vercel Serverless Functions
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(func() {
		fiberApp = app.InitApp()
	})
	adaptor.FiberApp(fiberApp)(w, r)
}
