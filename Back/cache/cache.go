package cache

import (
	"crypto/md5"
	"fmt"
	"sync"
	"time"
)

type item struct {
	value      interface{}
	expiration int64
}

type TTLCache struct {
	items    map[string]item
	mu       sync.RWMutex
	maxItems int
}

var GlobalCache = NewTTLCache(1000)

func NewTTLCache(maxItems int) *TTLCache {
	cache := &TTLCache{
		items:    make(map[string]item),
		maxItems: maxItems,
	}

	go func() {
		for {
			time.Sleep(1 * time.Minute)
			cache.mu.Lock()
			now := time.Now().UnixNano()
			for k, v := range cache.items {
				if v.expiration > 0 && now > v.expiration {
					delete(cache.items, k)
				}
			}
			cache.mu.Unlock()
		}
	}()
	return cache
}

func (c *TTLCache) Set(key string, value interface{}, ttl time.Duration) {
	var expiration int64
	if ttl > 0 {
		expiration = time.Now().Add(ttl).UnixNano()
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	if c.maxItems > 0 && len(c.items) >= c.maxItems {
		for k := range c.items {
			delete(c.items, k)
			break
		}
	}

	c.items[key] = item{
		value:      value,
		expiration: expiration,
	}
}

func (c *TTLCache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	it, ok := c.items[key]
	if !ok {
		return nil, false
	}
	if it.expiration > 0 && time.Now().UnixNano() > it.expiration {
		return nil, false
	}
	return it.value, true
}

func (c *TTLCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

// DeletePattern removes all cache keys matching a pattern
func (c *TTLCache) DeletePattern(pattern string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for key := range c.items {
		if matchesPattern(key, pattern) {
			delete(c.items, key)
		}
	}
}

// DeleteByPrefix removes all cache keys with a given prefix
func (c *TTLCache) DeleteByPrefix(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for key := range c.items {
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			delete(c.items, key)
		}
	}
}

// Clear empties the entire cache
func (c *TTLCache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items = make(map[string]item)
}

// Stats returns cache statistics
func (c *TTLCache) Stats() map[string]interface{} {
	c.mu.RLock()
	defer c.mu.RUnlock()

	expired := 0
	now := time.Now().UnixNano()
	for _, v := range c.items {
		if v.expiration > 0 && now > v.expiration {
			expired++
		}
	}

	return map[string]interface{}{
		"total_items":   len(c.items),
		"expired_items": expired,
		"active_items":  len(c.items) - expired,
		"max_items":     c.maxItems,
	}
}

// Helper function to generate cache keys with parameters
func GenerateKey(prefix string, params ...interface{}) string {
	key := prefix
	for _, param := range params {
		key += fmt.Sprintf(":%v", param)
	}
	// Hash long keys to keep them manageable
	if len(key) > 100 {
		hash := md5.Sum([]byte(key))
		key = prefix + ":" + fmt.Sprintf("%x", hash)[:8]
	}
	return key
}

// Helper function to match cache key patterns
func matchesPattern(key, pattern string) bool {
	// Simple pattern matching - can be enhanced with regex if needed
	if pattern == "*" {
		return true
	}
	return len(key) >= len(pattern) && key[:len(pattern)] == pattern
}

// CacheManager provides high-level cache operations
type CacheManager struct {
	cache *TTLCache
}

func NewCacheManager() *CacheManager {
	return &CacheManager{cache: GlobalCache}
}

// Entity caching methods
func (cm *CacheManager) SetEntity(entityType, id string, data interface{}, ttl time.Duration) {
	key := fmt.Sprintf("%s:%s", entityType, id)
	cm.cache.Set(key, data, ttl)
}

func (cm *CacheManager) GetEntity(entityType, id string) (interface{}, bool) {
	key := fmt.Sprintf("%s:%s", entityType, id)
	return cm.cache.Get(key)
}

func (cm *CacheManager) DeleteEntity(entityType, id string) {
	key := fmt.Sprintf("%s:%s", entityType, id)
	cm.cache.Delete(key)
}

// List caching methods
func (cm *CacheManager) SetList(entityType string, params []interface{}, data interface{}, ttl time.Duration) {
	key := GenerateKey("list:"+entityType, params...)
	cm.cache.Set(key, data, ttl)
}

func (cm *CacheManager) GetList(entityType string, params []interface{}) (interface{}, bool) {
	key := GenerateKey("list:"+entityType, params...)
	return cm.cache.Get(key)
}

func (cm *CacheManager) DeleteList(entityType string) {
	cm.cache.DeleteByPrefix("list:" + entityType)
}

// Invalidate all cache for an entity type
func (cm *CacheManager) InvalidateEntityType(entityType string) {
	cm.cache.DeleteByPrefix(entityType + ":")
	cm.cache.DeleteByPrefix("list:" + entityType)
}

// Common TTL constants
const (
	TTLShort  = 5 * time.Minute  // For frequently changing data
	TTLMedium = 15 * time.Minute // For moderately changing data
	TTLLong   = 1 * time.Hour    // For relatively static data
)
