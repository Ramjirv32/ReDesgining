package middleware

import (
	"sync"
	"sync/atomic"
	"time"

	"github.com/gofiber/fiber/v2"
)

var (
	rateLimits = map[string]RateLimitConfig{

		"general": {
			Max:        10000,
			Expiration: 60 * time.Second,
		},

		"auth": {
			Max:        1000,
			Expiration: 60 * time.Second,
		},

		"booking": {
			Max:        2000,
			Expiration: 60 * time.Second,
		},

		"upload": {
			Max:        500,
			Expiration: 60 * time.Second,
		},
	}

	storage    = &syncMapStorage{}
	maxEntries = int64(10000)
)

type RateLimitConfig struct {
	Max        int
	Expiration time.Duration
}

type syncMapStorage struct {
	data  sync.Map
	count int64
}

type rateLimitEntry struct {
	count     int32
	expiresAt int64
}

func (m *syncMapStorage) Get(key string) int {
	if value, ok := m.data.Load(key); ok {
		entry := value.(*rateLimitEntry)
		now := time.Now().Unix()
		if now > atomic.LoadInt64(&entry.expiresAt) {

			m.data.Delete(key)
			atomic.AddInt64(&m.count, -1)
			return 0
		}
		return int(atomic.LoadInt32(&entry.count))
	}
	return 0
}

func (m *syncMapStorage) Set(key string, value int, expiration time.Duration) {
	entry := &rateLimitEntry{
		count:     int32(value),
		expiresAt: time.Now().Add(expiration).Unix(),
	}
	m.data.Store(key, entry)

	if atomic.AddInt64(&m.count, 1) > maxEntries {
		go m.cleanup()
	}
}

func (m *syncMapStorage) Increment(key string, expiration time.Duration) int {
	now := time.Now().Unix()

	value, _ := m.data.LoadOrStore(key, &rateLimitEntry{
		count:     0,
		expiresAt: now + int64(expiration.Seconds()),
	})

	entry := value.(*rateLimitEntry)

	if now > atomic.LoadInt64(&entry.expiresAt) {
		atomic.StoreInt32(&entry.count, 1)
		atomic.StoreInt64(&entry.expiresAt, now+int64(expiration.Seconds()))
		return 1
	}

	newCount := atomic.AddInt32(&entry.count, 1)
	return int(newCount)
}

func (m *syncMapStorage) Reset(key string) {
	m.data.Delete(key)
	atomic.AddInt64(&m.count, -1)
}

func (m *syncMapStorage) cleanup() {
	now := time.Now().Unix()
	m.data.Range(func(key, value interface{}) bool {
		entry := value.(*rateLimitEntry)
		if now > atomic.LoadInt64(&entry.expiresAt) {
			m.data.Delete(key)
			atomic.AddInt64(&m.count, -1)
		}
		return true
	})
}

func RateLimit(category string) fiber.Handler {
	config, exists := rateLimits[category]
	if !exists {
		config = rateLimits["general"]
	}

	return func(c *fiber.Ctx) error {
		key := c.IP()

		count := storage.Get(key)
		if count >= config.Max {
			return c.Status(429).JSON(fiber.Map{
				"error": "Too many requests. Please try again later.",
			})
		}

		storage.Increment(key, config.Expiration)

		return c.Next()
	}
}

func StartRateLimitCleanup() {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			storage.cleanup()
		}
	}()
}

func GetRateLimitStats() map[string]interface{} {
	stats := make(map[string]interface{})
	stats["total_entries"] = atomic.LoadInt64(&storage.count)

	activeEntries := int64(0)
	now := time.Now().Unix()
	storage.data.Range(func(key, value interface{}) bool {
		entry := value.(*rateLimitEntry)
		if now < atomic.LoadInt64(&entry.expiresAt) {
			activeEntries++
		}
		return true
	})
	stats["active_entries"] = activeEntries

	return stats
}

func RateLimitByPath(c *fiber.Ctx) error {
	path := c.Path()

	var category string
	switch {
	case path == "/api/organizer/login" ||
		path == "/api/organizer/verify-otp" ||
		path == "/api/organizer/google-auth" ||
		path == "/api/user/login" ||
		path == "/api/user/verify-otp":
		category = "auth"
	case path == "/api/play/book" ||
		path == "/api/events/book" ||
		path == "/api/dining/book":
		category = "booking"
	case path == "/api/organizer/upload-media":
		category = "upload"
	default:
		category = "general"
	}

	handler := RateLimit(category)
	return handler(c)
}
