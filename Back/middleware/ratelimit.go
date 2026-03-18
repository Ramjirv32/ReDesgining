package middleware

import (
	"sync"
	"sync/atomic"
	"time"

	"github.com/gofiber/fiber/v2"
)

// Rate limiting configuration
var (
	// Different rate limits for different endpoints
	rateLimits = map[string]RateLimitConfig{
		// General API: 100 requests per minute
		"general": {
			Max:        100,
			Expiration: 60 * time.Second,
		},
		// Authentication endpoints: 10 requests per minute
		"auth": {
			Max:        10,
			Expiration: 60 * time.Second,
		},
		// Booking endpoints: 20 requests per minute
		"booking": {
			Max:        20,
			Expiration: 60 * time.Second,
		},
		// Upload endpoints: 5 requests per minute
		"upload": {
			Max:        5,
			Expiration: 60 * time.Second,
		},
	}

	// Thread-safe storage for rate limiting using sync.Map
	storage    = &syncMapStorage{}
	maxEntries = int64(10000) // Maximum entries to prevent memory leaks
)

type RateLimitConfig struct {
	Max        int
	Expiration time.Duration
}

// Thread-safe storage using sync.Map
type syncMapStorage struct {
	data  sync.Map
	count int64 // Atomic counter for total entries
}

type rateLimitEntry struct {
	count     int32
	expiresAt int64 // Unix timestamp for atomic operations
}

func (m *syncMapStorage) Get(key string) int {
	if value, ok := m.data.Load(key); ok {
		entry := value.(*rateLimitEntry)
		now := time.Now().Unix()
		if now > atomic.LoadInt64(&entry.expiresAt) {
			// Entry expired, remove it
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

	// Check if we need to clean up old entries
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

	// Check if expired
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

// Cleanup expired entries
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

// Custom rate limiter middleware
func RateLimit(category string) fiber.Handler {
	config, exists := rateLimits[category]
	if !exists {
		config = rateLimits["general"]
	}

	return func(c *fiber.Ctx) error {
		key := c.IP()

		// Check current count
		count := storage.Get(key)
		if count >= config.Max {
			return c.Status(429).JSON(fiber.Map{
				"error": "Too many requests. Please try again later.",
			})
		}

		// Increment counter
		storage.Increment(key, config.Expiration)

		return c.Next()
	}
}

// Cleanup expired entries periodically
func StartRateLimitCleanup() {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			storage.cleanup()
		}
	}()
}

// Get rate limit stats (for monitoring)
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

// Endpoint-specific rate limiting
func RateLimitByPath(c *fiber.Ctx) error {
	path := c.Path()

	// Determine rate limit category based on path
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

	// Apply rate limit
	handler := RateLimit(category)
	return handler(c)
}
