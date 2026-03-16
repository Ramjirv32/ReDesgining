import { revalidatePath } from 'next/cache';

export class LRUCache<T = unknown> {
    private cache: Map<string, T>;
    private maxSize: number;

    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    get(key: string): T | undefined {
        if (!this.cache.has(key)) {
            return undefined;
        }
        const value = this.cache.get(key)!;
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key: string, value: T): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    has(key: string): boolean {
        return this.cache.has(key);
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }
}

export const eventCache = new LRUCache(50);
export const playCache = new LRUCache(50);
export const diningCache = new LRUCache(50);

// Cache invalidation for admin updates
export async function invalidateEventCache(eventName: string) {
    eventCache.delete(eventName);
    try {
        revalidatePath(`/events/${encodeURIComponent(eventName)}`);
    } catch (e) {
        console.log('revalidatePath not available (API route)');
    }
}

export async function invalidatePlayCache(venueName: string) {
    playCache.delete(venueName);
    try {
        revalidatePath(`/play/${encodeURIComponent(venueName)}`);
    } catch (e) {
        console.log('revalidatePath not available (API route)');
    }
}

export async function invalidateDiningCache(venueName: string) {
    diningCache.delete(venueName);
    try {
        revalidatePath(`/dining/venue/${encodeURIComponent(venueName)}`);
    } catch (e) {
        console.log('revalidatePath not available (API route)');
    }
}
