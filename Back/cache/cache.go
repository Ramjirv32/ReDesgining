package cache

import (
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
